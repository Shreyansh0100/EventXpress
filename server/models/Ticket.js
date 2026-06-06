import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { 
        type: String, 
        enum: ['User', 'Agent', 'AI'], 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const ticketSchema = new mongoose.Schema({
    user: { 
        type: String, // <--- THIS IS THE MAGIC LINE. It MUST be String, not ObjectId.
        ref: 'User', 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    relatedBooking: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking',
        default: null
    },
    status: { 
        type: String, 
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
        default: 'Open' 
    },
    messages: [messageSchema] 
}, { timestamps: true });

export default mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);