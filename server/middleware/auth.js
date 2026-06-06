import User from '../models/User.js';

// Helper function to safely extract the Clerk userId
const getUserId = (req) => req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : null;

/**
 * 1. Regular User Auth Middleware
 * Used for: Booking tickets online, viewing personal history.
 */
export const authUser = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
        }

        // OPTIONAL BUT RECOMMENDED: Hard-block banned users at the API level
        const user = await User.findById(userId);
        if (user && user.isBanned) {
            return res.status(403).json({ success: false, message: "Account suspended. Please contact support." });
        }

        req.userId = userId;
        req.user = user; // Attach the user object to save a DB query in downstream controllers
        
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({ success: false, message: "Authentication failed." });
    }
};

/**
 * 2. Staff Auth Middleware
 * Used for: Box Office POS, Scanning Tickets, Viewing Manifests.
 */
export const authStaff = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized access." });

        // Fetch the user from MongoDB to check their real role
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({ success: false, message: "User profile not found in database." });
        }

        // SECURITY: Block banned staff immediately
        if (user.isBanned) {
            return res.status(403).json({ success: false, message: "Account suspended. Access Denied." });
        }

        // Check if the user has either the cinema staff or admin role
        if (user.role !== 'cinema' && user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied. Cinema Staff privileges required." });
        }

        // Attach properties to the request so controllers don't have to query the DB again
        req.userId = userId;
        req.role = user.role;
        req.theaterId = user.theaterId; 
        
        next();
    } catch (error) {
        console.error("Staff Auth Error:", error);
        return res.status(500).json({ success: false, message: "Staff authorization failed." });
    }
};

/**
 * 3. Admin Auth Middleware
 * Used for: Creating shows, viewing financial dashboards, managing theater settings.
 */
export const authAdmin = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized access." });

        // Fetch the user from MongoDB to check their real role
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({ success: false, message: "User profile not found in database." });
        }

        // SECURITY: Block banned admins
        if (user.isBanned) {
            return res.status(403).json({ success: false, message: "Account suspended. Access Denied." });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied. Super Admin privileges required." });
        }

        // Attach properties to the request
        req.userId = userId;
        req.isAdmin = true;
        
        next();
    } catch (error) {
        console.error("Admin Auth Error:", error);
        return res.status(500).json({ success: false, message: "Admin authorization failed." });
    }
};