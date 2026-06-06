import ScheduleRequest from '../models/ScheduleRequest.js';
import User from '../models/User.js';

// Helper to safely get the Clerk ID
const getClerkId = (req) => req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : null;

// ==========================================
// 1. STAFF: Submit a Schedule Request
// ==========================================
export const createScheduleRequest = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized." });

        // FIXED: Clerk ID IS the _id in your User model — use findById, not findOne({ clerkId })
        const staff = await User.findById(clerkId);

        if (!staff) {
            return res.status(403).json({ success: false, message: "User not found in database." });
        }
        if (!staff.theaterId) {
            return res.status(403).json({ success: false, message: "Only cinema staff with an assigned theater can make requests." });
        }

        const { movieId, customMovieTitle, startDate, endDate, preferredTimes, message } = req.body;

        // Safely handle the CUSTOM sentinel value — never let it reach Mongoose as an ObjectId
        const isCustomMovie = !movieId || movieId === 'CUSTOM' || movieId === 'null';

        if (isCustomMovie && !customMovieTitle?.trim()) {
            return res.status(400).json({ success: false, message: "Please enter a movie title for your custom request." });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: "Start and End dates are required." });
        }
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ success: false, message: "End date cannot be before Start date." });
        }

        const newRequest = await ScheduleRequest.create({
            theater: staff.theaterId,
            requestedBy: staff._id,                          // staff._id = Clerk string ID, safe to store
            movie: isCustomMovie ? null : movieId,           // null if custom — prevents CastError
            customMovieTitle: isCustomMovie ? customMovieTitle.trim() : "",
            startDate,
            endDate,
            preferredTimes: Array.isArray(preferredTimes) ? preferredTimes : [],
            message: message || ""
        });

        res.status(201).json({
            success: true,
            message: "Request sent to Central Admin successfully!",
            request: newRequest
        });
    } catch (error) {
        console.error("Create Request Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. STAFF: View their own Theater's Requests
// ==========================================
export const getTheaterRequests = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized." });

        // FIXED: Same fix — findById instead of findOne({ clerkId })
        const staff = await User.findById(clerkId);

        if (!staff || !staff.theaterId) {
            return res.status(403).json({ success: false, message: "Unauthorized or no theater assigned." });
        }

        const requests = await ScheduleRequest.find({ theater: staff.theaterId })
            .populate('movie', 'title poster_path')
            .populate('requestedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (error) {
        console.error("Get Theater Requests Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. ADMIN: View ALL Requests across all theaters
// ==========================================
export const getAllRequests = async (req, res) => {
    try {
        const requests = await ScheduleRequest.find({})
            .populate('theater', 'name city')
            .populate('movie', 'title poster_path')
            .populate('requestedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, requests });
    } catch (error) {
        console.error("Get All Requests Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. ADMIN: Approve / Reject a Request
// ==========================================
export const updateRequestStatus = async (req, res) => {
    try {
        const { requestId, status, adminReply } = req.body;

        if (!requestId) {
            return res.status(400).json({ success: false, message: "Request ID is required." });
        }
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED." });
        }

        const request = await ScheduleRequest.findByIdAndUpdate(
            requestId,
            { status, adminReply: adminReply || "" },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found." });
        }

        res.json({
            success: true,
            message: `Request has been ${status.toLowerCase()}.`,
            request
        });
    } catch (error) {
        console.error("Update Request Status Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};