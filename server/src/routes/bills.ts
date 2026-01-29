import express from 'express';
import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { LedgerEntry } from '../models/LedgerEntry.js';

const router = express.Router();

// Create a new bill with stock check and ledger entry
router.post('/', async (req, res) => {
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
            customerId: customer._id,
            items: processedItems,
            totalAmount,
            paymentType
        });
        await bill.save();

        // 4. Handle Ledger if applicable
        if (paymentType === 'ledger') {
            const ledgerEntry = new LedgerEntry({
                customerId: customer._id,
                billId: bill._id,
                amount: totalAmount,
                type: 'debit',
                status: 'pending'
            });
            await ledgerEntry.save();

            // Update customer running dues
            customer.khataBalance += totalAmount;
            await customer.save();
        }

        res.status(201).json(bill);
    } catch (err: any) {
        console.error('Bill Creation Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Get all bills
router.get('/', async (req, res) => {
    try {
        const bills = await Bill.find().populate('customerId').sort({ createdAt: -1 });
        res.json(bills);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export { router as billRouter };
