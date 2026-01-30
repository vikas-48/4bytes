import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { GlobalProduct } from '../models/GlobalProduct.js';
import { starterProducts } from '../utils/starterProducts.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

// Manual Registration
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password, phoneNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            phoneNumber
        });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        // Seed initial products for the new shopkeeper
        let sourceProducts: any[] = await GlobalProduct.find().lean();

        if (sourceProducts.length === 0) {
            console.log('No GlobalProducts found in DB, falling back to starterProducts file');
            sourceProducts = starterProducts;
        }

        const initialProducts = sourceProducts.map(p => ({
            shopkeeperId: user._id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            category: p.category,
            unit: p.unit,
            icon: p.icon
        }));

        await Product.insertMany(initialProducts);

        res.status(201).json({ token, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Manual Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Google Auth start
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
}));

// Google Auth callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/login?error=auth_failed`, session: false }),
    (req: any, res) => {
        // Successful authentication
        const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, { expiresIn: '7d' });
        // Redirect to frontend with token in URL (simple for hackathons)
        // In production, use cookies or a secure way
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}/auth-success?token=${token}`);
    }
);

// Get Current User Info
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token' });

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export { router as authRouter };
