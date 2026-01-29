import express from 'express';
import mongoose from 'mongoose';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Customer } from '../models/Customer.js';
import { CustomerAccount } from '../models/CustomerAccount.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get ledger for a specific customer
router.get('/customer/:customerId', auth, async (req, res) => {
    try {
        const entries = await LedgerEntry.find({
            customerId: req.params.customerId,
            shopkeeperId: req.auth?.userId
        }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Post a credit entry (customer pays back)
router.post('/payment', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { customerId, amount } = req.body;

        const entry = new LedgerEntry({
            shopkeeperId: req.auth?.userId,
            customerId,
            amount,
            type: 'credit',
            status: 'settled'
        });
        await entry.save({ session });

        const account = await CustomerAccount.findOne({
            customerId,
            shopkeeperId: req.auth?.userId
        }).session(session);

        if (!account) throw new Error('Customer account for this shop not found');

        account.balance -= amount;
        await account.save({ session });

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
