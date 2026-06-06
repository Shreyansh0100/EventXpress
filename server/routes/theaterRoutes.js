import express from 'express';
import { 
    getNearbyTheaters, 
    getTheatersByCity, 
    getTheaterById, 
    getMoviesByTheater,
    // Admin Controllers
    addTheater,
    getAllTheaters,
    deleteTheater
} from '../controllers/theaterController.js';
import { authUser } from '../middleware/auth.js'; // Protects your admin routes

const theaterRouter = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (For the Users)
// ==========================================
theaterRouter.post('/nearby', getNearbyTheaters);
theaterRouter.get('/list', getTheatersByCity); 

// IMPORTANT: /movies/:id MUST come before /:id, otherwise Express gets confused!
theaterRouter.get('/movies/:id', getMoviesByTheater); 
theaterRouter.get('/:id', getTheaterById);


// ==========================================
// 2. ADMIN ROUTES (Secured with authUser)
// ==========================================
theaterRouter.post('/add', authUser, addTheater);
theaterRouter.get('/all', authUser, getAllTheaters); // Lists all theaters for the admin dashboard
theaterRouter.post('/delete', authUser, deleteTheater);

export default theaterRouter;