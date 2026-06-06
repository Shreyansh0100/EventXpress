import Offer from '../models/Offer.js';

// 1. Create a new Offer (Admin Only)
export const createOffer = async (req, res) => {
    try {
        const { title, cost, type, value } = req.body;
        
        const newOffer = await Offer.create({ title, cost, type, value });
        
        res.json({ success: true, message: "Offer created successfully!", offer: newOffer });
    } catch (error) {
        console.error("Create Offer Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Get ONLY Active Offers (For User Checkout & Wallet)
export const getActiveOffers = async (req, res) => {
    try {
        // Sorts by cost ascending (cheapest offers first)
        const offers = await Offer.find({ isActive: true }).sort({ cost: 1 });
        res.json({ success: true, offers });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Get ALL Offers (For Admin Panel)
export const getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json({ success: true, offers });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 4. Toggle Offer ON/OFF (Admin Only)
export const toggleOffer = async (req, res) => {
    try {
        const { id } = req.body;
        const offer = await Offer.findById(id);
        
        if (!offer) return res.json({ success: false, message: "Offer not found" });

        offer.isActive = !offer.isActive;
        await offer.save();

        res.json({ success: true, message: `Offer ${offer.isActive ? 'Activated' : 'Deactivated'}`, offer });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 5. FULL UPDATE Offer (Admin Only)
export const updateOffer = async (req, res) => {
    try {
        const { id, title, cost, type, value } = req.body;
        
        const offer = await Offer.findById(id);
        if (!offer) return res.json({ success: false, message: "Offer not found" });

        // Update fields if they are provided
        if (title) offer.title = title;
        if (cost !== undefined) offer.cost = cost;
        if (type) offer.type = type;
        
        // F&B type shouldn't have a mathematical discount value
        if (type === 'F&B') {
            offer.value = 0; 
        } else if (value !== undefined) {
            offer.value = value;
        }

        await offer.save();

        res.json({ success: true, message: "Offer updated successfully!", offer });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 6. DELETE Offer (Admin Only)
export const deleteOffer = async (req, res) => {
    try {
        const { id } = req.body;
        
        const offer = await Offer.findByIdAndDelete(id);
        if (!offer) return res.json({ success: false, message: "Offer not found" });

        res.json({ success: true, message: "Offer permanently deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};