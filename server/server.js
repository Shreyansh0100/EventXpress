import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";

import connectDB from './configs/db.js';
import { inngest, functions } from "./inngest/index.js";

// Routers
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import theaterRouter from './routes/theaterRoutes.js';
import snackRouter from './routes/snackRoutes.js';
import movieRouter from './routes/movieRoutes.js';
import offerRouter from './routes/offerRoutes.js';
import supportRouter from './routes/supportRoutes.js';
import boxOfficeRouter from './routes/boxOfficeRouter.js';
import requestRouter from './routes/requestRoutes.js';

// Init
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// ✅ ALLOWED ORIGINS (ADD YOUR VERCEL DOMAIN HERE)
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
];

// ✅ SOCKET.IO CONFIG (FIXED)
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ✅ EXPRESS CORS (FIXED)
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.get('/', (req, res) => res.send('EventXpress Server is Live!'));

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/theaters', theaterRouter);
app.use('/api/snacks', snackRouter);
app.use('/api/movie', movieRouter);
app.use('/api/offers', offerRouter);
app.use('/api/support', supportRouter);
app.use('/api/box-office', boxOfficeRouter);
app.use('/api/schedule-requests', requestRouter);

// ================= SOCKET LOGIC =================

const lockedSeats = {};

io.on('connection', (socket) => {

    socket.on('join_show', (showId) => {
        socket.join(showId);
        socket.emit('sync_locked_seats', lockedSeats[showId] || {});
    });

    socket.on('lock_seat', ({ showId, seatId, action }) => {
        if (!lockedSeats[showId]) lockedSeats[showId] = {};

        if (action === 'lock') {
            lockedSeats[showId][seatId] = {
                socketId: socket.id,
                timestamp: Date.now()
            };
        } else if (action === 'unlock') {
            delete lockedSeats[showId][seatId];
        }

        socket.to(showId).emit('seat_updated', lockedSeats[showId]);
    });

    socket.on('heartbeat', ({ showId, activeSeats }) => {
        if (!lockedSeats[showId]) return;

        activeSeats.forEach(seatId => {
            if (
                lockedSeats[showId][seatId] &&
                lockedSeats[showId][seatId].socketId === socket.id
            ) {
                lockedSeats[showId][seatId].timestamp = Date.now();
            }
        });
    });

    socket.on('disconnect', () => {
        for (const showId in lockedSeats) {
            let changed = false;

            for (const seatId in lockedSeats[showId]) {
                if (lockedSeats[showId][seatId].socketId === socket.id) {
                    delete lockedSeats[showId][seatId];
                    changed = true;
                }
            }

            if (changed) {
                io.to(showId).emit('seat_updated', lockedSeats[showId]);
            }
        }
    });
});

// ✅ AUTO CLEANUP (NO CHANGE)
setInterval(() => {
    const now = Date.now();

    for (const showId in lockedSeats) {
        let changed = false;

        for (const seatId in lockedSeats[showId]) {
            if (now - lockedSeats[showId][seatId].timestamp > 30000) {
                delete lockedSeats[showId][seatId];
                changed = true;
            }
        }

        if (changed) {
            io.to(showId).emit('seat_updated', lockedSeats[showId]);
        }
    }
}, 10000);

// Boot
await connectDB();

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});