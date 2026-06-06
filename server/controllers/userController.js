import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Transaction from "../models/Transaction.js";

// --- HELPER FUNCTION: Safely Extract Clerk User ID ---
// Supports both Clerk v4 and v5 syntax automatically
const getClerkId = (req) => {
    if (!req.auth) return null;
    return typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;
};

// 1. Sync User (Create or Update from Clerk)
export const syncUser = async (req, res) => {
    try {
        const userId = getClerkId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { name, email, image } = req.body;

        // CRITICAL FIX: We explicitly pass `_id: userId` inside the update object.
        // This stops Mongoose from trying to generate a MongoDB ObjectId.
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                _id: userId, // <--- THIS IS THE MAGIC FIX
                name, 
                email, 
                image 
            }, 
            { upsert: true, new: true } // Create if doesn't exist
        );

        res.json({ success: true, user });
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// 2. Get User Bookings (For My Bookings Page)
export const getUserBookings = async (req, res) => {
    try {
        const userId = getClerkId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        
        // Find bookings where user matches the Clerk ID
        const bookings = await Booking.find({ user: userId })
            .populate({
                path: 'show',
                populate: { path: 'movie theater' } // Deep populate to get movie & theater details
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Fetch Bookings Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch bookings" });
    }
}

// 3. Get User Profile (For Wallet & Loyalty Coins)
export const getUserProfile = async (req, res) => {
    try {
        const userId = getClerkId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        // Find the user to get their latest coins/loyaltyPoints balance
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found in database" });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
}

// 4. Get User Transactions (For Wallet Ledger)
export const getUserTransactions = async (req, res) => {
    try {
        const userId = getClerkId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        // Fetch all transactions for this user, newest first
        const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

        res.json({ success: true, transactions });
    } catch (error) {
        console.error("Transaction Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
};