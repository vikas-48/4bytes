import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed
    phoneNumber: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    shopName: { type: String },
    avatar: { type: String }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
