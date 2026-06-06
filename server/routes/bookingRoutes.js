import express from 'express';
import { 
    createBooking, 
    getOccupiedSeats, 
    getUserBookings, 
    cancelBooking,
    checkInBooking 
} from '../controllers/bookingController.js';
import { authUser, authStaff } from '../middleware/auth.js'; 

const bookingRouter = express.Router();

// 1. Create a booking (Protected: Requires ANY logged-in user, including POS Staff)
bookingRouter.post('/create', authUser, createBooking);

// 2. Get occupied seats & Surge Pricing info (Public: Anyone can view the seat map)
bookingRouter.get('/occupied/:showId', getOccupiedSeats);

// 3. Get all bookings for the logged-in user (Protected: Used for My Bookings)
bookingRouter.get('/my-bookings', authUser, getUserBookings);

// 4. Cancel a booking & Process 60% Refund (Protected: Requires logged-in user)
bookingRouter.post('/cancel', authUser, cancelBooking);

// 5. Scan & Check-in a ticket (Protected: Requires Staff/Gatekeeper login)
// We use PATCH because we are partially updating the booking document
bookingRouter.patch('/check-in/:bookingId', authStaff, checkInBooking); 

export default bookingRouter;