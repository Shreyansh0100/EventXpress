import mongoose from "mongoose"; 
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import Theater from "../models/Theater.js";
import { inngest } from "../inngest/index.js";

// ==========================================
// 1. GET NOW PLAYING (Robust: City -> Nearest -> Fallback)
// ==========================================
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { city, lat, long } = req.query;
        let activeMovieIds = [];
        let searchMode = "Global"; 

        // Helper: Validate Coordinates to prevent "Cast to Number failed"
        const userLat = parseFloat(lat);
        const userLong = parseFloat(long);
        const hasValidCoords = !isNaN(userLat) && !isNaN(userLong);

        // --- STRATEGY 1: Exact City Match ---
        if (city && city !== "undefined" && city !== "Select City") {
            const cityTheaters = await Theater.find({ city: { $regex: new RegExp(city, "i") } }).lean();
            const cityTheaterIds = cityTheaters.map(t => t._id);
            
            if (cityTheaterIds.length > 0) {
                activeMovieIds = await Show.find({ 
                    showDateTime: { $gte: new Date() },
                    theater: { $in: cityTheaterIds }
                }).distinct('movie');
                
                if (activeMovieIds.length > 0) searchMode = `City: ${city}`;
            }
        }

        // --- STRATEGY 2: Nearest Theaters (Only if coords are valid) ---
        if (activeMovieIds.length === 0 && hasValidCoords) {
            const nearbyTheaters = await Theater.find({
                location: {
                    $near: {
                        $geometry: { 
                            type: "Point", 
                            coordinates: [userLong, userLat] 
                        }
                    }
                }
            }).lean();
            
            const nearbyTheaterIds = nearbyTheaters.map(t => t._id);

            if (nearbyTheaterIds.length > 0) {
                activeMovieIds = await Show.find({ 
                    showDateTime: { $gte: new Date() },
                    theater: { $in: nearbyTheaterIds }
                }).distinct('movie');
                
                if (activeMovieIds.length > 0) searchMode = "Nearest Locations";
            }
        }

        // --- STRATEGY 3: Active Shows Global Fallback ---
        if (activeMovieIds.length === 0) {
            activeMovieIds = await Show.find({ 
                showDateTime: { $gte: new Date() } 
            }).distinct('movie');
            
            if(activeMovieIds.length > 0) searchMode = "All Active Shows";
        }

        // --- SANITIZATION: Filter out invalid IDs ---
        const validObjectIds = activeMovieIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        // --- STRATEGY 4: UNIVERSAL FALLBACK ---
        if (validObjectIds.length === 0) {
            const latestMovies = await Movie.find({}).sort({ createdAt: -1 }).limit(10).lean();
            return res.json({ 
                success: true, 
                movies: latestMovies, 
                mode: "Latest Movies (No Shows Scheduled)" 
            });
        }

        const movies = await Movie.find({ 
            _id: { $in: validObjectIds } 
        }).sort({ createdAt: -1 }).lean();

        res.json({ success: true, movies, mode: searchMode });

    } catch (error) {
        console.error("Get Now Playing Error:", error.message);
        res.status(500).json({ success: false, message: "Database Error: " + error.message, movies: [] });
    }
}

