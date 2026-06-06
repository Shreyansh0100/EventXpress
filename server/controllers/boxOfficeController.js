import crypto from 'crypto';
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";

// Helper to safely get the Clerk ID
const getClerkId = (req) => req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : null;

// ==========================================
// 1. Get Live Shows (Theater-Specific for Staff, Global for Admin)
// ==========================================
export const getTheaterShows = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const staff = await User.findById(clerkId);
        
        // ALLOW BOTH 'cinema' AND 'admin' ROLES
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Access Denied: Invalid POS Credentials." });
        }

        let query = { showDateTime: { $gte: new Date() } };

        // If Cinema Staff, restrict to their specific theater
        if (staff.role === 'cinema') {
            if (!staff.theaterId) return res.status(403).json({ success: false, message: "No theater assigned to this staff member." });
            query.theater = staff.theaterId;
        }

        const shows = await Show.find(query)
        .populate('movie', 'title poster_path language formats runtime')
        .sort({ showDateTime: 1 }); 

        res.json({ success: true, shows });
    } catch (error) {
        console.error("Box Office Fetch Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 2. Scan & Verify a Digital Ticket (SECURE)
// ==========================================
export const scanTicket = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const clerkId = getClerkId(req);

        const staff = await User.findById(clerkId);
        
        // ALLOW BOTH 'cinema' AND 'admin' ROLES
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Access Denied." });
        }

        if (!bookingId) {
            return res.status(400).json({ success: false, message: "Booking ID is required." });
        }

        // --- SECURITY IMPLEMENTATION ---
        let rawInput = bookingId.replace('#', '').trim();
        let cleanId = rawInput;
        let signatureProvided = null;

        // Split the incoming QR token into the ID and the Signature
        if (rawInput.includes(':')) {
            [cleanId, signatureProvided] = rawInput.split(':');
        }

        let booking;

        // Full 24-char ID = camera scan; shorter = manual entry
        if (cleanId.length === 24 && /^[a-fA-F0-9]{24}$/.test(cleanId)) {
            
            // 1. Demand the signature
            if (!signatureProvided) {
                return res.json({ success: false, message: "⚠️ Insecure QR Code format. Please ask the user to refresh their app." });
            }

            // 2. Verify the signature
            const secret = process.env.QR_SECRET || "EventXpress_super_secret_key_2026";
            const expectedSignature = crypto.createHmac('sha256', secret).update(cleanId).digest('hex');
            
            if (signatureProvided !== expectedSignature) {
                return res.json({ success: false, message: "❌ SECURITY ALERT: Forged ticket signature detected! Do not allow entry." });
            }

            booking = await Booking.findById(cleanId)
                .populate({ path: 'show', populate: { path: 'movie', select: 'title' } })
                .populate('user', 'name email');
        } else {
            // Manual fallback for cashiers typing short codes manually
            booking = await Booking.findOne({
                $expr: {
                    $regexMatch: {
                        input: { $toString: "$_id" },
                        regex: cleanId + "$",
                        options: "i"
                    }
                }
            })
            .populate({ path: 'show', populate: { path: 'movie', select: 'title' } })
            .populate('user', 'name email');
        }

        if (!booking) {
            return res.json({ success: false, message: "Invalid Ticket ID. No record found in system." });
        }

        // Security: Ticket must belong to THIS theater (Unless you are an Admin, then bypass)
        if (staff.role === 'cinema' && booking.show?.theater?.toString() !== staff.theaterId.toString()) {
            return res.json({ success: false, message: "⚠️ WARNING: Ticket is for a different cinema location!" });
        }

        // Cancelled ticket
        if (['CANCELLED', 'Cancelled'].includes(booking.status)) {
            return res.json({ success: false, message: "❌ Ticket Cancelled. Entry Denied." });
        }

        // Pending payment
        if (booking.status === 'PENDING') {
            return res.json({ success: false, message: "❌ Payment Pending. Direct guest to Box Office." });
        }

        const buildDetails = (booking) => ({
            movieTitle: booking.show?.movie?.title || "Unknown Feature",
            showTime: booking.show?.showDateTime || null,
            seats: booking.bookedSeats || [],
            guestName: booking.guestName || booking.user?.name || "Walk-in Guest",
            guestEmail: booking.user?.email || null,
            guestPhone: booking.guestPhone || null,
            totalGuests: booking.bookedSeats?.length || 0,
            paymentMethod: booking.paymentMethod,
            snacks: booking.snacks || [],
            createdAt: booking.createdAt
        });

        // Duplicate scan
        if (booking.isCheckedIn) {
            const time = new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return res.json({ 
                success: false,
                alreadyScanned: true,
                message: `⚠️ Ticket already scanned at ${time}. Entry Denied.`,
                details: buildDetails(booking)
            });
        }

        // First scan — mark as used
        booking.isCheckedIn = true;
        booking.checkInTime = new Date();
        await booking.save();

        res.json({
            success: true,
            message: "✅ Valid Ticket. Access Granted!",
            details: buildDetails(booking)
        });

    } catch (error) {
        console.error("Scan Ticket Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 3. Get Today's Guest Manifest
// ==========================================
export const getDailyManifest = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);

        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Access Denied." });
        }

        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        let query = { showDateTime: { $gte: startOfDay, $lte: endOfDay } };

        if (staff.role === 'cinema') {
            if (!staff.theaterId) return res.status(403).json({ success: false, message: "Access Denied." });
            query.theater = staff.theaterId;
        }

        const todayShows = await Show.find(query);
        const showIds = todayShows.map(show => show._id);

        const bookings = await Booking.find({
            show: { $in: showIds },
            status: { $nin: ['CANCELLED', 'Cancelled'] }
        })
        .populate({ path: 'show', populate: { path: 'movie', select: 'title' } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

        res.json({ success: true, bookings, totalExpected: bookings.length });
    } catch (error) {
        console.error("Manifest Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 4. Get Box Office Dashboard Stats
// ==========================================
export const getDashboardStats = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId).populate('theaterId'); 
        
        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized credentials." });
        }

        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        let showQuery = { showDateTime: { $gte: startOfDay, $lte: endOfDay } };

        if (staff.role === 'cinema') {
            if (!staff.theaterId) return res.status(403).json({ success: false, message: "No theater assigned." });
            showQuery.theater = staff.theaterId._id;
        }

        const todayShows = await Show.find(showQuery).populate('movie', 'title poster_path').sort({ showDateTime: 1 });
        const showIds = todayShows.map(s => s._id);

        const todayBookings = await Booking.find({
            show: { $in: showIds },
            status: { $nin: ['CANCELLED', 'Cancelled'] }
        }).populate('user', 'name email').sort({ createdAt: -1 });

        let totalRevenue = 0;
        let posCashRevenue = 0; 
        let totalGuests = 0;

        todayBookings.forEach(booking => {
            totalRevenue += booking.amount;
            totalGuests += booking.bookedSeats?.length || 0;
            if (['VENUE', 'CARD_TERMINAL', 'CASH'].includes(booking.paymentMethod)) {
                posCashRevenue += booking.amount;
            }
        });

        const stats = {
            todayTickets: todayBookings.length,
            totalGuests,
            totalRevenue,
            posCashRevenue,
            upcomingShows: todayShows.map(s => ({
                id: s._id,
                movieTitle: s.movie?.title || 'Unknown',
                poster: s.movie?.poster_path,
                time: s.showDateTime,
                bookedSeatsCount: s.occupiedSeats instanceof Map 
                    ? s.occupiedSeats.size 
                    : Object.keys(s.occupiedSeats || {}).length,
                format: s.format
            })),
            recentSales: todayBookings.slice(0, 6).map(b => ({
                id: b._id,
                seats: b.bookedSeats?.join(', ') || 'N/A',
                amount: b.amount,
                method: b.paymentMethod,
                time: b.createdAt,
                customer: b.guestName || (b.user ? b.user.name : 'Walk-in Guest')
            }))
        };

        const displayTheaterName = staff.role === 'admin' ? "Global Command Center" : staff.theaterId.name;

        res.json({ success: true, stats, theaterName: displayTheaterName });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 5. Get ALL Bookings for this Theater
// ==========================================
export const getAllTheaterBookings = async (req, res) => {
    try {
        const clerkId = getClerkId(req);
        const staff = await User.findById(clerkId);

        if (!staff || (staff.role !== 'cinema' && staff.role !== 'admin')) {
            return res.status(403).json({ success: false, message: "Access Denied." });
        }

        let theaterQuery = {};
        if (staff.role === 'cinema') {
            if (!staff.theaterId) return res.status(403).json({ success: false, message: "No theater assigned." });
            theaterQuery.theater = staff.theaterId;
        }

        const theaterShows = await Show.find(theaterQuery).select('_id');
        const showIds = theaterShows.map(s => s._id);

        const bookings = await Booking.find({ show: { $in: showIds } })
            .populate({ 
                path: 'show', 
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'theater', select: 'name city' }
                ] 
            })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(300);

        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Fetch All Bookings Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};