import express from 'express';
import { createTicket, getUserTickets, addChatMessage } from '../controllers/supportController.js';
import { authUser } from '../middleware/auth.js';

const supportRouter = express.Router();

// All these routes require the user to be logged in
supportRouter.post('/create', authUser, createTicket);
supportRouter.get('/my-tickets', authUser, getUserTickets);
supportRouter.post('/message', authUser, addChatMessage);

export default supportRouter;