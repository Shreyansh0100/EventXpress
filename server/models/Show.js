import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
    movie: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie', 
        required: true 
    },
    theater: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Theater', 
        required: true 
    },
    showDateTime: { 
        type: Date, 
        required: true 
    },
    language: { 
        type: String, 
        required: true,
        trim: true 
    },
    format: { 
        type: String, 
        required: true,
        trim: true 
    },
    ticketPrice: {
        royal: { type: Number, default: 0, min: 0 },
        premium: { type: Number, default: 0, min: 0 },
        plaza: { type: Number, default: 0, min: 0 },
    },
    // Map ensures we can do show.occupiedSeats.get('A1')
    occupiedSeats: {
        type: Map,
        of: String, // Note: Storing the Booking ID here instead of User ID often makes cancellations easier to handle.
        default: {}
    }
}, { timestamps: true });

// Compound indexes for faster querying by theater/movie and date
showSchema.index({ theater: 1, showDateTime: 1 });
showSchema.index({ movie: 1, showDateTime: 1 });

// Prevent OverwriteModelError in Serverless/Next.js environments
export default mongoose.models.Show || mongoose.model("Show", showSchema);