import express from 'express';
import { processPayment, getPaymentStatus } from '../controllers/paymentController.js';
import { protectAdmin } from '../middleware/auth.js'; // Optional if you want admin checks

const paymentRouter = express.Router();

paymentRouter.post('/process', processPayment);
paymentRouter.get('/status/:id', getPaymentStatus);

export default paymentRouter;