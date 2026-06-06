import express from 'express';
import { 
    createLocalSnack, 
    getMyLocalMenu, 
    getSnacksForTheater, 
    toggleSnackStock, 
    updateSnack, 
    deleteSnack 
} from '../controllers/snackController.js';

// Using authUser so both Admin and Cinema Staff can pass through 
// (Strict role verification is handled inside the controller itself)
import { authUser } from '../middleware/auth.js'; 

const snackRouter = express.Router();

// ==========================================
// 🍿 PUBLIC / ADMIN / CHECKOUT ROUTES
// ==========================================
// Used by the User App during checkout (must pass ?theaterId=...)
// Also used by Admin Panel to view all snacks globally (passes ?all=true)
snackRouter.get('/list', getSnacksForTheater); 
snackRouter.get('/', getSnacksForTheater); // Kept for backward compatibility

// ==========================================
// 🎬 STAFF & ADMIN ROUTES (Menu Management)
// ==========================================
// Fetch strictly the menu for the logged-in staff's assigned theater
snackRouter.get('/my-menu', authUser, getMyLocalMenu);

// Create routes (Both point to the same smart controller logic)
snackRouter.post('/create-local', authUser, createLocalSnack); // Used by Cinema Staff
snackRouter.post('/add', authUser, createLocalSnack);          // Used by Super Admin

// Update, Delete, and Toggle Stock
snackRouter.post('/update', authUser, updateSnack); 
snackRouter.post('/toggle-stock', authUser, toggleSnackStock);
snackRouter.post('/delete', authUser, deleteSnack); 

export default snackRouter;