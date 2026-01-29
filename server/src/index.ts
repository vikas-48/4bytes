import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'path';
import './config/passport.js';
import { authRouter } from './routes/auth.js';
import { productRouter } from './routes/products.js';
import { customerRouter } from './routes/customers.js';
import { billRouter } from './routes/bills.js';
import { ledgerRouter } from './routes/ledger.js';
import { groupBuyRouter } from './routes/groupBuy.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(passport.initialize());

// Serve uploads (public PDFs)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/customers', customerRouter);
app.use('/api/bills', billRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/group-buy', groupBuyRouter);

// Database Connection
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
