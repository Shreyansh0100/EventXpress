import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: String, required: false }, // Optional
    
    // GeoJSON Location (Required for "Nearest" Logic)
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], required: true } // [Longitude, Latitude]
    },
    
    facilities: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// CRITICAL: This index allows MongoDB to calculate distances
theaterSchema.index({ location: "2dsphere" }); 

const Theater = mongoose.model("Theater", theaterSchema);
export default Theater;