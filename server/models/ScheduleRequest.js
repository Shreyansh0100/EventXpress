import mongoose from 'mongoose';

const scheduleRequestSchema = new mongoose.Schema({
    theater: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Theater', 
        required: true 
    },
    // FIXED: Changed type from ObjectId to String to support Clerk User IDs
    requestedBy: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    // If the movie is already in your database:
    movie: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie' 
    },
    // If the theater wants a movie that the Admin hasn't added yet:
    customMovieTitle: { 
        type: String 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    preferredTimes: { 
        type: [String], // e.g., ["10:00 AM", "14:30", "19:00"]
        default: [] 
    },
    message: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED'], 
        default: 'PENDING' 
    },
    adminReply: { 
        type: String 
    }
}, { timestamps: true });

export default mongoose.models.ScheduleRequest || mongoose.model('ScheduleRequest', scheduleRequestSchema);