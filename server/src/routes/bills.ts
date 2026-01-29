import express from 'express';
import fs from 'fs';
import path from 'path';
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
        let customer = await Customer.findOne({ phoneNumber: customerPhoneNumber });
        if (!customer) {
            customer = new Customer({ phoneNumber: customerPhoneNumber });
            await customer.save();
        }

        let totalAmount = 0;
        const processedItems = [];

        // 2. Validate Stock and Calculate Total
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

            // Reduce Stock
            product.stock -= item.quantity;
            await product.save();

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
        await bill.save();

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
            await ledgerEntry.save();

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

        res.status(201).json(bill);
    } catch (err: any) {
        console.error('Bill Creation Error:', err.message);
        res.status(400).json({ message: err.message });
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

// Endpoint to accept a PDF (base64) and simulate sending to customer
router.post('/send', auth, async (req, res) => {
    try {
        const { customerPhoneNumber, pdfBase64, fileName } = req.body;
        if (!pdfBase64 || !customerPhoneNumber) return res.status(400).json({ message: 'Missing data' });

        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

        const buffer = Buffer.from(pdfBase64, 'base64');
        const safeName = fileName || `bill_${customerPhoneNumber}_${Date.now()}.pdf`;
        const outPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(outPath, buffer);

        // TODO: integrate with SMS/email/WhatsApp provider to send the PDF to customer
        console.log(`Saved PDF for ${customerPhoneNumber} -> ${outPath}`);

        // Build public URL for client to use in share links
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const publicUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${encodeURIComponent(safeName)}`;

        return res.json({ message: 'PDF received and saved', url: publicUrl });
    } catch (e: any) {
        console.error('Error in /bills/send', e);
        return res.status(500).json({ message: 'Failed to process PDF' });
    }
});
