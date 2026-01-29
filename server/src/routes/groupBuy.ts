import express from 'express';
import { GroupBuy } from '../models/GroupBuy.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const deals = await GroupBuy.find({ shopkeeperId: req.auth?.userId }).populate('members').populate('products.productId');
        res.json(deals);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    const deal = new GroupBuy({ ...req.body, shopkeeperId: req.auth?.userId });
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

        const { customerId } = req.body;
        // @ts-ignore
        if (!deal.members.includes(customerId)) {
            // @ts-ignore
            deal.members.push(customerId);
            await deal.save();
        }
        res.json(deal);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export { router as groupBuyRouter };
