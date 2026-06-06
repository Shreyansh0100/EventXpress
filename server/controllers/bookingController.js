import mongoose from "mongoose";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js"; 
import Offer from "../models/Offer.js"; 
import Snack from "../models/Snack.js"; 
import Transaction from "../models/Transaction.js"; 
import { inngest } from "../inngest/index.js";

// Helper for Base Pricing (Dynamic Layout Support)
const getBaseSeatPrice = (seat, prices, seatingConfig) => {
    const row = seat.charAt(0).toUpperCase();
    
    if (seatingConfig && seatingConfig.length > 0) {
        const tierConfig = seatingConfig.find(config => config.rows.includes(row));
        if (tierConfig) {
            return prices[tierConfig.priceKey] || 0;
        }
    }

    if(['A','B','C'].includes(row)) return prices.plaza || 150; 
    if(['D','E','F','G'].includes(row)) return prices.premium || 200;
    return prices.royal || 300;
};

// Calculates the total number of seats in a cinema dynamically based on its layout config
const getTotalCapacity = (seatingConfig) => {
    if (!seatingConfig || !Array.isArray(seatingConfig) || seatingConfig.length === 0) {
        return 100; 
    }
    return seatingConfig.reduce((total, section) => {
        return total + ((section.rows?.length || 0) * (section.cols || 0));
    }, 0);
};

