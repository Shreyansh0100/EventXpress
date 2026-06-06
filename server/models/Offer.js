import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "₹50 Flat Discount"
    cost: { type: Number, required: true }, // e.g., 200 coins
    type: { type: String, required: true, enum: ['DISCOUNT', 'PERCENTAGE', 'F&B'] }, 
    value: { type: Number, required: true }, // e.g., 50 (for flat ₹50) or 20 (for 20%)
    isActive: { type: Boolean, default: true } // Admin can turn offers on/off
}, { timestamps: true });

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;