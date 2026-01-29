import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: { type: String },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String },
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
