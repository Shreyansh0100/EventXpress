import express from 'express';
import { createScheduleRequest, getTheaterRequests, getAllRequests, updateRequestStatus } from '../controllers/requestController.js';
import { authStaff, authAdmin } from '../middleware/auth.js';

const scheduleRequestRouter = express.Router();

// ==========================================
// 🎟️ CINEMA STAFF ROUTES (Protected by authStaff)
// Base URL: /api/schedule-requests
// ==========================================

// Create a new movie schedule request
scheduleRequestRouter.post('/create', authStaff, createScheduleRequest);

// Get all requests made by the logged-in staff member's specific theater
scheduleRequestRouter.get('/my-theater', authStaff, getTheaterRequests);


// ==========================================
// 👑 SUPER ADMIN ROUTES (Protected by authAdmin)
// Base URL: /api/schedule-requests
// ==========================================

// Get a master list of all requests across all theaters
scheduleRequestRouter.get('/all', authAdmin, getAllRequests);

// Approve or Reject a specific schedule request (and add an admin reply)
scheduleRequestRouter.put('/update-status', authAdmin, updateRequestStatus);


export default scheduleRequestRouter;