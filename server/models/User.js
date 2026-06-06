import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // --- ADD THIS LINE TO OVERRIDE MONGODB'S DEFAULT OBJECTID ---
    _id: { type: String, required: true }, 
    
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    
    // ROLE: Determines what dashboard the user sees
    role: { 
        type: String, 
        enum: ['user', 'admin', 'cinema'], 
        default: 'user',
        index: true 
    },
    
    // BOX OFFICE: Links this staff member to a specific physical theater
    theaterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Theater', 
        default: null,
        index: true 
    },

    // WALLET ECOSYSTEM
    coins: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    
    // SECURITY
    isBanned: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;