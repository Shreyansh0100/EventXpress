import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: { type: String, ref: 'User', required: true }, // The Clerk User ID
    amount: { type: Number, required: true }, // e.g., +106 (Earned) or -200 (Spent)
    type: { type: String, required: true, enum: ['EARNED', 'SPENT', 'REFUND'] },
    description: { type: String, required: true }, // e.g., "Earned from booking #ABCD123"
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;