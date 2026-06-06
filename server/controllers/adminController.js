import axios from "axios";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Theater from "../models/Theater.js";
import Ticket from "../models/Ticket.js"; 
import { inngest } from "../inngest/index.js";
import sendEmail from "../configs/nodeMailer.js";

// --- AUTH & DASHBOARD ---

// 1. Check Admin Status (Quiet DB Check)
export const isAdmin = async (req, res) => {
    try {
        const clerkId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : null;
        if (!clerkId) return res.json({ success: true, isAdmin: false });

        // Check the actual MONGODB database for the role!
        const user = await User.findById(clerkId);
        
        if (user && user.role === 'admin') {
            return res.json({ success: true, isAdmin: true });
        } else {
            // Return 200 OK so the console stays clean, but isAdmin is false
            return res.json({ success: true, isAdmin: false });
        }
    } catch (error) {
        return res.json({ success: true, isAdmin: false });
    }
}

// 2. Dashboard Data
export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true })
            .populate({
                path: 'show',
                populate: { path: 'movie', select: 'title' }
            });

        let totalRevenue = 0;
        let platformProfit = 0; 
        let cinemaShare = 0;    
        let snacksRevenue = 0;
        let activeBookingsCount = 0;

        // Initialize maps before loop
        const salesMap = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            salesMap[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
        }

        const movieStats = {};

        bookings.forEach(b => {
            const dateKey = new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short' });

            // Calculate F&B for this booking
            let currentSnacksCost = 0;
            if (b.snacks && b.snacks.length > 0) {
                currentSnacksCost = b.snacks.reduce((acc, s) => acc + ((s.price || 0) * (s.quantity || 1)), 0);
            }

            // CANCELLATION LOGIC
            if (b.status === 'Cancelled') {
                const retainedFee = b.amount * 0.40;
                totalRevenue += retainedFee;
                platformProfit += retainedFee;
                snacksRevenue += (currentSnacksCost * 0.40);
                
                if (salesMap[dateKey] !== undefined) {
                    salesMap[dateKey] += retainedFee;
                }
            } 
            // NORMAL CONFIRMED BOOKING LOGIC
            else {
                activeBookingsCount++;
                totalRevenue += b.amount; 
                snacksRevenue += currentSnacksCost;

                let basePrice = 0; 
                let currentProfit = 0;

                if (b.paymentMethod === 'VENUE') {
                    const amountWithoutVenueCharge = b.amount - 50;
                    basePrice = amountWithoutVenueCharge / 1.1;
                    currentProfit = b.amount - basePrice;
                } else {
                    basePrice = b.amount / 1.1;
                    currentProfit = b.amount - basePrice;
                }

                platformProfit += currentProfit;
                cinemaShare += basePrice;

                if (salesMap[dateKey] !== undefined) {
                    salesMap[dateKey] += b.amount;
                }

                // Only count confirmed bookings for Movie Stats
                const title = b.show?.movie?.title || "Unknown";
                if (!movieStats[title]) movieStats[title] = 0;
                movieStats[title] += 1;
            }
        });

        platformProfit = Math.round(platformProfit);
        cinemaShare = Math.round(cinemaShare);
        totalRevenue = Math.round(totalRevenue);
        snacksRevenue = Math.round(snacksRevenue);

        const salesData = Object.entries(salesMap).map(([name, sales]) => ({ name, sales: Math.round(sales) }));

        const topMovies = Object.entries(movieStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const activeShows = await Show.countDocuments({ showDateTime: { $gte: new Date() } });
        const totalUser = await User.countDocuments();

        const recentBookings = await Booking.find({ isPaid: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate({ path: 'show', populate: { path: 'movie', select: 'title' } });

        res.json({
            success: true,
            dashboardData: {
                totalRevenue,
                platformProfit, 
                cinemaShare,
                snacksRevenue,    
                totalBookings: activeBookingsCount,
                totalUser,
                activeShows,
                salesData,
                topMovies,
                recentBookings
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.json({ success: false, message: error.message });
    }
}

// --- MOVIE MANAGEMENT ---

// 3. Add Movie
export const addMovieManual = async (req, res) => {
    try {
        const { 
            title, overview, poster_path, backdrop_path, release_date, 
            genres, runtime, tagline, trailer_url, censor_rating, languages, formats, vote_average
        } = req.body;

        if (!title || !overview || !release_date || !runtime) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const genreList = typeof genres === 'string' ? genres.split(',').map((g, i) => ({ id: i, name: g.trim() })) : genres;
        const langList = typeof languages === 'string' ? languages.split(',').map(l => l.trim()) : languages;
        const formatList = typeof formats === 'string' ? formats.split(',').map(f => f.trim()) : formats;

        const newMovie = new Movie({
            title, overview, poster_path, backdrop_path, release_date,
            genres: genreList, 
            runtime: Number(runtime),
            tagline, trailer_url, 
            censor_rating: censor_rating || "U/A",
            languages: langList,
            formats: formatList,
            vote_average: Number(vote_average) || 5.0, 
            vote_count: vote_average ? 1 : 0
        });

        await newMovie.save();
        res.json({ success: true, message: "Movie added successfully!" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// 4. Update Movie
export const updateMovie = async (req, res) => {
    try {
        const { _id, genres, languages, formats, vote_average, ...updateData } = req.body;
        if (!_id) return res.json({ success: false, message: "Movie ID is required" });

        if (vote_average) updateData.vote_average = Number(vote_average);

        let formattedGenres = genres;
        if (typeof genres === 'string') formattedGenres = genres.split(',').map((g, index) => ({ id: index, name: g.trim() }));
        
        let formattedLangs = languages;
        if (typeof languages === 'string') formattedLangs = languages.split(',').map(l => l.trim());

        let formattedFormats = formats;
        if (typeof formats === 'string') formattedFormats = formats.split(',').map(f => f.trim());

        await Movie.findByIdAndUpdate(_id, {
            ...updateData,
            genres: formattedGenres,
            languages: formattedLangs,
            formats: formattedFormats
        });

        res.json({ success: true, message: "Movie Updated Successfully!" });
    } catch (error) {
        console.error("Update Error:", error);
        res.json({ success: false, message: error.message });
    }
}

// 5. Delete Movie
export const deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.body.id);
        await Show.deleteMany({ movie: req.body.id });
        res.json({ success: true, message: "Movie & Associated Shows Deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 6. Get All Movies
export const getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find({}).sort({ createdAt: -1 });
        res.json({ success: true, movies });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- THEATER MANAGEMENT ---

// 7. Add Theater
export const addTheater = async (req, res) => {
    try {
        const { name, city, address, pincode, lat, long, facilities } = req.body;
        const facilitiesList = typeof facilities === 'string' ? facilities.split(',').map(f => f.trim()) : [];

        const theater = new Theater({
            name, city, address, pincode,
            location: { type: "Point", coordinates: [Number(long) || 0, Number(lat) || 0] },
            facilities: facilitiesList
        });

        await theater.save();
        res.json({ success: true, message: "Theater Added Successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// 8. Update Theater
export const updateTheater = async (req, res) => {
    try {
        const { _id, lat, long, facilities, ...updateData } = req.body;
        const facilitiesList = typeof facilities === 'string' ? facilities.split(',').map(f => f.trim()) : facilities;

        await Theater.findByIdAndUpdate(_id, {
            ...updateData,
            location: { type: "Point", coordinates: [Number(long), Number(lat)] },
            facilities: facilitiesList
        });
        res.json({ success: true, message: "Theater Updated Successfully" });
    } catch (error) {
        console.error("Update Theater Error:", error);
        res.json({ success: false, message: error.message });
    }
}

// 9. Get All Theaters
export const getAllTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find({}).sort({ createdAt: -1 });
        res.json({ success: true, theaters });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 10. Delete Theater
export const deleteTheater = async (req, res) => {
    try {
        await Theater.findByIdAndDelete(req.body.id);
        // Also delete any shows scheduled at this theater to prevent orphaned data
        await Show.deleteMany({ theater: req.body.id });
        res.json({ success: true, message: "Theater and associated shows deleted" });
    } catch (error) {
        console.error("Delete Theater Error:", error);
        res.json({ success: false, message: error.message });
    }
}


// --- SHOW MANAGEMENT ---

// 11. Add Show (Bulk)
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, theaterId, priceConfig, language, format } = req.body;

        if (!movieId || !theaterId || !language || !format) return res.json({ success: false, message: "Missing required fields." });
        if (!priceConfig?.royal || !priceConfig?.premium || !priceConfig?.plaza) return res.json({ success: false, message: "Prices missing." });

        const movie = await Movie.findById(movieId);
        if (!movie) return res.json({ success: false, message: "Movie not found." });

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach((time) => {
                const dateTimeString = `${showDate}T${time}`;
                const validDate = new Date(dateTimeString);
                if (!isNaN(validDate)) {
                    showsToCreate.push({
                        movie: movieId, theater: theaterId, showDateTime: validDate,
                        language, format,
                        ticketPrice: { royal: Number(priceConfig.royal), premium: Number(priceConfig.premium), plaza: Number(priceConfig.plaza) },
                        occupiedSeats: new Map() 
                    });
                }
            });
        });

        if (showsToCreate.length > 0) await Show.insertMany(showsToCreate);
        else return res.json({ success: false, message: "Invalid Dates/Times." });

        try { await inngest.send({ name: "app/show.added", data: { movieTitle: movie.title } }); } catch (e) {}

        res.json({ success: true, message: 'Schedule Saved Successfully!' });
    } catch (error) {
        console.error("Add Show Error:", error);
        res.json({ success: false, message: error.message });
    }
}

// 12. Get All Shows
export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({})
            .populate('movie', 'title poster_path language formats')
            .populate('theater', 'name city')
            .sort({ showDateTime: -1 });
        res.json({ success: true, shows });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 13. Delete Show
export const deleteShow = async (req, res) => {
    try {
        await Show.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Show Deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 14. UPDATE SHOW (Single Instance)
export const updateShow = async (req, res) => {
    try {
        const { id, showDateTime, format, ticketPrice } = req.body;
        
        await Show.findByIdAndUpdate(id, {
            showDateTime,
            format,
            ticketPrice
        });

        res.json({ success: true, message: "Show updated successfully" });
    } catch (error) {
        console.error("Update Show Error:", error);
        res.json({ success: false, message: error.message });
    }
}

// --- BOOKINGS & USERS ---

// 15. Get All Bookings (Paginated & Filtered)
export const getAllBookings = async (req, res) => {
    try {
        const { page = 1, limit = 15, search = '', dateFilter = 'ALL', theaterFilter = 'ALL' } = req.query;

        // 1. Build the Show Query (Filtering by Theater and Date)
        let showQuery = {};

        // Theater Filter
        if (theaterFilter !== 'ALL') {
            showQuery.theater = theaterFilter;
        }

        // Date Filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'UPCOMING') {
            showQuery.showDateTime = { $gte: today };
        } else if (dateFilter === 'PAST') {
            showQuery.showDateTime = { $lt: today };
        } else if (dateFilter === 'TODAY') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            showQuery.showDateTime = { $gte: today, $lt: tomorrow };
        }

        // Fetch matching shows to get their IDs
        let showIds = null;
        if (Object.keys(showQuery).length > 0) {
            const matchingShows = await Show.find(showQuery).select('_id');
            showIds = matchingShows.map(s => s._id);
        }

        // 2. Build the Main Booking Query
        let bookingQuery = {};

        // Apply Show IDs filter
        if (showIds !== null) {
            bookingQuery.show = { $in: showIds };
        }

        // Search Filter (User Name, Email, or Booking ID)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            
            // Find users matching the search term
            const users = await User.find({
                $or: [ { name: searchRegex }, { email: searchRegex } ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            // Add conditions to the booking query
            const searchConditions = [];
            
            if (userIds.length > 0) {
                searchConditions.push({ user: { $in: userIds } });
            }
            
            // If the search string looks like it could be a valid Mongo ID snippet, search the booking ID too
            if (search.length > 3) {
                searchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: search,
                            options: "i"
                        }
                    }
                });
            }

            if (searchConditions.length > 0) {
                bookingQuery.$or = searchConditions;
            } else {
                // If search string doesn't match users or IDs, return empty result
                return res.json({ success: true, bookings: [], total: 0 });
            }
        }

        // 3. Execute Paginated Query
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const total = await Booking.countDocuments(bookingQuery);
        const bookings = await Booking.find(bookingQuery)
            .populate('user', 'name email image')
            .populate({
                path: "show",
                populate: [
                    { path: "movie", select: 'title poster_path' },
                    { path: "theater", select: 'name city' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ success: true, bookings, total });

    } catch (error) {
        console.error("Get All Bookings Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// 16. Delete Booking
export const deleteBooking = async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Booking Cancelled" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 17. Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "bookings",        
                    localField: "_id",       
                    foreignField: "user",    
                    as: "bookingData"
                }
            },
            {
                $project: {
                    _id: 1, name: 1, email: 1, image: 1, role: 1, createdAt: 1, isBanned: 1,
                    coins: 1, 
                    loyaltyPoints: 1, 
                    theaterId: 1, // Expose theaterId for Admin UI dropdowns
                    totalBookings: { $size: "$bookingData" }, 
                    lastBooking: { $max: "$bookingData.createdAt" } 
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// 18. Toggle Ban
export const toggleUserBan = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if(!user) return res.json({ success: false, message: "User not found" });

        user.isBanned = !user.isBanned; 
        await user.save();

        res.json({ success: true, message: user.isBanned ? "User Banned" : "User Activated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 19. Change Role
export const changeUserRole = async (req, res) => {
    try {
        const { userId, newRole, theaterId } = req.body; 
        
        await User.findByIdAndUpdate(userId, { 
            role: newRole,
            theaterId: newRole === 'cinema' ? theaterId : null // Only assign theater if role is cinema
        });
        
        res.json({ success: true, message: `Role updated to ${newRole}` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 20. Test Email Integration
export const testEmailIntegration = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ success: false, message: "Please provide an email address." });

        console.log(`Sending test email to: ${email}`);

        await sendEmail({
            to: email,
            subject: "EventXpress SMTP Test 🚀",
            body: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #F84565;">It Works!</h2>
                    <p>Your <strong>Brevo (SMTP)</strong> connection is active.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">Sent from EventXpress Backend</p>
                </div>
            `
        });

        res.json({ success: true, message: `Email sent to ${email}` });

    } catch (error) {
        console.error("SMTP Test Error:", error);
        res.json({ success: false, message: "Email Failed: " + error.message });
    }
}

// --- SUPPORT TICKETS ---

// 21. Get All Support Tickets for Admin (with user info + related booking)
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({})
            .populate('user', 'name email image role isBanned coins loyaltyPoints createdAt')
            .populate({
                path: 'relatedBooking',
                populate: [
                    { path: 'show', populate: [
                        { path: 'movie', select: 'title poster_path' },
                        { path: 'theater', select: 'name city' }
                    ]}
                ]
            })
            .sort({ updatedAt: -1 }); 
        
        res.json({ success: true, tickets });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 22. Admin Reply to Ticket
export const replyToTicket = async (req, res) => {
    try {
        const { ticketId, text, status } = req.body;
        const ticket = await Ticket.findById(ticketId);
        
        if (!ticket) return res.json({ success: false, message: "Ticket not found" });

        ticket.messages.push({
            sender: 'Agent',
            text: text
        });

        if (status) {
            ticket.status = status;
        } else if (ticket.status === 'Open') {
            ticket.status = 'In Progress';
        }

        await ticket.save();
        res.json({ success: true, message: "Reply sent successfully!", ticket });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 22b. Get a specific user's booking history (for support context)
export const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.json({ success: false, message: "User ID required" });

        const bookings = await Booking.find({ user: userId })
            .populate({
                path: 'show',
                populate: [
                    { path: 'movie', select: 'title poster_path' },
                    { path: 'theater', select: 'name city' }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, bookings });
    } catch (error) {
        console.error("User bookings fetch error:", error);
        res.json({ success: false, message: error.message });
    }
}

// --- BOX OFFICE ---

// 23. Get Shows for Box Office (Cinema Staff Only)
export const getCinemaShows = async (req, res) => {
    try {
        const clerkId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : null;
        if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const staffMember = await User.findById(clerkId);
        
        if (!staffMember || staffMember.role !== 'cinema' || !staffMember.theaterId) {
            return res.json({ success: false, message: "Account not assigned to a theater." });
        }

        const shows = await Show.find({ 
            theater: staffMember.theaterId,
            showDateTime: { $gte: new Date() } 
        })
        .populate('movie', 'title poster_path language formats')
        .sort({ showDateTime: 1 }); 

        res.json({ success: true, shows });
    } catch (error) {
        console.error("Box Office Fetch Error:", error);
        res.json({ success: false, message: error.message });
    }
}