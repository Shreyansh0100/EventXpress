import mongoose from 'mongoose';
import crypto from 'crypto'; // Native Node.js module

const snackItemSchema = new mongoose.Schema({
    snackId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Snack',
        default: null
    },
    name: { type: String, required: true },      // Store name at time of purchase (in case snack is deleted later)
    price: { type: Number, required: true },      // Store price at time of purchase
    quantity: { type: Number, required: true, min: 1 }
}, { _id: false }); // No separate _id needed for sub-documents

const bookingSchema = new mongoose.Schema({
    user: { 
        type: String,                             // String to support Clerk IDs
        required: false,                          // Walk-ins don't require an account
        index: true 
    },
    show: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Show', 
        required: true,
        index: true
    },
    bookedSeats: { 
        type: [String], 
        required: true,
        validate: [v => v.length > 0, 'Must book at least one seat.']
    },
    amount: { 
        type: Number, 
        required: true,
        min: [0, 'Amount cannot be negative.']
    },
    paymentMethod: { 
        type: String,
        uppercase: true,
        enum: ['ONLINE', 'VENUE', 'CARD_TERMINAL', 'CASH'],
        required: true 
    },
    paymentLink: { 
        type: String,
        trim: true
    },
    isPaid: { 
        type: Boolean, 
        default: false 
    },
    status: {
        type: String,
        uppercase: true,
        enum: ['CONFIRMED', 'CANCELLED', 'PENDING'],
        default: 'CONFIRMED'
    },
    // ✅ FIXED: Snacks field was missing — POS orders were being silently dropped
    snacks: {
        type: [snackItemSchema],
        default: []
    },

    // Scanner & POS Fields
    isCheckedIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    guestName: {
        type: String,
        trim: true,
        default: 'Walk-in Guest'
    },
    guestEmail: {
        type: String,
        trim: true,
        default: ''
    },
    guestPhone: {
        type: String,
        trim: true,
        default: ''
    }
}, { 
    timestamps: true,
    // Ensure virtuals are included when converting to JSON for API responses
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- CRITICAL SECURITY FIX: Cryptographic QR Token ---
bookingSchema.virtual('qrToken').get(function() {
    // Uses a secret from your .env, or a fallback for development
    const secret = process.env.QR_SECRET || "EventXpress_super_secret_key_2026";
    // Create an unforgeable signature based on this specific booking's ID
    const signature = crypto.createHmac('sha256', secret).update(this._id.toString()).digest('hex');
    // Format: "ID:SIGNATURE"
    return `${this._id.toString()}:${signature}`;
});

// Pre-save hook: Auto-set checkInTime when a ticket is first scanned
bookingSchema.pre('save', function(next) {
    if (this.isModified('isCheckedIn') && this.isCheckedIn && !this.checkInTime) {
        this.checkInTime = new Date();
    }
    next();
});

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);