import mongoose from "mongoose";

const snackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true }, // URL
    description: { type: String },
    category: { 
        type: String, 
        enum: ['Popcorn', 'Beverage', 'Candy', 'Combo', 'Hot Food', 'Other'], 
        default: 'Popcorn' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    // --- LOCAL MENU UPGRADE ---
    // Links this specific snack item to the cinema that created it
    theaterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Theater',
        required: true // Required so no snack is "orphaned" in the global pool
    }
}, { timestamps: true });

export default mongoose.models.Snack || mongoose.model("Snack", snackSchema);