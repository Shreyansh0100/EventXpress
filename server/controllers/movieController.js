import Movie from "../models/Movie.js";

// 1. Get Latest Movies (Public - For Home Page Trailers)
export const getLatestMovies = async (req, res) => {
    try {
        const movies = await Movie.find({})
            .sort({ createdAt: -1 }) 
            .limit(4); 
            
        res.json({ success: true, movies });
    } catch (error) {
        console.error("Error fetching latest movies:", error);
        res.json({ success: false, message: error.message });
    }
}

// 2. NEW: Get Single Movie Details (The missing export)
export const getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.findById(id);
        
        if (!movie) {
            return res.json({ success: false, message: "Movie not found" });
        }

        res.json({ success: true, movie });
    } catch (error) {
        console.error("Error fetching movie by ID:", error);
        res.json({ success: false, message: error.message });
    }
}