// ==========================================
// 2. GET THEATERS & SHOWTIMES
// ==========================================
export const getMovieShowtimes = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { city, date, lat, long } = req.query;

        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

        let theaterIds = [];
        let searchMode = "Global";

        const userLat = parseFloat(lat);
        const userLong = parseFloat(long);
        const hasValidCoords = !isNaN(userLat) && !isNaN(userLong);

        if (city && city !== "undefined" && city !== "Select City") {
            const cityTheaters = await Theater.find({ city: { $regex: new RegExp(city, "i") } }).lean();
            if (cityTheaters.length > 0) {
                theaterIds = cityTheaters.map(t => t._id);
                searchMode = city;
            }
        }

        if (theaterIds.length === 0 && hasValidCoords) {
            const nearbyTheaters = await Theater.find({
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [userLong, userLat] }
                    }
                }
            }).lean();
            
            if (nearbyTheaters.length > 0) {
                theaterIds = nearbyTheaters.map(t => t._id);
                searchMode = "Nearest Theaters";
            }
        }

        let query = {
            movie: movieId,
            showDateTime: { $gte: startOfDay, $lte: endOfDay }
        };

        if (theaterIds.length > 0) query.theater = { $in: theaterIds };

        const shows = await Show.find(query).populate('theater').lean();

        const groupedShows = {};
        shows.forEach(show => {
            if (!show.theater) return; // Prevent crashes if theater was deleted
            const tId = show.theater._id.toString();
            if (!groupedShows[tId]) {
                groupedShows[tId] = { theater: show.theater, shows: [] };
            }
            groupedShows[tId].shows.push({
                showId: show._id,
                time: show.showDateTime,
                format: show.format,
                price: show.ticketPrice
            });
        });

        let results = Object.values(groupedShows);

        if (searchMode === "Nearest Theaters" && theaterIds.length > 0) {
            results.sort((a, b) => theaterIds.indexOf(a.theater._id) - theaterIds.indexOf(b.theater._id));
        }

        res.json({ success: true, theaters: results, mode: searchMode });

    } catch (error) {
        console.error("Get Showtimes Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 3. ADD SHOW (Admin)
// ==========================================
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, theaterId, priceConfig, language, format } = req.body;

        if (!movieId || !theaterId || !language || !format) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        if (!priceConfig || !priceConfig.royal || !priceConfig.premium || !priceConfig.plaza) {
            return res.status(400).json({ success: false, message: "Ticket prices are missing." });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found." });

        const showsToCreate = [];
        
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach((time) => {
                const dateTimeString = `${showDate}T${time}`;
                const validDate = new Date(dateTimeString);
                
                if (!isNaN(validDate)) {
                    showsToCreate.push({
                        movie: movieId,
                        theater: theaterId,
                        showDateTime: validDate,
                        language: language,
                        format: format,
                        ticketPrice: {
                            royal: Number(priceConfig.royal),
                            premium: Number(priceConfig.premium),
                            plaza: Number(priceConfig.plaza)
                        },
                        occupiedSeats: {} 
                    });
                }
            });
        });

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        } else {
             return res.status(400).json({ success: false, message: "Invalid Dates/Times provided." });
        }

        try {
             await inngest.send({ name: "app/show.added", data: { movieTitle: movie.title } });
        } catch (e) { console.log("Inngest skipped."); }

        res.status(201).json({ success: true, message: 'Schedule Saved Successfully!' });

    } catch (error) {
        console.error("Add Show Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 4. GET SINGLE MOVIE
// ==========================================
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        const movie = await Movie.findById(movieId).lean();
        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } }).populate('theater').lean();
        res.json({ success: true, movie, shows });
    } catch (error) { 
        console.error("Get Single Show Error:", error);
        res.status(500).json({ success: false, message: error.message }); 
    }
}

// ==========================================
// 5. GET ALL SHOWS (Admin List)
// ==========================================
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDateTime: { $gte: new Date() } })
            .populate('movie')
            .populate('theater')
            .sort({ showDateTime: 1 })
            .lean();
            
        const uniqueShows = [];
        const seenMovies = new Set();
        
        for (const show of shows) {
            if (show.movie && !seenMovies.has(show.movie._id.toString())) {
                uniqueShows.push(show.movie);
                seenMovies.add(show.movie._id.toString());
            }
        }

        res.json({ success: true, shows: uniqueShows, rawShows: shows });
    } catch (error) {
        console.error("Get All Shows Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// ==========================================
// 6. UPDATE SHOW (Admin)
// ==========================================
export const updateShow = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const show = await Show.findById(id);
        if (!show) return res.status(404).json({ success: false, message: "Show not found." });

        const hasBookings = (show.occupiedSeats instanceof Map && show.occupiedSeats.size > 0) || 
                            (show.occupiedSeats && Object.keys(show.occupiedSeats).length > 0);

        if (hasBookings && (updateData.movie || updateData.theater || updateData.showDateTime)) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot change the Movie, Theater, or Date/Time because tickets have already been sold for this feature." 
            });
        }

        const updatedShow = await Show.findByIdAndUpdate(id, updateData, { new: true });

        res.json({ success: true, message: "Show updated successfully.", show: updatedShow });

    } catch (error) {
        console.error("Update Show Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 7. DELETE SHOW (Admin)
// ==========================================
export const deleteShow = async (req, res) => {
    try {
        const { id } = req.params;

        const show = await Show.findById(id);
        if (!show) return res.status(404).json({ success: false, message: "Show not found." });

        const hasBookings = (show.occupiedSeats instanceof Map && show.occupiedSeats.size > 0) || 
                            (show.occupiedSeats && Object.keys(show.occupiedSeats).length > 0);

        if (hasBookings) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete this show. Tickets have already been sold! Please cancel all bookings and refund customers before deleting the show."
            });
        }

        await Show.findByIdAndDelete(id);

        res.json({ success: true, message: "Show deleted successfully." });

    } catch (error) {
        console.error("Delete Show Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};