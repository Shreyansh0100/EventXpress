import React, { useState, useEffect, useRef } from 'react';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Search, MessageSquare, Clock, CheckCircle2, User, 
    Send, AlertCircle, ShieldCheck, Inbox, ChevronRight,
    Film, MapPin, Calendar, CreditCard, XCircle, Coins, 
    Award, Mail, Shield, Ban, Eye, ArrowLeft, Ticket,
    BarChart3, Hash
} from 'lucide-react';

const SupportAdmin = () => {
    const { axios, getToken, user } = useAppContext();
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    // User intel panel
    const [showUserPanel, setShowUserPanel] = useState(false);
    const [userBookings, setUserBookings] = useState([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);

    const chatEndRef = useRef(null);

    // 1. Fetch All Tickets
    const fetchTickets = async () => {
        try {
            const { data } = await axios.get('/api/admin/tickets', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setTickets(data.tickets);
                if (selectedTicket) {
                    const updatedSelected = data.tickets.find(t => t._id === selectedTicket._id);
                    if (updatedSelected) setSelectedTicket(updatedSelected);
                }
            }
        } catch (error) {
            toast.error("Failed to load support tickets.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchTickets(); }, [user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    // 2. Fetch user bookings when panel opens
    const fetchUserBookings = async (userId) => {
        setIsLoadingBookings(true);
        try {
            const { data } = await axios.get(`/api/admin/tickets/user-bookings?userId=${userId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setUserBookings(data.bookings);
            }
        } catch (error) {
            toast.error("Failed to load user bookings.");
        } finally {
            setIsLoadingBookings(false);
        }
    };

    const openUserPanel = () => {
        if (!selectedTicket?.user) return toast.error("No user data available for this ticket.");
        const userId = typeof selectedTicket.user === 'string' ? selectedTicket.user : selectedTicket.user._id;
        setShowUserPanel(true);
        fetchUserBookings(userId);
    };

    // 3. Handle Reply & Status Change
    const handleReply = async (e, forceStatus = null) => {
        e?.preventDefault();
        if (!forceStatus && !replyText.trim()) return;

        setIsReplying(true);
        try {
            const payload = {
                ticketId: selectedTicket._id,
                text: replyText.trim() || (forceStatus === 'Resolved' ? "Ticket closed by Admin." : "Status updated by Admin."),
                status: forceStatus || undefined
            };

            const { data } = await axios.post('/api/admin/tickets/reply', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                toast.success(forceStatus === 'Resolved' ? "Ticket Closed!" : "Reply Sent!");
                setReplyText('');
                fetchTickets();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to send reply.");
        } finally {
            setIsReplying(false);
        }
    };

    // --- FILTERS ---
    const filteredTickets = tickets.filter(t => {
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        const userName = typeof t.user === 'object' ? t.user?.name || '' : '';
        const userEmail = typeof t.user === 'object' ? t.user?.email || '' : '';
        const matchesSearch = t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t._id.includes(searchQuery) ||
                              userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const openCount = tickets.filter(t => t.status === 'Open').length;
    const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

    // --- UI HELPERS ---
    const getStatusConfig = (status) => {
        if (status === 'Resolved') return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 size={12}/>, dot: 'bg-emerald-500' };
        if (status === 'In Progress') return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock size={12}/>, dot: 'bg-amber-500' };
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <AlertCircle size={12}/>, dot: 'bg-rose-500 animate-pulse' };
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
        return `${days}d ago`;
    };

    const ticketUser = selectedTicket?.user && typeof selectedTicket.user === 'object' ? selectedTicket.user : null;

    return !isLoading ? (
        <div className="pb-20 min-h-[calc(100vh-100px)] font-outfit text-white flex flex-col">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <Title text1="Support" text2="Command Center" />
                    <p className="text-gray-400 text-sm mt-1">Resolve issues, view user context, and manage inquiries.</p>
                </div>
                {/* Stats Pills */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-rose-400">{openCount} Open</span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold text-amber-400">{inProgressCount} In Progress</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-bold text-emerald-400">{resolvedCount} Resolved</span>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 h-[720px]">
                
                {/* ═══════════════════════════════════════════════
                    LEFT: TICKET INBOX 
                ═══════════════════════════════════════════════ */}
                <div className="lg:col-span-4 bg-[#0e0e10] border border-white/5 rounded-2xl flex flex-col overflow-hidden relative">
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500"></div>
                    
                    {/* Inbox Controls */}
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="relative w-full group mb-3">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                            <input 
                                type="text" 
                                placeholder="Search tickets, users..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/50 border border-white/5 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-all text-sm placeholder-gray-600"
                            />
                        </div>
                        <div className="flex gap-1.5">
                            {[
                                { label: 'All', value: 'ALL', count: tickets.length },
                                { label: 'Open', value: 'Open', count: openCount },
                                { label: 'Active', value: 'In Progress', count: inProgressCount },
                                { label: 'Done', value: 'Resolved', count: resolvedCount }
                            ].map(f => (
                                <button 
                                    key={f.value}
                                    onClick={() => setFilterStatus(f.value)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                                        filterStatus === f.value 
                                            ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(248,69,101,0.3)]' 
                                            : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300'
                                    }`}
                                >
                                    {f.label}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterStatus === f.value ? 'bg-white/20' : 'bg-white/5'}`}>{f.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                        {filteredTickets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 p-6 text-center">
                                <Inbox size={48} className="mb-4 opacity-10"/>
                                <p className="text-sm font-bold text-gray-400">No tickets found</p>
                                <p className="text-xs mt-1 text-gray-600">Inbox zero achieved! 🎉</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => {
                                const config = getStatusConfig(ticket.status);
                                const tUser = typeof ticket.user === 'object' ? ticket.user : null;
                                return (
                                    <div 
                                        key={ticket._id}
                                        onClick={() => { setSelectedTicket(ticket); setShowUserPanel(false); }}
                                        className={`p-3.5 rounded-xl cursor-pointer transition-all border group ${
                                            selectedTicket?._id === ticket._id 
                                                ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(248,69,101,0.08)]' 
                                                : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                                                {tUser?.image ? (
                                                    <img src={tUser.image} alt="" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <User size={14} className="text-gray-500"/>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-gray-300 truncate">
                                                        {tUser?.name || 'Unknown User'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-600 font-mono shrink-0 ml-2">
                                                        {timeAgo(ticket.updatedAt || ticket.createdAt)}
                                                    </span>
                                                </div>
                                                <h4 className="text-[13px] font-bold text-white line-clamp-1 mb-1.5">{ticket.subject}</h4>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-gray-500 line-clamp-1 flex-1 mr-2">
                                                        {ticket.messages?.[ticket.messages.length - 1]?.text || "No messages yet."}
                                                    </p>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${config.color}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
                                                        {ticket.status === 'In Progress' ? 'Active' : ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    RIGHT: CHAT + CONTEXT PANEL
                ═══════════════════════════════════════════════ */}
                <div className="lg:col-span-8 bg-[#0e0e10] border border-white/5 rounded-2xl flex flex-col overflow-hidden relative">
                    {!selectedTicket ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-black/30">
                            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                                <MessageSquare size={32} className="opacity-20"/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-400">Select a Ticket</h3>
                            <p className="text-sm mt-2 text-gray-600 max-w-xs text-center">Choose a conversation from the inbox to view details, user info, and reply.</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 overflow-hidden">
                            {/* Chat Column */}
                            <div className={`flex flex-col flex-1 ${showUserPanel ? 'hidden lg:flex' : 'flex'}`}>
                                {/* Chat Header */}
                                <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-3 z-10">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Mobile: back button */}
                                        <button onClick={() => { setSelectedTicket(null); setShowUserPanel(false); }} className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white">
                                            <ArrowLeft size={16}/>
                                        </button>

                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden">
                                            {ticketUser?.image ? (
                                                <img src={ticketUser.image} alt="" className="w-full h-full object-cover"/>
                                            ) : (
                                                <User size={18}/>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-sm font-bold text-white leading-tight truncate">{selectedTicket.subject}</h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-500">{ticketUser?.name || 'Unknown'}</span>
                                                <span className="text-[10px] text-gray-700">•</span>
                                                <span className="text-[10px] text-gray-600 font-mono">#{selectedTicket._id.slice(-6)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* View User Button */}
                                        <button 
                                            onClick={openUserPanel}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                showUserPanel 
                                                    ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:border-blue-500/30 hover:text-blue-400'
                                            }`}
                                        >
                                            <Eye size={13}/> Intel
                                        </button>

                                        {selectedTicket.status !== 'Resolved' && (
                                            <button 
                                                onClick={(e) => handleReply(e, 'Resolved')}
                                                disabled={isReplying}
                                                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <ShieldCheck size={13}/> Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Related Booking Banner */}
                                {selectedTicket.relatedBooking && selectedTicket.relatedBooking.show && (
                                    <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-xl flex items-center gap-3">
                                        <div className="w-10 h-14 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                            {selectedTicket.relatedBooking.show?.movie?.poster_path && (
                                                <img src={selectedTicket.relatedBooking.show.movie.poster_path} alt="" className="w-full h-full object-cover"/>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Linked Booking</p>
                                            <p className="text-xs font-bold text-white truncate">{selectedTicket.relatedBooking.show?.movie?.title || 'Movie'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-500">{selectedTicket.relatedBooking.show?.theater?.name}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                                    selectedTicket.relatedBooking.status === 'CANCELLED' 
                                                        ? 'bg-red-500/10 text-red-400' 
                                                        : 'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                    {selectedTicket.relatedBooking.status}
                                                </span>
                                                <span className="text-[10px] text-gray-600">₹{selectedTicket.relatedBooking.amount}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Chat Messages Body */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {/* Ticket opened timestamp */}
                                    <div className="flex items-center justify-center gap-3 my-3">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        <span className="text-[9px] text-gray-600 font-mono bg-[#0e0e10] px-3">
                                            Ticket opened {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </div>

                                    {selectedTicket.messages?.map((msg, idx) => {
                                        const isAgent = msg.sender === 'Agent';
                                        const isAI = msg.sender === 'AI';
                                        return (
                                            <div key={idx} className={`flex w-full ${isAgent || isAI ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl p-4 ${
                                                    isAgent 
                                                        ? 'bg-blue-600/90 text-white rounded-br-sm shadow-[0_4px_20px_rgba(37,99,235,0.15)]' 
                                                        : isAI
                                                            ? 'bg-purple-600/80 text-white rounded-br-sm shadow-[0_4px_20px_rgba(168,85,247,0.15)]'
                                                            : 'bg-white/[0.04] text-gray-200 rounded-bl-sm border border-white/5'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-1.5 gap-4">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                            isAgent ? 'text-blue-200' : isAI ? 'text-purple-200' : 'text-gray-500'
                                                        }`}>
                                                            {isAgent ? '⚡ Support Agent' : isAI ? '🤖 AI Assistant' : `👤 ${ticketUser?.name || 'Customer'}`}
                                                        </span>
                                                        {msg.createdAt && (
                                                            <span className={`text-[9px] ${isAgent ? 'text-blue-300/60' : isAI ? 'text-purple-300/60' : 'text-gray-600'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input Footer */}
                                {selectedTicket.status !== 'Resolved' ? (
                                    <div className="p-3 bg-white/[0.02] border-t border-white/5">
                                        <form onSubmit={handleReply} className="flex items-end gap-2">
                                            <textarea 
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your reply..."
                                                rows={2}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-blue-500/30 transition-colors custom-scrollbar placeholder-gray-600"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(e);
                                                }}
                                            />
                                            <button 
                                                type="submit"
                                                disabled={isReplying || !replyText.trim()}
                                                className="h-11 px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:shadow-none"
                                            >
                                                {isReplying ? <Clock size={14} className="animate-spin"/> : <Send size={14}/>}
                                            </button>
                                        </form>
                                        <p className="text-[9px] text-gray-600 text-center mt-1.5">
                                            <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Ctrl</kbd> + <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Enter</kbd> to send
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center justify-center gap-3 text-center">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0"/>
                                        <div>
                                            <span className="text-xs text-emerald-400 font-bold">Resolved</span>
                                            <span className="text-xs text-gray-600 ml-2">User replies will reopen the ticket automatically.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ═══════════════════════════════════════════════
                                USER INTEL PANEL (Right Sidebar)
                            ═══════════════════════════════════════════════ */}
                            {showUserPanel && (
                                <div className="w-full lg:w-[380px] border-l border-white/5 bg-black/30 flex flex-col overflow-hidden">
                                    {/* Panel Header */}
                                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <BarChart3 size={13}/> User Intelligence
                                        </h3>
                                        <button onClick={() => setShowUserPanel(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                            <XCircle size={16}/>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                                        {/* User Profile Card */}
                                        {ticketUser && (
                                            <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-5 text-center">
                                                <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white/10 mx-auto mb-3 overflow-hidden shadow-lg">
                                                    {ticketUser.image ? (
                                                        <img src={ticketUser.image} alt="" className="w-full h-full object-cover"/>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User size={24} className="text-gray-500"/>
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="text-base font-bold text-white">{ticketUser.name}</h4>
                                                <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1 mt-1">
                                                    <Mail size={10}/> {ticketUser.email}
                                                </p>

                                                {/* Status Badges */}
                                                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                                        ticketUser.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        ticketUser.role === 'cinema' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                        <Shield size={8} className="inline mr-1"/> {ticketUser.role}
                                                    </span>
                                                    {ticketUser.isBanned && (
                                                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                                            <Ban size={8} className="inline mr-1"/> Banned
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="grid grid-cols-3 gap-2 mt-4">
                                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                                                        <Coins size={14} className="text-yellow-500 mx-auto mb-1"/>
                                                        <p className="text-sm font-bold text-white">{ticketUser.coins || 0}</p>
                                                        <p className="text-[9px] text-gray-500">Coins</p>
                                                    </div>
                                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                                                        <Award size={14} className="text-blue-400 mx-auto mb-1"/>
                                                        <p className="text-sm font-bold text-white">{ticketUser.loyaltyPoints || 0}</p>
                                                        <p className="text-[9px] text-gray-500">Loyalty</p>
                                                    </div>
                                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
                                                        <Ticket size={14} className="text-primary mx-auto mb-1"/>
                                                        <p className="text-sm font-bold text-white">{userBookings.length}</p>
                                                        <p className="text-[9px] text-gray-500">Bookings</p>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-gray-600 mt-3">
                                                    Member since {new Date(ticketUser.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}
                                                </p>
                                            </div>
                                        )}

                                        {/* Booking History */}
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                                                <Film size={11}/> Booking History
                                            </h4>

                                            {isLoadingBookings ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            ) : userBookings.length === 0 ? (
                                                <div className="text-center py-6 text-gray-600">
                                                    <Film size={20} className="mx-auto mb-2 opacity-30"/>
                                                    <p className="text-xs">No bookings found</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {userBookings.map((booking, idx) => {
                                                        const isCancelled = booking.status === 'CANCELLED';
                                                        return (
                                                            <div key={booking._id || idx} className={`p-3 rounded-xl border transition-all ${
                                                                isCancelled 
                                                                    ? 'bg-red-500/[0.03] border-red-500/10' 
                                                                    : 'bg-white/[0.02] border-white/5'
                                                            }`}>
                                                                <div className="flex items-start gap-3">
                                                                    {/* Movie poster */}
                                                                    <div className="w-9 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                                                        {booking.show?.movie?.poster_path ? (
                                                                            <img src={booking.show.movie.poster_path} alt="" className="w-full h-full object-cover"/>
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <Film size={12} className="text-gray-600"/>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-0.5">
                                                                            <p className="text-xs font-bold text-white truncate">{booking.show?.movie?.title || 'Unknown Movie'}</p>
                                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                                                                                isCancelled 
                                                                                    ? 'bg-red-500/10 text-red-400' 
                                                                                    : 'bg-emerald-500/10 text-emerald-400'
                                                                            }`}>
                                                                                {isCancelled ? '✕ Cancelled' : '✓ Confirmed'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                                                            <span className="flex items-center gap-0.5"><MapPin size={8}/> {booking.show?.theater?.name || '—'}</span>
                                                                            <span>•</span>
                                                                            <span>{booking.show?.theater?.city || ''}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1.5">
                                                                            <span className="flex items-center gap-0.5">
                                                                                <Calendar size={8}/> {booking.show?.showDateTime ? new Date(booking.show.showDateTime).toLocaleDateString('en-IN', {month:'short', day:'numeric'}) : '—'}
                                                                            </span>
                                                                            <span className="flex items-center gap-0.5">
                                                                                <CreditCard size={8}/> ₹{booking.amount}
                                                                            </span>
                                                                            <span className="flex items-center gap-0.5">
                                                                                <Hash size={8}/> {booking.bookedSeats?.length || 0} seat{booking.bookedSeats?.length !== 1 ? 's' : ''}
                                                                            </span>
                                                                        </div>

                                                                        {/* Seats & payment */}
                                                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                                            {booking.bookedSeats?.slice(0, 6).map((seat, si) => (
                                                                                <span key={si} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400 font-mono">{seat}</span>
                                                                            ))}
                                                                            {booking.bookedSeats?.length > 6 && (
                                                                                <span className="text-[9px] text-gray-600">+{booking.bookedSeats.length - 6} more</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    ) : <Loading />;
};

export default SupportAdmin;