import express from 'express';
import { createOffer, getActiveOffers, getAllOffers, toggleOffer, updateOffer, deleteOffer } from '../controllers/offerController.js';
import { authUser } from '../middleware/auth.js'; 

const offerRouter = express.Router();

// Public/User Route
offerRouter.get('/active', getActiveOffers);

// Admin Routes
offerRouter.post('/create', authUser, createOffer); 
offerRouter.get('/all', authUser, getAllOffers);
offerRouter.post('/toggle', authUser, toggleOffer);

// NEW ROUTES
offerRouter.post('/update', authUser, updateOffer);
offerRouter.post('/delete', authUser, deleteOffer);

export default offerRouter;