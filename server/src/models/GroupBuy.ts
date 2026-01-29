import mongoose from 'mongoose';

const groupBuySchema = new mongoose.Schema({
    shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupName: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
}, { timestamps: true });

export const GroupBuy = mongoose.model('GroupBuy', groupBuySchema);
