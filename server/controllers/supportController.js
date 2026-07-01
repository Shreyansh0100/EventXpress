import { askAI } from "../services/ai.js";
import Ticket from "../models/Ticket.js";

// 1. Create a new Support Ticket & Chat
export const createTicket = async (req, res) => {
    try {
        const { subject, relatedBooking } = req.body;
        
        // SAFE USER ID EXTRACTION (Clerk Auth Support)
        const userId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : req.body.userId || req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. User ID not found." });
        }

        // Initial message from the user
        const initialUserMessage = {
            sender: 'User',
            text: `I need help with: ${subject}`
        };

        // Automated AI Response to make it feel futuristic
        const aiMessage = await askAI(
            `A user has opened a support ticket with subject: ${subject}`
        );
        
        const automatedAIResponse = {
            sender: "AI",
            text: aiMessage
        };

        const newTicket = new Ticket({
            user: userId,
            subject,
            relatedBooking: relatedBooking || null,
            messages: [initialUserMessage, automatedAIResponse]
        });

        await newTicket.save();

        res.json({ success: true, message: "Ticket created successfully", ticket: newTicket });
    } catch (error) {
        console.error("Create Ticket Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// 2. Get all tickets for the logged-in User
export const getUserTickets = async (req, res) => {
    try {
        // SAFE USER ID EXTRACTION (Clerk Auth Support)
        const userId = req.auth ? (typeof req.auth === 'function' ? req.auth().userId : req.auth.userId) : req.body.userId || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. User ID not found." });
        }
        
        // Fetch tickets and sort by newest first
        const tickets = await Ticket.find({ user: userId })
            .sort({ updatedAt: -1 })
            .populate('relatedBooking');

        res.json({ success: true, tickets });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// 3. Add a new message to an existing chat
export const addChatMessage = async (req, res) => {
    try {
        console.log("Message endpoint called");
console.log(req.body);
        const { ticketId, text, sender } = req.body;

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        // Save user message
        ticket.messages.push({
            sender: sender || "User",
            text
        });

        // AI replies only to user
        if ((sender || "User") === "User") {

            const aiReply = await askAI(text);

            ticket.messages.push({
                sender: "AI",
                text: aiReply
            });

        }

        // Agent changes status
        if (sender === "Agent" && ticket.status === "Open") {
            ticket.status = "In Progress";
        }

        await ticket.save();

        res.json({
            success: true,
            ticket
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: error.message
        });

    }
};