import express from 'express';
import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { CustomerAccount } from '../models/CustomerAccount.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create a new bill with stock check and ledger entry
router.post('/', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerPhoneNumber, items, paymentType } = req.body;

        // 1. Find or Create Customer
        let customer = await Customer.findOne({ phoneNumber: customerPhoneNumber }).session(session);
        if (!customer) {
            customer = new Customer({ phoneNumber: customerPhoneNumber });
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

        // 3. Create Bill
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
