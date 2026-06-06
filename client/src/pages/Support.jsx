import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
    MessageSquare, Ticket, CreditCard, Film, ChevronDown, 
    Bot, Phone, Mail, Clock, AlertCircle, ArrowRight, 
    CheckCircle2, Headset, MapPin, Send, ArrowLeft, User as UserIcon,
    Sparkles, ShieldCheck, LifeBuoy, HelpCircle, ChevronRight,
    Zap, Star, XCircle, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Support = () => {
    const { user, axios, getToken } = useAppContext();
    const navigate = useNavigate();
    
    // Dashboard States
    const [latestBooking, setLatestBooking] = useState(null);
    const [allBookings, setAllBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [activeTicketStatus, setActiveTicketStatus] = useState(null); 
    const [myTickets, setMyTickets] = useState([]);

    // Chat Window States
    const [activeTicket, setActiveTicket] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);

    // View state for dashboard
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'tickets' | 'bookings'

    // Helper to ensure TMDB images load correctly
    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://image.tmdb.org/t/p/w500${path}`;
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (activeTicket) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    // Fetch initial data
    useEffect(() => {
        const fetchSupportData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            try {
                const token = await getToken();
                
                const bookingRes = await axios.get('/api/bookings/my-bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (bookingRes.data.success && bookingRes.data.bookings.length > 0) {
                    setAllBookings(bookingRes.data.bookings);
                    setLatestBooking(bookingRes.data.bookings[0]);
                }

                const ticketRes = await axios.get('/api/support/my-tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ticketRes.data.success) {
                    setMyTickets(ticketRes.data.tickets);
                }

            } catch (error) {
                console.error("Failed to fetch support data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupportData();
    }, [user, axios, getToken]);

    // --- CREATE TICKET HANDLER ---
    const handleCreateTicket = async (issueType, bookingId = null) => {
        if (!user) return toast.error("Please log in to contact support.");
        
        setActiveTicketStatus(`Creating ticket: ${issueType}...`);
        
        try {
            const token = await getToken();
            const payload = {
                subject: issueType,
                relatedBooking: bookingId || (latestBooking ? latestBooking._id : null)
            };

            const { data } = await axios.post('/api/support/create', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Ticket created! AI has responded.", { icon: '🤖' });
                setMyTickets([data.ticket, ...myTickets]);
                setActiveTicket(data.ticket);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create ticket.");
        } finally {
            setActiveTicketStatus(null);
        }
    };

    // --- SEND MESSAGE ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !activeTicket) return;

        setIsSending(true);
        const token = await getToken();

        const newMessage = { sender: 'User', text: chatInput, timestamp: new Date().toISOString() };
        setActiveTicket(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
        const inputMemory = chatInput;
        setChatInput('');

        try {
            const { data } = await axios.post('/api/support/message', {
                ticketId: activeTicket._id,
                text: inputMemory,
                sender: 'User'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setActiveTicket(data.ticket);
                setMyTickets(prev => prev.map(t => t._id === data.ticket._id ? data.ticket : t));
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            toast.error("Error sending message");
        } finally {
            setIsSending(false);
        }
    };

    // --- DATA ---
    const faqs = [
        { 
            q: "How do I cancel my ticket and get a refund?", 
            a: "You can cancel up to 4 hours before showtime via 'My Bookings'. You'll receive a 60% refund to your original payment method. The remaining 40% is retained as a cancellation fee, and 60% of earned loyalty coins will be reversed." 
        },
        { 
            q: "Why didn't I receive my E-Ticket?", 
            a: "Emails sometimes land in spam. But don't worry — your ticket is always available in 'My Bookings'. Just show the QR code at the cinema entrance." 
        },
        { 
            q: "How do Loyalty Coins work?", 
            a: "Earn coins (5% of your total) on every booking. Use them at checkout for discounts on future tickets and F&B combos." 
        },
        { 
            q: "What is 'High Demand Surge' pricing?", 
            a: "For blockbuster openings, a small dynamic surge (usually ~10%) is applied based on seat scarcity. It's shown transparently before checkout." 
        },
        { 
            q: "Can I change my seats after booking?", 
            a: "Seat modifications aren't supported after confirmation. You'll need to cancel the booking (if eligible) and rebook with new seats." 
        }
    ];

    const quickActions = [
        { title: "Payment & Refunds", desc: "Charges, refund status, failed payments", icon: CreditCard, gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", iconColor: "text-emerald-400" },
        { title: "Booking Issues", desc: "Seat problems, wrong show, e-ticket", icon: Ticket, gradient: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", iconColor: "text-blue-400" },
        { title: "Theater Experience", desc: "Cleanliness, sound, screen quality", icon: Film, gradient: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20", iconColor: "text-purple-400" },
        { title: "Account & Offers", desc: "Login issues, promo codes, coins", icon: Star, gradient: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", iconColor: "text-amber-400" }
    ];

    const getStatusConfig = (status) => {
        if (status === 'Resolved' || status === 'Closed') return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' };
        if (status === 'In Progress') return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500 animate-pulse' };
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500 animate-pulse' };
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };


    // ══════════════════════════════════════════════════════════════════
    // RENDER: CHAT VIEW
    // ══════════════════════════════════════════════════════════════════
    if (activeTicket) {
        const isResolved = activeTicket.status === 'Resolved' || activeTicket.status === 'Closed';
        return (
            <div className="min-h-screen bg-[#050505] text-white font-outfit pb-6 pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16 flex justify-center h-screen md:h-auto">
                <div className="w-full max-w-5xl flex gap-5 h-[calc(100vh-6rem)] sm:h-[80vh]">
                    
                    {/* Ticket Sidebar */}
                    <div className="hidden lg:flex w-72 bg-[#0a0a0a] border border-white/5 rounded-2xl flex-col overflow-hidden shrink-0">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <MessageSquare size={14}/> Conversations
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {myTickets.map(ticket => {
                                const cfg = getStatusConfig(ticket.status);
                                return (
                                    <div 
                                        key={ticket._id}
                                        onClick={() => setActiveTicket(ticket)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                            activeTicket._id === ticket._id 
                                                ? 'bg-primary/5 border-primary/20' 
                                                : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-white truncate pr-2 flex-1">{ticket.subject}</p>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-600 truncate">
                                            {ticket.messages?.[ticket.messages.length - 1]?.text || ''}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-3 border-t border-white/5">
                            <button 
                                onClick={() => { setActiveTicket(null); setView('dashboard'); }}
                                className="w-full py-2.5 bg-white/[0.03] border border-white/5 text-gray-400 text-xs font-bold rounded-xl hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={14}/> Back to Help Center
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                        {/* Chat Header */}
                        <div className="p-3 sm:p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <button 
                                    onClick={() => setActiveTicket(null)}
                                    className="lg:hidden p-1.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 shrink-0"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Headset className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-primary"/>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-sm sm:text-base text-white truncate pr-2">{activeTicket.subject}</h2>
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isResolved ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></span>
                                        <span className="truncate">{isResolved ? 'Resolved' : 'Support Active'}</span>
                                        <span className="text-gray-700 shrink-0">•</span>
                                        <span className="font-mono shrink-0">#{activeTicket._id.slice(-6)}</span>
                                    </p>
                                </div>
                            </div>
                            {!isResolved && (
                                <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
                                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg font-bold">
                                        Avg reply: ~5 min
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
                            {/* Opening timestamp */}
                            <div className="flex items-center justify-center gap-3 my-2">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <span className="text-[9px] text-gray-600 font-mono px-3 whitespace-nowrap">
                                    {new Date(activeTicket.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                </span>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            {activeTicket.messages.map((msg, idx) => {
                                const isUser = msg.sender === 'User';
                                const isAI = msg.sender === 'AI';

                                return (
                                    <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex max-w-[90%] sm:max-w-[85%] md:max-w-[70%] gap-2 sm:gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                            
                                            {/* Avatar */}
                                            <div className={`shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                                                isUser 
                                                    ? 'bg-gray-800 border border-gray-700 text-gray-400' 
                                                    : isAI 
                                                        ? 'bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 text-violet-400' 
                                                        : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 text-blue-400'
                                            }`}>
                                                {isUser ? <UserIcon size={12} className="sm:w-3.5 sm:h-3.5"/> : isAI ? <Sparkles size={12} className="sm:w-3.5 sm:h-3.5"/> : <ShieldCheck size={12} className="sm:w-3.5 sm:h-3.5"/>}
                                            </div>

                                            {/* Bubble */}
                                            <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-3.5 ${
                                                isUser 
                                                    ? 'bg-primary text-white rounded-tr-sm shadow-[0_4px_20px_rgba(248,69,101,0.15)]' 
                                                    : isAI
                                                        ? 'bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/10 text-gray-200 rounded-tl-sm'
                                                        : 'bg-white/[0.04] border border-white/5 text-gray-200 rounded-tl-sm'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                                                        isUser ? 'text-red-200' : isAI ? 'text-violet-300' : 'text-blue-300'
                                                    }`}>
                                                        {isUser ? 'You' : isAI ? '✨ EventXpress AI' : '🛡️ Support Agent'}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-[13px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <span className={`text-[8px] sm:text-[9px] mt-1.5 sm:mt-2 block ${isUser ? 'text-red-200/60 text-right' : 'text-gray-500'}`}>
                                                    {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        {!isResolved ? (
                            <div className="p-2 sm:p-3 bg-white/[0.02] border-t border-white/5 shrink-0">
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                    <div className="flex-1 relative">
                                        <textarea 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Describe your issue in detail..."
                                            rows={1}
                                            className="w-full bg-black/40 border border-white/5 text-white rounded-xl p-3 text-xs sm:text-sm resize-none outline-none focus:border-primary/30 transition-colors custom-scrollbar placeholder-gray-600 min-h-[44px] max-h-[120px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    // Prevent default newline behavior on enter without shift
                                                    if(window.innerWidth > 640) {
                                                        e.preventDefault();
                                                        handleSendMessage(e);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSending || !chatInput.trim()}
                                        className="h-11 sm:h-[44px] w-11 sm:w-auto sm:px-5 bg-primary hover:bg-rose-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-[0_0_15px_rgba(248,69,101,0.2)] disabled:shadow-none shrink-0"
                                    >
                                        {isSending ? <Clock size={16} className="animate-spin"/> : <Send size={16} className="sm:mr-0.5 ml-0.5 sm:ml-0"/>}
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </form>
                                <p className="text-[8px] sm:text-[9px] text-gray-600 text-center mt-1.5 hidden sm:block">
                                    Press <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Enter</kbd> to send, <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Shift</kbd> + <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Enter</kbd> for new line
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 sm:p-4 bg-emerald-500/5 border-t border-emerald-500/10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shrink-0 text-center">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-500"/>
                                    <span className="text-xs text-emerald-400 font-bold">This conversation has been resolved.</span>
                                </div>
                                <button 
                                    onClick={() => handleCreateTicket(`Follow-up: ${activeTicket.subject}`)}
                                    className="text-xs text-gray-400 hover:text-white underline underline-offset-2 flex items-center gap-1 transition-colors"
                                >
                                    <RotateCcw size={12}/> Reopen Ticket
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }


    // ══════════════════════════════════════════════════════════════════
    // RENDER: DASHBOARD (Help Center Home)
    // ══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#050505] text-white font-outfit pb-20 sm:pb-24 pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16 overflow-x-hidden max-w-[1600px] mx-auto">
            
            {/* Hero */}
            <div className="max-w-5xl mx-auto text-center mb-8 sm:mb-12 relative px-2">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary font-bold text-[10px] sm:text-xs mb-4 sm:mb-5 border border-primary/20">
                        <Zap size={12} className="sm:w-3.5 sm:h-3.5"/> 24/7 Priority Support
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 tracking-tight leading-tight">
                        How can we <span className="text-primary">help</span> you?
                    </h1>
                    <p className="text-gray-500 text-sm md:text-lg max-w-[280px] sm:max-w-xl mx-auto leading-relaxed">
                        Get instant AI-powered answers or connect with our support team.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                
                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                    {quickActions.map((action, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleCreateTicket(action.title)}
                            className={`bg-gradient-to-b ${action.gradient} border ${action.border} rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col justify-center h-full`}
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/[0.02] rounded-full blur-xl pointer-events-none"></div>
                            <action.icon size={20} className={`${action.iconColor} mb-2 sm:mb-3 sm:w-6 sm:h-6 shrink-0`}/>
                            <h4 className="font-bold text-xs sm:text-sm text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">{action.title}</h4>
                            <p className="text-[9px] sm:text-[11px] text-gray-500 leading-relaxed line-clamp-2">{action.desc}</p>
                        </div>
                    ))}
                </div>

                {activeTicketStatus && (
                    <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs sm:text-sm font-bold text-center animate-pulse flex items-center justify-center gap-2">
                        <Sparkles size={14} className="sm:w-4 sm:h-4"/> {activeTicketStatus}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    
                    {/* LEFT: Smart Assist + Recent Booking */}
                    <div className="lg:col-span-2 space-y-5 sm:space-y-6">
                        
                        {/* Latest Booking Context Card */}
                        {!user ? (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8 text-center">
                                <UserIcon size={32} className="mx-auto mb-3 text-gray-700"/>
                                <p className="text-gray-400 mb-4 text-xs sm:text-sm max-w-sm mx-auto">Log in to access AI-powered support that knows your bookings.</p>
                                <button onClick={() => navigate('/')} className="w-full sm:w-auto bg-white text-black font-bold px-8 py-2.5 sm:py-3 rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-sm shadow-lg">
                                    Sign In
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex justify-center py-12 bg-[#0a0a0a] rounded-2xl border border-white/5"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>
                        ) : latestBooking ? (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
                                {/* Header */}
                                <div className="p-4 sm:p-5 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Bot size={16} className="text-primary sm:w-[18px] sm:h-[18px]"/>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-xs sm:text-sm text-white truncate">Smart Assistant</h3>
                                        <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">Detected your most recent booking</p>
                                    </div>
                                </div>

                                {/* Booking Card */}
                                <div className="p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white/[0.02] border border-white/5 p-3 sm:p-4 rounded-xl mb-4">
                                        <div className="flex gap-3 sm:gap-4 flex-1">
                                            <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-gray-800 overflow-hidden shrink-0 shadow-lg border border-white/5">
                                                {latestBooking.show?.movie?.poster_path && (
                                                    <img src={getImageUrl(latestBooking.show.movie.poster_path)} className="w-full h-full object-cover" alt="" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h3 className="font-black text-sm sm:text-base text-white leading-tight truncate">{latestBooking.show?.movie?.title}</h3>
                                                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-1.5 flex items-center gap-1.5 truncate">
                                                    <MapPin size={12} className="shrink-0"/> <span className="truncate">{latestBooking.show?.theater?.name}</span>
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 truncate">
                                                    <Clock size={12} className="shrink-0"/> {new Date(latestBooking.show?.showDateTime).toLocaleDateString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Status badges row for mobile */}
                                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 mt-1 sm:mt-0 pt-2 sm:pt-0 border-t border-gray-800 sm:border-0">
                                            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-md sm:rounded-full whitespace-nowrap ${
                                                latestBooking.status === 'CANCELLED' 
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {latestBooking.status || 'CONFIRMED'}
                                            </span>
                                            <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0.5 text-right">
                                                <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-400">₹{latestBooking.amount}</span>
                                                <span className="text-[9px] sm:text-[10px] text-gray-600">{latestBooking.bookedSeats?.length} seat(s)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Help Buttons */}
                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 font-medium">Need help with this booking?</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => navigate('/my-bookings')} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-white/5 transition-all text-[11px] sm:text-xs text-left flex items-center gap-2 group"
                                        >
                                            <XCircle size={14} className="text-red-400 shrink-0"/>
                                            <span className="flex-1 truncate">Cancel & Refund</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors shrink-0"/>
                                        </button>
                                        <button 
                                            onClick={() => handleCreateTicket('E-Ticket Not Received', latestBooking._id)} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-white/5 transition-all text-[11px] sm:text-xs text-left flex items-center gap-2 group"
                                        >
                                            <Mail size={14} className="text-blue-400 shrink-0"/>
                                            <span className="flex-1 truncate">No E-Ticket</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors shrink-0"/>
                                        </button>
                                        <button 
                                            onClick={() => handleCreateTicket('Payment Issue', latestBooking._id)} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-white/5 transition-all text-[11px] sm:text-xs text-left flex items-center gap-2 group"
                                        >
                                            <CreditCard size={14} className="text-emerald-400 shrink-0"/>
                                            <span className="flex-1 truncate">Payment Issues</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors shrink-0"/>
                                        </button>
                                        <button 
                                            onClick={() => handleCreateTicket('Other Issue', latestBooking._id)} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-white/5 transition-all text-[11px] sm:text-xs text-left flex items-center gap-2 group"
                                        >
                                            <HelpCircle size={14} className="text-amber-400 shrink-0"/>
                                            <span className="flex-1 truncate">Something else</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors shrink-0"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8 text-center shadow-lg">
                                <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-3">
                                    <Bot size={24} className="text-primary"/>
                                </div>
                                <h3 className="font-bold text-white mb-2">Smart Assistant</h3>
                                <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto">No recent bookings found on your account. Use the categories above to describe your issue, or start a live chat.</p>
                            </div>
                        )}

                        {/* FAQ Accordion */}
                        <div>
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
                                <HelpCircle size={14}/> Frequently Asked
                            </h3>
                            <div className="space-y-2">
                                {faqs.map((faq, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`bg-[#0a0a0a] border rounded-xl overflow-hidden transition-all duration-300 ${openFaq === idx ? 'border-primary/30 shadow-[0_0_15px_rgba(248,69,101,0.05)]' : 'border-white/5 hover:border-white/10'}`}
                                    >
                                        <button 
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full p-3.5 sm:p-4 text-left flex justify-between items-center"
                                        >
                                            <span className="font-bold text-xs sm:text-sm pr-4 text-gray-300 leading-snug">{faq.q}</span>
                                            <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                                        </button>
                                        <div className={`px-4 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-48 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{faq.a}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Past Tickets + Contact */}
                    <div className="space-y-5 sm:space-y-6 mt-2 lg:mt-0">

                        {/* Start Live Chat Card */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl">
                            <h3 className="font-bold text-sm sm:text-base text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <LifeBuoy size={16} className="text-primary"/> Need a human?
                            </h3>
                            <div className="space-y-2 sm:space-y-2.5">
                                <button 
                                    onClick={() => handleCreateTicket('Live Chat Request')} 
                                    className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg"
                                >
                                    <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]"/> Start Live Chat
                                </button>
                                <a 
                                    href="mailto:EventXpress@support.in" 
                                    className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    <Mail size={14} className="text-gray-400 sm:w-[16px] sm:h-[16px]"/> EventXpress@support.in
                                </a>
                                <div className="grid grid-cols-2 gap-2">
                                    <a href="tel:7878787565" className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px]">
                                        <Phone size={12} className="text-gray-400"/> 7878787565
                                    </a>
                                    <a href="tel:931090108" className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px]">
                                        <Phone size={12} className="text-gray-400"/> 931090108
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Support Hours */}
                        <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/10 rounded-2xl p-4 sm:p-5 text-center">
                            <Clock size={16} className="text-primary mx-auto mb-2"/>
                            <p className="text-[11px] sm:text-xs font-bold text-white mb-1">Support Hours</p>
                            <p className="text-[10px] sm:text-[11px] text-gray-500">Mon-Sun: 9 AM — 12 AM IST</p>
                            <p className="text-[10px] sm:text-[11px] text-gray-500">AI Assistant: 24/7</p>
                        </div>

                        {/* Existing Conversations */}
                        {myTickets.length > 0 && (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[350px] lg:max-h-[400px]">
                                <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <MessageSquare size={12} className="sm:w-[14px] sm:h-[14px]"/> Active Logs
                                    </h3>
                                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{myTickets.length}</span>
                                </div>
                                <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar flex-1">
                                    {myTickets.map(ticket => {
                                        const cfg = getStatusConfig(ticket.status);
                                        return (
                                            <div 
                                                key={ticket._id} 
                                                onClick={() => setActiveTicket(ticket)}
                                                className="p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03] border border-transparent hover:border-white/5 group"
                                            >
                                                <div className="flex items-center justify-between mb-1 gap-2">
                                                    <p className="font-bold text-xs text-white truncate flex-1">{ticket.subject}</p>
                                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${cfg.dot}`}></div>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[9px] sm:text-[10px] text-gray-500 truncate flex-1">
                                                        {ticket.messages?.[ticket.messages.length - 1]?.text || ''}
                                                    </p>
                                                    <span className="text-[8px] sm:text-[9px] text-gray-600 shrink-0 font-mono">{timeAgo(ticket.updatedAt)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;