// ==========================================
// 1. CREATE BOOKING (Transactional + POS Ready + Secure)
// ==========================================
export const createBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { showId, paymentMethod, appliedRewardId, guestName, guestEmail, guestPhone, snacks = [], transactionId, isPosTransaction } = req.body; 

        let userId = "POS_GUEST";
        if (!isPosTransaction) {
            userId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : (req.body.userId || "POS_GUEST");
        }

        const requestedSeats = req.body.seats || req.body.selectedSeats || req.body.bookedSeats || [];

        if (requestedSeats.length === 0 && snacks.length === 0) {
            throw new Error("Cart is empty.");
        }

        const show = showId ? await Show.findById(showId).populate('movie theater').session(session) : null;
        const user = userId !== "POS_GUEST" ? await User.findById(userId).session(session) : null;

        if (show && !(show.occupiedSeats instanceof Map)) {
            show.occupiedSeats = new Map(Object.entries(show.occupiedSeats || {}));
        }

        if (show && requestedSeats.length > 0) {
            for (const seat of requestedSeats) {
                if (show.occupiedSeats.has(seat)) {
                    throw new Error(`Seat ${seat} was just booked by someone else! Please refresh.`);
                }
            }
        }

        let amountInRupees = 0;
        let isSurge = false;

        if (show && requestedSeats.length > 0) {
            const config = show.seatingConfig || show.theater?.seatingConfig || null;
            const totalCapacity = getTotalCapacity(config);
            const currentOccupancy = show.occupiedSeats.size;
            
            isSurge = (currentOccupancy / totalCapacity) >= 0.8; 
            const surgeMultiplier = isSurge ? 1.1 : 1.0;

            amountInRupees += requestedSeats.reduce((sum, seat) => {
                const basePrice = getBaseSeatPrice(seat, show.ticketPrice, config);
                return sum + Math.round(basePrice * surgeMultiplier);
            }, 0);
        }

        const verifiedSnacks = [];
        if (snacks && snacks.length > 0) {
            const snackIds = snacks.map(s => s.snackId);
            const dbSnacks = await Snack.find({ _id: { $in: snackIds } }).session(session);
            
            const snackMap = {};
            const nameMap = {};
            dbSnacks.forEach(s => {
                snackMap[s._id.toString()] = s.price;
                nameMap[s._id.toString()] = s.name;
            });

            let snacksTotal = 0;
            for (const item of snacks) {
                const realPrice = snackMap[item.snackId];
                if (realPrice !== undefined) {
                    snacksTotal += realPrice * item.quantity;
                    verifiedSnacks.push({
                        snackId: item.snackId,
                        name: nameMap[item.snackId],
                        price: realPrice,
                        quantity: item.quantity
                    });
                }
            }
            amountInRupees += snacksTotal;
        }

        const isVenuePay = ['VENUE', 'CARD_TERMINAL', 'CASH'].includes(paymentMethod);
        if (isVenuePay && requestedSeats.length > 0) amountInRupees += 50; 

        let pointsDeducted = 0;
        let discountApplied = 0;
        let rewardNotes = "";
        let offerTitle = "";

        if (appliedRewardId && user) {
            const offer = await Offer.findById(appliedRewardId).session(session);
            if (!offer || !offer.isActive) throw new Error("This offer is invalid or no longer active!");
            if ((user.loyaltyPoints || 0) < offer.cost) throw new Error("Insufficient points for this offer!");

            pointsDeducted = offer.cost;
            offerTitle = offer.title;

            if (offer.type === 'DISCOUNT') discountApplied = offer.value; 
            else if (offer.type === 'PERCENTAGE') discountApplied = Math.round(amountInRupees * (offer.value / 100)); 
            else if (offer.type === 'F&B') rewardNotes = `FREE ${offer.title.toUpperCase()} INCLUDED`;
        }

        amountInRupees = Math.max(0, amountInRupees - discountApplied); 
        const pointsEarned = user ? Math.floor(amountInRupees * 0.05) : 0;

        if (user) {
            user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - pointsDeducted + pointsEarned);
            await user.save({ session });
        }

        const [booking] = await Booking.create([{
            user: userId === "POS_GUEST" ? null : userId,
            show: showId || null,
            bookedSeats: requestedSeats,
            amount: amountInRupees,
            paymentMethod: paymentMethod || 'ONLINE',
            paymentLink: isVenuePay ? "PAY_AT_VENUE" : (transactionId || "ONLINE_SUCCESS"),
            isPaid: isVenuePay || (transactionId ? true : false),
            status: isVenuePay || transactionId ? 'CONFIRMED' : 'PENDING',
            guestName: guestName || 'Walk-in Guest',
            guestEmail: guestEmail || '',
            guestPhone: guestPhone || '',
            snacks: verifiedSnacks 
        }], { session });

        if (show && requestedSeats.length > 0) {
            requestedSeats.forEach(seat => {
                show.occupiedSeats.set(seat, booking._id.toString());
            });
            await show.save({ session });
        }

        if (pointsDeducted > 0 && user) {
            await Transaction.create([{
                user: userId, amount: -pointsDeducted, type: 'SPENT', description: `Redeemed Offer: ${offerTitle}`
            }], { session });
        }
        if (pointsEarned > 0 && user) {
            await Transaction.create([{
                user: userId, amount: pointsEarned, type: 'EARNED', description: `Earned from Booking #${booking._id.toString().slice(-6).toUpperCase()}`
            }], { session });
        }

        await session.commitTransaction();

        try {
            if (showId) await inngest.send({ name: "app/show.booked", data: { bookingId: booking._id } });
        } catch(e) { console.log("Email trigger failed", e) }

        res.status(201).json({
            success: true,
            message: isSurge ? "Booking Confirmed! (Surge Pricing Applied)" : "Booking Confirmed!",
            bookingId: booking._id,
            booking: booking,
            pointsEarned,
            rewardNotes
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Booking Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. GET OCCUPIED SEATS (Now sends Theater ID Fallback)
// ==========================================
export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;
        const show = await Show.findById(showId).populate('theater').lean(); 
        
        if (!show) return res.status(404).json({ success: false, message: "Show not found" });

        let occupiedSeatsArray = [];
        if (show.occupiedSeats instanceof Map) {
            occupiedSeatsArray = Array.from(show.occupiedSeats.keys());
        } else if (show.occupiedSeats && typeof show.occupiedSeats === 'object') {
            occupiedSeatsArray = Object.keys(show.occupiedSeats);
        }

        const config = show.seatingConfig || show.theater?.seatingConfig || null;
        const totalCapacity = getTotalCapacity(config);
        const isSurge = (occupiedSeatsArray.length / totalCapacity) >= 0.8;
        const surgeMultiplier = isSurge ? 1.1 : 1.0;

        res.json({ 
            success: true, 
            occupiedSeats: occupiedSeatsArray, 
            ticketPrice: show.ticketPrice,
            isSurgeActive: isSurge, 
            surgeMultiplier: surgeMultiplier,
            // 🚨 THE FIX: Send the exact theater ID to the frontend to catch
            theaterId: show.theater?._id || show.theater 
        });

    } catch (error) {
        console.error("Get Occupied Seats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. GET USER BOOKINGS
// ==========================================
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : (req.body.userId || req.user?._id);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized." });

        const bookings = await Booking.find({ user: userId })
            .populate({ path: 'show', populate: [ { path: 'movie' }, { path: 'theater' } ] })
            .sort({ createdAt: -1 }); 

        res.json({ success: true, bookings });
    } catch (error) {
        console.error("Get User Bookings Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. CANCEL BOOKING
// ==========================================
export const cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : (req.body.userId || req.user?._id);
        const { bookingId } = req.body;

        if (!userId) throw new Error("Unauthorized");

        const booking = await Booking.findById(bookingId).populate('show').session(session);
        if (!booking) throw new Error("Booking not found");
        if (String(booking.user) !== String(userId)) throw new Error("Permission denied.");
        if (booking.status === 'CANCELLED') throw new Error("Already cancelled.");
        if (booking.isCheckedIn) throw new Error("Ticket has already been utilized. Cancellation is not permitted post check-in.");

        const showTime = new Date(booking.show.showDateTime);
        const currentTime = new Date();
        const hoursDifference = (showTime - currentTime) / (1000 * 60 * 60);

        if (hoursDifference < 4) throw new Error("Cannot cancel within 4 hours of showtime.");

        const refundAmount = Math.round(booking.amount * 0.60); 
        const pointsToDeduct = Math.floor(booking.amount * 0.05); 

        const show = booking.show;
        
        if (!(show.occupiedSeats instanceof Map)) {
            show.occupiedSeats = new Map(Object.entries(show.occupiedSeats || {}));
        }

        booking.bookedSeats.forEach(seat => {
            if (show.occupiedSeats.get(seat) === booking._id.toString() || show.occupiedSeats.get(seat) === userId) {
                show.occupiedSeats.delete(seat);
            }
        });
        await show.save({ session }); 

        const user = await User.findById(userId).session(session);
        if (user) {
            user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - pointsToDeduct); 
            await user.save({ session });
        }

        if (pointsToDeduct > 0) {
            await Transaction.create([{
                user: userId, amount: -pointsToDeduct, type: 'SPENT', description: `Points Reversed for Cancelled Booking #${booking._id.toString().slice(-6).toUpperCase()}`
            }], { session });
        }

        booking.status = 'CANCELLED'; 
        await booking.save({ session });

        await session.commitTransaction();

        res.json({ 
            success: true, 
            message: `Ticket successfully cancelled. ₹${refundAmount} refund initiated to original payment method.`,
            refundAmount 
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Cancel Booking Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ==========================================
// 5. CHECK-IN TICKET (QR Scanner Function)
// ==========================================
export const checkInBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid QR Code format." });
        }

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: { path: 'movie', select: 'title' } 
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: "Invalid Ticket: Booking not found in system." });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: "❌ Ticket Cancelled. Entry Denied." });
        }
        if (booking.status === 'PENDING') {
            return res.status(400).json({ success: false, message: "❌ Payment Pending. Direct guest to Box Office." });
        }

        if (booking.isCheckedIn) {
            const time = new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return res.status(400).json({ 
                success: false, 
                message: `⚠️ Ticket already scanned at ${time}. Entry Denied.` 
            });
        }

        if (booking.show && booking.show.showDateTime) {
            const showTime = new Date(booking.show.showDateTime);
            const now = new Date();
            const diffInHours = (showTime - now) / (1000 * 60 * 60);

            if (diffInHours > 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: `❌ Too Early! This ticket is for ${showTime.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}.` 
                });
            }

            if (diffInHours < -4) {
                return res.status(400).json({ 
                    success: false, 
                    message: `❌ Expired! This ticket was for a past show on ${showTime.toLocaleDateString()}.` 
                });
            }
        }

        booking.isCheckedIn = true;
        if (!booking.checkInTime) booking.checkInTime = new Date();
        await booking.save();

        res.json({ 
            success: true, 
            message: "✅ Valid Ticket. Check-in successful!",
            details: {
                movieTitle: booking.show?.movie?.title || "Unknown Feature",
                showTime: booking.show?.showDateTime,
                seats: booking.bookedSeats,
                guestName: booking.guestName || "Walk-in Guest",
                totalGuests: booking.bookedSeats.length,
                snacks: booking.snacks || [], 
                paymentMethod: booking.paymentMethod
            }
        });

    } catch (error) {
        console.error("Check-in Error:", error);
        res.status(500).json({ success: false, message: "Server error during scan." });
    }
};