import express from 'express';
import { 
    syncUser, 
    getUserProfile, 
    getUserTransactions,
    getUserBookings // <-- NEW: Added the bookings import
} from '../controllers/userController.js'; 
import { authUser } from '../middleware/auth.js';

const userRouter = express.Router();

// 1. Sync User (Create or Update from Clerk on login)
userRouter.post('/sync', authUser, syncUser);

// 2. Get User Profile (For Wallet balance and Loyalty Coins)
userRouter.get('/profile', authUser, getUserProfile);

// 3. Get User Bookings (For the "My Bookings" page)
userRouter.get('/bookings', authUser, getUserBookings); // <-- NEW: Added the bookings route

// 4. Get User Transactions (For the Wallet Ledger/History)
userRouter.get('/transactions', authUser, getUserTransactions); 

export default userRouter;