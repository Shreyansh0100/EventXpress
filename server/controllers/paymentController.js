import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import crypto from 'crypto';

// 1. Process Dummy Payment
export const processPayment = async (req, res) => {
    try {
        const { bookingId, amount, method, paymentDetails } = req.body;

        // Simulate processing delay (1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const transactionId = `TXN_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Create Payment Record
        const payment = await Payment.create({
            bookingId,
            amount,
            method,
            status: 'SUCCESS', // Always success for dummy
            transactionId
        });

        // Update Booking Status
        await Booking.findByIdAndUpdate(bookingId, { 
            isPaid: true, 
            paymentLink: transactionId 
        });

        res.json({ 
            success: true, 
            message: "Payment Successful", 
            transactionId,
            paymentId: payment._id 
        });

    } catch (error) {
        console.error("Payment Error:", error);
        res.json({ success: false, message: "Payment Failed" });
    }
};

// 2. Get Payment Status
export const getPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id).populate('bookingId');
        if(!payment) return res.json({ success: false, message: "Transaction not found" });
        
        res.json({ success: true, payment });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}