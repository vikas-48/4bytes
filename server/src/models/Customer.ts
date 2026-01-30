import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: { type: String },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String },
<<<<<<< HEAD
    khataBalance: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0 },
    nextCallDate: { type: Number }, // Timestamp
    recoveryStatus: { type: String, enum: ['Promised', 'Call Again', 'Busy', 'Failed', null], default: null },
    recoveryNotes: { type: String },
    visitValidation: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
=======
>>>>>>> origin/main
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
