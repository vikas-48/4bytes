import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    otpHash: { type: String, required: true },
    amount: { type: Number, required: true },
    shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
});

// TTL index for automatic deletion after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model('OTP', otpSchema);
