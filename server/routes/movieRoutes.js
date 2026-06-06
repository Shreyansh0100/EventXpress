import express from 'express';
import { getLatestMovies, getMovieById } from '../controllers/movieController.js';

const movieRouter = express.Router();

// Public Routes: Fetches movies from the database regardless of theater showtimes
movieRouter.get('/latest', getLatestMovies);
movieRouter.get('/:id', getMovieById);

export default movieRouter;