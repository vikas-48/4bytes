import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const kiranaProducts = [
    { name: 'Basmati Rice', price: 180, stock: 50, minStock: 10, icon: '🍚', category: 'Rice & Grains', unit: 'kg' },
    { name: 'Sona Masoori Rice', price: 65, stock: 40, minStock: 10, icon: '🍚', category: 'Rice & Grains', unit: 'kg' },
    { name: 'Wheat Flour (Atta)', price: 45, stock: 60, minStock: 15, icon: '🌾', category: 'Rice & Grains', unit: 'kg' },
    { name: 'Amul Milk (500ml)', price: 28, stock: 80, minStock: 20, icon: '🥛', category: 'Dairy', unit: 'packet' },
    { name: 'Parle-G Biscuits', price: 10, stock: 100, minStock: 30, icon: '🍪', category: 'Biscuits', unit: 'packet' },
    { name: 'Sugar', price: 45, stock: 50, minStock: 15, icon: '🧂', category: 'Sugar & Salt', unit: 'kg' },
    { name: 'Tata Salt', price: 22, stock: 60, minStock: 20, icon: '🧂', category: 'Sugar & Salt', unit: 'kg' },
    { name: 'Fortune Oil (1L)', price: 150, stock: 40, minStock: 10, icon: '🛢️', category: 'Oil & Spices', unit: 'packet' },
    { name: 'Toor Dal', price: 110, stock: 35, minStock: 10, icon: '🍲', category: 'Pulses', unit: 'kg' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!, { family: 4 });
        console.log('Connected to MongoDB for seeding...');

        await Product.deleteMany({});
        await Product.insertMany(kiranaProducts);

        console.log('✅ MongoDB Seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
