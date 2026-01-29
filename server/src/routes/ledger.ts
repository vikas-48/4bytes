import express from 'express';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Customer } from '../models/Customer.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get ledger for a specific customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const entries = await LedgerEntry.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Post a credit entry (customer pays back)
router.post('/payment', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { customerId, amount } = req.body;

        const entry = new LedgerEntry({
            customerId,
            amount,
            type: 'credit',
            status: 'settled'
        });
        await entry.save({ session });

        const customer = await Customer.findById(customerId).session(session);
        if (!customer) throw new Error('Customer not found');

        customer.khataBalance -= amount;
        await customer.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.status(201).json(entry);
    } catch (err: any) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
});

export { router as ledgerRouter };
