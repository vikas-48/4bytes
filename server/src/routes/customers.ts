import express from 'express';
import { Customer } from '../models/Customer.js';
import { CustomerAccount } from '../models/CustomerAccount.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all customers for the current shop (with balances)
// Get all customers for the current shop (with balances)
router.get('/', auth, async (req, res) => {
    try {
        const { search } = req.query;
        let customers = [];

        // If searching, look Globally
        if (search) {
            const regex = new RegExp(String(search), 'i');
            const globalCustomers = await Customer.find({
                $or: [{ name: regex }, { phoneNumber: regex }]
            }).limit(10);

            // For each found customer, attach THIS shop's balance
            customers = await Promise.all(globalCustomers.map(async (cust: any) => {
                const account = await CustomerAccount.findOne({
                    customerId: cust._id,
                    shopkeeperId: req.auth?.userId
                });
                return {
                    ...cust._doc,
                    khataBalance: account ? account.balance : 0,
                    accountId: account ? account._id : null,
                    isGlobal: true // Flag to show "Global Match" in UI
                };
            }));
        } else {
            // Default: Show only MY customers
            const accounts = await CustomerAccount.find({ shopkeeperId: req.auth?.userId })
                .populate('customerId');

            customers = accounts.map((acc: any) => ({
                ...(acc.customerId as any)._doc,
                khataBalance: acc.balance,
                accountId: acc._id
            }));
        }

        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Get customer by phone (Global)
router.get('/:phoneNumber', auth, async (req, res) => {
    try {
        const customer = (await Customer.findOne({ phoneNumber: req.params.phoneNumber })) as any;
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Also check if they have an account in this shop
        const account = await CustomerAccount.findOne({
            customerId: customer._id,
            shopkeeperId: req.auth?.userId
        });

        res.json({
            ...customer._doc,
            khataBalance: account ? account.balance : 0
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Update customer and ensure account exists for this shop
router.post('/', auth, async (req, res) => {
    try {
        let customer = (await Customer.findOne({ phoneNumber: req.body.phoneNumber })) as any;
        if (!customer) {
            customer = new Customer(req.body);
            await customer.save();
        }

        // Ensure account exists for this shop
        let account = await CustomerAccount.findOne({
            customerId: customer._id,
            shopkeeperId: req.auth?.userId
        });

        if (!account) {
            account = new CustomerAccount({
                customerId: customer._id,
                shopkeeperId: req.auth?.userId,
                balance: 0
            });
            await account.save();
        }

        res.json({
            ...customer._doc,
            khataBalance: account.balance
        });
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export { router as customerRouter };
