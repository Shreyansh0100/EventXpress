import express from "express";
import { 
    addShow, 
    updateShow,      // <-- Make sure you export this from controller
    deleteShow,      // <-- Make sure you export this from controller
    getNowPlayingMovies, 
    getShow, 
    getShows, 
    getMovieShowtimes 
} from "../controllers/showController.js";
import { authAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

// ==========================================
// PUBLIC ROUTES (For Customers / Mobile App)
// ==========================================
showRouter.get('/now-playing', getNowPlayingMovies); // Home Screen
showRouter.get('/showtimes/:movieId', getMovieShowtimes); // Movie Details Page

// Note: /:movieId must be at the bottom of the public GET requests to prevent it from catching other routes
showRouter.get("/:movieId", getShow); // Single Movie Details

// ==========================================
// ADMIN ROUTES (For Managers)
// ==========================================
showRouter.get("/admin/all", authAdmin, getShows); // Admin List
showRouter.post('/create', authAdmin, addShow); // Admin Add Show
showRouter.put('/update/:id', authAdmin, updateShow); // Admin Edit Show
showRouter.delete('/delete/:id', authAdmin, deleteShow); // Admin Delete Show

export default showRouter;