import express from 'express';
import { 
    // Auth & Dashboard
    isAdmin, getDashboardData, testEmailIntegration,
    // Movie Management
    addMovieManual, updateMovie, deleteMovie, getAllMovies, 
    // Theater Management
    addTheater, updateTheater, getAllTheaters, deleteTheater, 
    // Show Management & Box Office
    addShow, getAllShows, deleteShow, updateShow, getCinemaShows,
    // Booking & User Management
    getAllBookings, deleteBooking, 
    getAllUsers, toggleUserBan, changeUserRole,
    // Support System
    getAllTickets, replyToTicket, getUserBookings 
} from '../controllers/adminController.js';

// --- CRITICAL FIX: Import authUser alongside authAdmin ---
import { authAdmin, authUser } from '../middleware/auth.js';

const adminRouter = express.Router();

// ------------------------------------------------------------------
// 1. AUTH & DASHBOARD ROUTES
// ------------------------------------------------------------------

// FIXED: Changed from authAdmin to authUser. 
// This allows the controller to quietly check their role without throwing 403 errors!
adminRouter.get('/is-admin', authUser, isAdmin);

// Fetch all stats (Revenue, Charts, Recent Bookings)
adminRouter.get('/dashboard', authAdmin, getDashboardData);

// Test Route for SMTP/Email settings
adminRouter.post('/test-email', authAdmin, testEmailIntegration);


// ------------------------------------------------------------------
// 2. MOVIE MANAGEMENT
// ------------------------------------------------------------------
adminRouter.post('/add-movie', authAdmin, addMovieManual);
adminRouter.post('/update-movie', authAdmin, updateMovie);
adminRouter.post('/delete-movie', authAdmin, deleteMovie);
adminRouter.get('/all-movies', authAdmin, getAllMovies);


// ------------------------------------------------------------------
// 3. THEATER MANAGEMENT
// ------------------------------------------------------------------
adminRouter.post('/add-theater', authAdmin, addTheater);
adminRouter.post('/update-theater', authAdmin, updateTheater);
adminRouter.get('/all-theaters', authAdmin, getAllTheaters);
adminRouter.post('/delete-theater', authAdmin, deleteTheater);


// ------------------------------------------------------------------
// 4. SHOW MANAGEMENT & BOX OFFICE
// ------------------------------------------------------------------
adminRouter.post('/add-show', authAdmin, addShow);
adminRouter.get('/all-shows', authAdmin, getAllShows);
adminRouter.post('/update-show', authAdmin, updateShow);
adminRouter.post('/delete-show', authAdmin, deleteShow);

// FIXED: Changed to authUser! Cinema staff are not Super Admins, 
// so authAdmin would have blocked them from seeing their own shows.
adminRouter.get('/cinema-shows', authUser, getCinemaShows);


// ------------------------------------------------------------------
// 5. BOOKING & USER CONTROL
// ------------------------------------------------------------------
// View all bookings across the platform
adminRouter.get('/all-bookings', authAdmin, getAllBookings);

// Delete/Force Cancel a booking
adminRouter.post('/delete-booking', authAdmin, deleteBooking);

// User Management (Banning & Role switching)
adminRouter.get('/all-users', authAdmin, getAllUsers);
adminRouter.post('/toggle-ban', authAdmin, toggleUserBan);
adminRouter.post('/change-role', authAdmin, changeUserRole);


// ------------------------------------------------------------------
// 6. SUPPORT SYSTEM 
// ------------------------------------------------------------------
// Fetch all tickets created by users
adminRouter.get('/tickets', authAdmin, getAllTickets);

// Send a reply to a specific ticket
adminRouter.post('/tickets/reply', authAdmin, replyToTicket);

// Get a specific user's booking history for support context
adminRouter.get('/tickets/user-bookings', authAdmin, getUserBookings);


export default adminRouter;