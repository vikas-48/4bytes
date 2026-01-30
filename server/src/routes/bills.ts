import express from 'express';
import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { CustomerAccount } from '../models/CustomerAccount.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { OTP } from '../models/OTP.js';
import { auth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const router = express.Router();

// 1. Request OTP for Khata Consent
router.post('/request-khata-otp', auth, async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        if (!phoneNumber || !amount) {
            return res.status(400).json({ message: 'Phone number and amount required' });
        }

        // Generate 6-digit OTP
        const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpValue, 10);

        const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds validity

        // Save OTP (binding to phone, amount, and shopkeeper)
        await OTP.create({
            phoneNumber,
            otpHash,
            amount,
            shopkeeperId: req.auth?.userId,
            expiresAt
        });

        // Send SMS via TextBee (Android Phone Gateway)
        try {
            const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY || 'YOUR_TEXTBEE_API_KEY';
            const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID || 'YOUR_DEVICE_ID';

            await axios.post(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
                to: phoneNumber,
                message: `KiranaLink: Your OTP for Khata consent (₹${amount}) is ${otpValue}. Valid for 60s.`,
            }, {
                headers: { 'x-api-key': TEXTBEE_API_KEY }
            });
            console.log(`[OTP] Sent to ${phoneNumber} via TextBee`);
        } catch (smsErr) {
            console.error('[OTP] TextBee Gateway Error:', smsErr);
        }

        res.json({ message: 'OTP sent successfully', expiresAt });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Create a new bill with stock check and ledger entry
router.post('/', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerPhoneNumber, customerName, items, paymentType, otp } = req.body;

        // 1. Find or Create Customer
        let customer = await Customer.findOne({ phoneNumber: customerPhoneNumber }).session(session);
        if (!customer) {
            customer = new Customer({
                phoneNumber: customerPhoneNumber,
                name: customerName || ''
            });
            await customer.save({ session });
        } else if (customerName && !customer.name) {
            // Update name if we have it and the existing record doesn't
            customer.name = customerName;
            await customer.save({ session });
        }

        let totalAmount = 0;
        const processedItems = [];

        // 2. Validate Stock and Calculate Total
        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

            // Reduce Stock
            product.stock -= item.quantity;
            await product.save({ session });

            totalAmount += product.price * item.quantity;
            processedItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        // 3. Khata OTP Verification (if applicable)
        if (paymentType === 'ledger') {
            if (!otp) {
                throw new Error('OTP verification required for Khata consent');
            }

            const otpRecord = await OTP.findOne({
                phoneNumber: customerPhoneNumber,
                amount: totalAmount,
                shopkeeperId: req.auth?.userId
            }).session(session);

            if (!otpRecord) {
                throw new Error('OTP expired or not found for this amount');
            }

            const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
            if (!isMatch) {
                throw new Error('Invalid OTP code');
            }

            // Consumption success - delete OTP record
            await OTP.findByIdAndDelete(otpRecord._id).session(session);
        }

        // 4. Create Bill
        const bill = new Bill({
            shopkeeperId: req.auth?.userId,
            customerId: customer._id,
            items: processedItems,
            totalAmount,
            paymentType
        });
        await bill.save({ session });

        // 4. Handle Ledger if applicable
        if (paymentType === 'ledger') {
            const ledgerEntry = new LedgerEntry({
                shopkeeperId: req.auth?.userId,
                customerId: customer._id,
                billId: bill._id,
                amount: totalAmount,
                type: 'debit',
                status: 'pending'
            });
            await ledgerEntry.save({ session });

            // Update customer running dues (shop-specific)
            let account = await CustomerAccount.findOne({
                customerId: customer._id,
                shopkeeperId: req.auth?.userId
            }).session(session);

            if (!account) {
                account = new CustomerAccount({
                    customerId: customer._id,
                    shopkeeperId: req.auth?.userId,
                    balance: totalAmount
                });
            } else {
                account.balance += totalAmount;
            }
            await account.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json(bill);
    } catch (err: any) {
        await session.abortTransaction();
        console.error('Bill Creation Error:', err.message);
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// Get all bills
router.get('/', auth, async (req, res) => {
    try {
        const bills = await Bill.find({ shopkeeperId: req.auth?.userId }).populate('customerId').sort({ createdAt: -1 });
        res.json(bills);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export { router as billRouter };
