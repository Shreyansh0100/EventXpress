import Snack from "../models/Snack.js";
import User from "../models/User.js";

// Helper to safely get the Clerk ID
const getClerkId = (req) => req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : req.body.userId;

// ==========================================
// 1. CREATE SNACK (Admin & Cinema Staff)
// ==========================================
export const createLocalSnack = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);
        
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized. Insufficient permissions." });
        }

        const { name, price, image, description, category, isActive, theaterId } = req.body;
        
        if (!name || !price || !image) {
            return res.status(400).json({ success: false, message: "Missing required fields (Name, Price, Image)" });
        }

        const targetTheaterId = staff.role === 'admin' ? theaterId : staff.theaterId;

        if (!targetTheaterId) {
            return res.status(400).json({ success: false, message: "Theater assignment is required." });
        }

        const newSnack = new Snack({ 
            name, 
            price: Number(price), 
            image, 
            description, 
            category: category || 'Popcorn', 
            isActive: isActive !== undefined ? isActive : true,
            theaterId: targetTheaterId 
        });
        
        await newSnack.save();
        
        res.status(201).json({ success: true, message: "Item added successfully!", snack: newSnack });
    } catch (error) {
        console.error("Create Snack Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. LOCAL CINEMA: Get ONLY their own snacks
// ==========================================
export const getMyLocalMenu = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);

        if (!staff || staff.role !== 'cinema' || !staff.theaterId) {
            return res.status(403).json({ success: false, message: "Theater assignment not found." });
        }

        const snacks = await Snack.find({ theaterId: staff.theaterId }).sort({ category: 1, createdAt: -1 });
        res.json({ success: true, snacks });
    } catch (error) {
        console.error("Get Local Menu Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. GLOBAL (SUPER ADMIN / USER APP CHECKOUT)
// ==========================================
export const getSnacksForTheater = async (req, res) => {
    try {
        const { theaterId, all } = req.query;

        // SUPER ADMIN OVERRIDE: Fetch everything globally
        if (all === 'true') {
            const snacks = await Snack.find({}).sort({ theaterId: 1, category: 1, createdAt: -1 }).populate('theaterId', 'name city');
            return res.json({ success: true, snacks });
        }

        // USER APP CHECKOUT: Must provide a specific theaterId
        if (!theaterId) {
            return res.status(400).json({ success: false, message: "Theater ID is required to fetch a menu." });
        }

        const snacks = await Snack.find({ theaterId, isActive: true }).sort({ category: 1 });
        res.json({ success: true, snacks });
    } catch (error) {
        console.error("Get Snacks Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. QUICK TOGGLE: In/Out of Stock (Admin & Staff)
// ==========================================
export const toggleSnackStock = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);
        
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const { id, isActive } = req.body;
        const query = staff.role === 'admin' ? { _id: id } : { _id: id, theaterId: staff.theaterId };
        
        const snack = await Snack.findOneAndUpdate(query, { isActive }, { new: true });
        if (!snack) return res.status(404).json({ success: false, message: "Snack not found or access denied." });
        
        res.json({ success: true, message: isActive ? "Restocked" : "Marked Out of Stock", snack });
    } catch (error) {
        console.error("Toggle Stock Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 5. UPDATE: Full Details Update (Admin & Staff)
// ==========================================
export const updateSnack = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);
        
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const { id, name, price, image, description, category, isActive, theaterId } = req.body;
        if (!id) return res.status(400).json({ success: false, message: "Snack ID is required." });

        const query = staff.role === 'admin' ? { _id: id } : { _id: id, theaterId: staff.theaterId };
        const updateData = { name, price: Number(price), image, description, category, isActive };
        
        if (staff.role === 'admin' && theaterId) updateData.theaterId = theaterId;

        const updatedSnack = await Snack.findOneAndUpdate(query, updateData, { new: true });
        if (!updatedSnack) return res.status(404).json({ success: false, message: "Snack not found or unauthorized." });

        res.json({ success: true, message: "Menu Item Updated!", snack: updatedSnack });
    } catch (error) {
        console.error("Update Snack Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 6. DELETE: Remove Item (Admin & Staff)
// ==========================================
export const deleteSnack = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);
        
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: "Snack ID is required." });

        const query = staff.role === 'admin' ? { _id: id } : { _id: id, theaterId: staff.theaterId };
        const deletedSnack = await Snack.findOneAndDelete(query);
        
        if (!deletedSnack) return res.status(404).json({ success: false, message: "Snack not found or unauthorized." });

        res.json({ success: true, message: "Item Deleted Successfully" });
    } catch (error) {
        console.error("Delete Snack Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};