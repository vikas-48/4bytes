import express from 'express';
import { Customer } from '../models/Customer.js';

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Get customer by phone
router.get('/:phoneNumber', async (req, res) => {
    try {
        const customer = await Customer.findOne({ phoneNumber: req.params.phoneNumber });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Update customer
router.post('/', async (req, res) => {
    try {
        let customer = await Customer.findOne({ phoneNumber: req.body.phoneNumber });
        if (customer) {
            // Update existing customer if needed or just return it
            res.json(customer);
        } else {
            customer = new Customer(req.body);
            await customer.save();
            res.status(201).json(customer);
        }
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

// Update customer by ID
router.patch('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
});

export { router as customerRouter };
