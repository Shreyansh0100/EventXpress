import express from 'express';
import { 
    getTheaterShows, 
    scanTicket, 
    getDailyManifest, 
    getDashboardStats,
    getAllTheaterBookings 
} from '../controllers/boxOfficeController.js';

// FIXED: Changed from authStaff to authUser. 
// We let the controller handle the strict 'cinema' OR 'admin' role checks
// so the Master Admin doesn't get blocked at the door!
import { authUser } from '../middleware/auth.js'; 

const boxOfficeRouter = express.Router();

// ==========================================
// HYBRID ROUTES (For Cinema Staff & Super Admins)
// ==========================================

// 1. Get shows for the POS checkout screen
boxOfficeRouter.get('/shows', authUser, getTheaterShows);

// 2. Scan and verify digital tickets
boxOfficeRouter.post('/scan', authUser, scanTicket);

// 3. Get the daily guest list (Gatekeepers checking names)
boxOfficeRouter.get('/manifest', authUser, getDailyManifest);

// 4. Get ALL bookings for the Master Bookings & Reprint page
boxOfficeRouter.get('/all-bookings', authUser, getAllTheaterBookings); 

// 5. Get operations data for the Cinema/Admin Dashboard
boxOfficeRouter.get('/dashboard-stats', authUser, getDashboardStats);

export default boxOfficeRouter;