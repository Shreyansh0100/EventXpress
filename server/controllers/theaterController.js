import Theater from "../models/Theater.js";
import Show from "../models/Show.js"; 
import mongoose from "mongoose";

// ==========================================
// PUBLIC FUNCTIONS (For the Users)
// ==========================================

// 1. Get Nearby Theaters (Geospatial)
export const getNearbyTheaters = async (req, res) => {
    try {
        const { lat, long } = req.body;

        if (!lat || !long) {
            return res.status(400).json({ success: false, message: "Coordinates missing." });
        }

        const theaters = await Theater.find({
            location: {
                $near: {
                    $geometry: { 
                        type: "Point", 
                        coordinates: [parseFloat(long), parseFloat(lat)] 
                    }
                }
            }
        });

        const detectedCity = theaters.length > 0 ? theaters[0].city : "Select City";
        res.json({ success: true, theaters, detectedCity });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// 2. Get Theaters by City
export const getTheatersByCity = async (req, res) => {
    try {
        const { city } = req.query; 
        
        if (!city || city === "Select City") {
            return res.json({ success: true, theaters: [] });
        }

        const theaters = await Theater.find({ 
            city: { $regex: new RegExp(city, "i") } 
        });
        
        res.json({ success: true, theaters });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 3. Get Single Theater Details
export const getTheaterById = async (req, res) => {
    try {
        const { id } = req.params;
        const theater = await Theater.findById(id);
        
        if (!theater) {
            return res.status(404).json({ success: false, message: "Theater not found" });
        }

        res.json({ success: true, theater });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 4. Get Unique Movies Currently Playing at a Theater
export const getMoviesByTheater = async (req, res) => {
    try {
        const { id } = req.params;

        // 🚨 LOGIC FIX: Added showDateTime filter so old/past movies don't show up!
        const shows = await Show.find({
            $or: [{ theater: id }, { theaterId: id }],
            showDateTime: { $gte: new Date() } 
        })
        .populate({ path: 'movie', strictPopulate: false })
        .populate({ path: 'movieId', strictPopulate: false });

        const uniqueMovies = [];
        const seenMovieIds = new Set();

        shows.forEach(show => {
            const movieData = show.movie || show.movieId;

            if (movieData && movieData._id) {
                const movieIdStr = movieData._id.toString();

                if (!seenMovieIds.has(movieIdStr)) {
                    seenMovieIds.add(movieIdStr);
                    uniqueMovies.push(movieData);
                }
            }
        });

        res.json({ 
            success: true, 
            movies: uniqueMovies 
        });

    } catch (error) {
        console.error("Error fetching movies by theater:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}


// ==========================================
// ADMIN FUNCTIONS
// ==========================================

// 5. Add a New Theater (Admin)
export const addTheater = async (req, res) => {
    try {
        const { name, city, address, location, facilities } = req.body;
        
        const newTheater = new Theater({
            name,
            city,
            address,
            location, 
            facilities
        });

        await newTheater.save();
        res.json({ success: true, message: "Theater added successfully!", theater: newTheater });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 6. Get ALL Theaters (Admin Dashboard)
export const getAllTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find().sort({ createdAt: -1 });
        res.json({ success: true, theaters });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 7. Delete a Theater (Admin)
export const deleteTheater = async (req, res) => {
    try {
        const { id } = req.body;
        
        const theater = await Theater.findByIdAndDelete(id);
        if (!theater) return res.json({ success: false, message: "Theater not found" });

        // Cleanup orphaned shows when a theater is deleted
        await Show.deleteMany({ theater: id });

        res.json({ success: true, message: "Theater permanently deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};