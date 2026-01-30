import mongoose from 'mongoose';

const groupBuySchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    members: [{ type: String }], // Modified to accept 'shop_me' and Strings
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },

    // Detailed Pricing & Tiers
    marketPrice: { type: Number, required: true },
    dealPrice: { type: Number }, // Current active price
    tiers: [{
        goal: { type: Number, required: true },
        price: { type: Number, required: true },
        label: { type: String } // e.g., 'Gold', 'Silver'
    }],

    // Progress
    targetUnits: { type: Number, default: 10 },
    currentUnits: { type: Number, default: 0 },

    // Metadata
    image_url: { type: String },
    category: { type: String, default: 'General' },
    anchorShop: { type: String, default: 'Local Hub' },
    expiresAt: { type: Date },

    // AI & Status
    aiInsight: { type: String },
    status: { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
}, { timestamps: true });

export const GroupBuy = mongoose.model('GroupBuy', groupBuySchema);
