import express from 'express';
import { GroupBuy } from '../models/GroupBuy.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const deals = await GroupBuy.find().populate('products.productId');
        res.json(deals);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const deal = new GroupBuy(req.body);
    try {
        const newDeal = await deal.save();
        res.status(201).json(newDeal);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

router.patch('/:id/join', async (req, res) => {
    try {
        const deal = await GroupBuy.findById(req.params.id);
        if (!deal) return res.status(404).json({ message: 'Deal not found' });

        const { customerId, units = 1 } = req.body;

        // Add customer if not present (simple participation tracking)
        if (!deal.members.includes(customerId)) {
            deal.members.push(customerId);
        }

        // Update units tally
        deal.currentUnits = (deal.currentUnits || 0) + Number(units);

        await deal.save();
        res.json(deal);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export { router as groupBuyRouter };
