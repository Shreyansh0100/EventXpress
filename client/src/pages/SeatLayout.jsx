import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { AlertCircle, ArrowRight, ScreenShare, Ticket, Crown, Zap, Lock } from 'lucide-react'; 
import Loading from '../components/Loading';

import { io } from 'socket.io-client';

// --- LOGICAL FIX: Default Layout Fallback ---
const DEFAULT_LAYOUT = [
    { tier: 'PLAZA', priceKey: 'plaza', rows: ['A', 'B', 'C'], cols: 10 },
    { tier: 'PREMIUM', priceKey: 'premium', rows: ['D', 'E', 'F', 'G'], cols: 10 },
    { tier: 'ROYAL', priceKey: 'royal', rows: ['H', 'I', 'J'], cols: 10 }
];

const SeatLayout = () => {
    const { showId } = useParams();
    const { state } = useLocation(); 
    const navigate = useNavigate();
    const { axios, user, backendUrl } = useAppContext();

    // Initialize socket using the same backendUrl from context (env-aware)
    const socketRef = useRef(null);
    if (!socketRef.current) {
        socketRef.current = io(backendUrl);
    }
    const socket = socketRef.current;

    const show = state?.show;

    const [occupiedSeats, setOccupiedSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [lockedSeatsMap, setLockedSeatsMap] = useState({}); 
    const [isSurgeActive, setIsSurgeActive] = useState(false);
    const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);

    // 🚨 FALLBACK STATE TO CATCH MISSING IDs
    const [fallbackTheaterId, setFallbackTheaterId] = useState(null);

    const selectedSeatsRef = useRef([]);
    const isProceedingRef = useRef(false);

    useEffect(() => {
        selectedSeatsRef.current = selectedSeats;
    }, [selectedSeats]);

    // 1. Fetch live permanently booked seats from DB
    useEffect(() => {
        if (!show) {
            toast.error("Please select a valid showtime first.");
            navigate(-1); 
            return;
        }

        const fetchSeats = async () => {
            try {
                const { data } = await axios.get(`/api/bookings/occupied/${showId}`);
                if (data.success) {
                    setOccupiedSeats(data.occupiedSeats || []);
                    setIsSurgeActive(data.isSurgeActive);
                    setSurgeMultiplier(data.surgeMultiplier);
                    
                    // 🚨 CATCH THE ID FROM THE BACKEND HERE
                    if (data.theaterId) {
                        setFallbackTheaterId(data.theaterId);
                    }
                }
            } catch (error) {
                toast.error("Failed to load live seating.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeats();
        const interval = setInterval(fetchSeats, 10000);
        return () => clearInterval(interval);
    }, [show, showId, axios, navigate]);

    // 2. WebSocket Sync, Cleanup, & HEARTBEAT
    useEffect(() => {
        if (!showId) return;

        socket.emit('join_show', showId);

        socket.on('sync_locked_seats', (data) => {
            setLockedSeatsMap(data);
        });

        socket.on('seat_updated', (data) => {
            setLockedSeatsMap(data);
        });

        const heartbeatInterval = setInterval(() => {
            if (selectedSeatsRef.current.length > 0) {
                socket.emit('heartbeat', { showId, activeSeats: selectedSeatsRef.current });
            }
        }, 10000);

        return () => {
            clearInterval(heartbeatInterval);
            socket.off('sync_locked_seats');
            socket.off('seat_updated');

            if (!isProceedingRef.current && selectedSeatsRef.current.length > 0) {
                selectedSeatsRef.current.forEach(seatId => {
                    socket.emit('lock_seat', { showId, seatId, action: 'unlock' });
                });
            }
        };
    }, [showId]);


    if (!show || isLoading) return <Loading />;

    const layoutConfig = show.seatingConfig || show.theater?.seatingConfig || DEFAULT_LAYOUT;

    const getSeatConfig = (seatId) => {
        const rowLetter = seatId.charAt(0).toUpperCase();
        return layoutConfig.find(section => section.rows.includes(rowLetter));
    };

    const getSeatPrice = (seatId) => {
        const config = getSeatConfig(seatId);
        if (!config) return 0;
        const basePrice = show.ticketPrice[config.priceKey];
        return Math.round(basePrice * surgeMultiplier); 
    };

    const getTierIcon = (tier) => {
        switch(tier) {
            case 'PLAZA': return <Ticket size={14} className="sm:w-4 sm:h-4"/>;
            case 'PREMIUM': return <Crown size={14} className="sm:w-4 sm:h-4"/>;
            case 'ROYAL': return <Zap size={14} className="sm:w-4 sm:h-4"/>;
            default: return <Ticket size={14} className="sm:w-4 sm:h-4"/>;
        }
    };

    const getTierColor = (tier) => {
        switch(tier) {
            case 'PLAZA': return 'from-blue-500/20 to-blue-600/10 border-blue-500/20';
            case 'PREMIUM': return 'from-purple-500/20 to-purple-600/10 border-purple-500/20';
            case 'ROYAL': return 'from-yellow-500/20 to-amber-600/10 border-amber-500/20';
            default: return 'from-gray-500/20 to-gray-600/10 border-gray-500/20';
        }
    };

    const handleSeatClick = (seatId) => {
        if (occupiedSeats.includes(seatId)) return;

        // Check if locked by someone else
        if (lockedSeatsMap[seatId] && lockedSeatsMap[seatId].socketId !== socket.id) {
            toast.error("Another user is currently booking this seat!");
            return;
        }

        setSelectedSeats(prev => {
            if (prev.includes(seatId)) {
                socket.emit('lock_seat', { showId, seatId, action: 'unlock' });
                return prev.filter(id => id !== seatId); 
            } else {
                if (prev.length >= 10) {
                    toast.error("You can only book up to 10 seats at a time.");
                    return prev;
                }
                socket.emit('lock_seat', { showId, seatId, action: 'lock' });
                return [...prev, seatId]; 
            }
        });
    };

    const subtotal = selectedSeats.reduce((sum, seatId) => sum + getSeatPrice(seatId), 0);

    const handleProceed = () => {
        if (!user) {
            toast.error("Please log in to continue");
            return;
        }
        if (selectedSeats.length === 0) return toast.error("Please select at least 1 seat");

        isProceedingRef.current = true; 

        // 🚨 BULLETPROOF EXTRACTION: Use fallback if everything else fails
        const theaterId = show?.theaterId || show?.theater?._id || show?.theater?.id || fallbackTheaterId || (typeof show?.theater === 'string' ? show.theater : null);

        if (!theaterId) {
            toast.error("Theater information is missing. Please restart booking.");
            return navigate('/');
        }

        const normalizedShow = {
            ...show,
            theaterId: theaterId,
            theater: typeof show.theater === 'object' ? show.theater : { _id: theaterId, name: show.theaterName || "Cinema" }
        };

        navigate('/checkout', { 
            state: { 
                show: normalizedShow, 
                selectedSeats, 
                isSurgeActive, 
                surgeMultiplier 
            } 
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-outfit overflow-x-hidden">
            <div className="max-w-6xl mx-auto pt-20 sm:pt-28 pb-40 sm:pb-48 px-4 flex flex-col">
                
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-12 animate-fadeIn">
                    <div className="inline-block mb-3 sm:mb-4">
                        <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">Premium Experience</p>
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4 text-white drop-shadow-lg leading-tight px-2">
                        {show.movie.title}
                    </h1>
                    <p className="text-gray-300 text-sm sm:text-lg mb-2 sm:mb-3 font-medium">
                        {show.theater?.name || show.theaterName || "Cinema"}
                    </p>
                    <p className="text-gray-400 mb-4 text-xs sm:text-base">
                        {new Date(show.showDateTime).toLocaleString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                        })}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-full text-xs sm:text-sm font-medium hover:border-gray-600 transition-all">
                            {show.language}
                        </span>
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-full text-xs sm:text-sm font-medium hover:border-gray-600 transition-all">
                            {show.format}
                        </span>
                    </div>
                </div>

                {/* Surge Pricing Alert */}
                {isSurgeActive && (
                    <div className="max-w-3xl mx-auto w-full mb-8 sm:mb-12 animate-fadeIn px-2 sm:px-0">
                        <div className="bg-gradient-to-r from-red-600/20 via-red-500/10 to-red-600/20 border border-red-500/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] backdrop-blur-sm">
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="mt-0.5 sm:mt-1 p-1.5 sm:p-2 bg-red-500/20 rounded-lg shrink-0">
                                    <Zap className="text-red-400 animate-pulse sm:w-5 sm:h-5 w-4 h-4"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-red-300 font-bold text-base sm:text-lg mb-1 truncate">Seats Filling Fast!</h4>
                                    <p className="text-red-200/70 text-xs sm:text-sm leading-relaxed">
                                        This show is highly booked. Dynamic surge pricing (+{Math.round((surgeMultiplier - 1) * 100)}%) is active on all remaining seats.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cinema Screen */}
                <div className="max-w-4xl mx-auto w-full mb-10 sm:mb-16 relative mt-2 sm:mt-4 animate-slideDown">
                    <div className="absolute -inset-8 sm:-inset-12 bg-gradient-to-b from-blue-600/10 to-transparent rounded-full blur-2xl sm:blur-3xl pointer-events-none"></div>
                    <div className="relative px-4 sm:px-0">
                        <div className="h-10 sm:h-16 w-full bg-gradient-to-b from-blue-500/30 to-blue-500/5 rounded-t-[100px] sm:rounded-t-[150px] border-t-2 border-blue-400/50 shadow-[0_-20px_40px_rgba(59,130,246,0.2)] sm:shadow-[0_-30px_60px_rgba(59,130,246,0.25)] backdrop-blur-sm"></div>
                        <p className="text-center text-[10px] sm:text-xs text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.35em] font-bold mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3 mb-2">
                            <ScreenShare size={14} className="sm:w-4 sm:h-4 text-blue-400"/>
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">Screen This Way</span>
                            <ScreenShare size={14} className="sm:w-4 sm:h-4 text-blue-400"/>
                        </p>
                    </div>
                </div>

                {/* Dynamic Seat Grid Container */}
                <div className="flex-1 flex flex-col items-center justify-center mb-8 sm:mb-12 overflow-x-auto pb-6 custom-scrollbar animate-fadeIn w-full px-2 sm:px-4">
                    <div className="flex flex-col gap-6 sm:gap-10 w-max mx-auto px-2">
                        
                        {layoutConfig.map((section) => {
                            const dynamicCols = Array.from({ length: section.cols }, (_, i) => i + 1);
                            const split1 = Math.floor(section.cols * 0.3);
                            const split2 = Math.floor(section.cols * 0.7);

                            return (
                                <div key={section.tier} className={`bg-gradient-to-br ${getTierColor(section.tier)} border rounded-2xl p-4 sm:p-6 backdrop-blur-sm transition-all hover:shadow-lg min-w-min`}>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-700/50 gap-2 sm:gap-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-400">{getTierIcon(section.tier)}</span>
                                            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-gray-200">{section.tier}</span>
                                        </div>
                                        <div className="text-left sm:text-right flex sm:block items-end gap-2 sm:gap-0">
                                            <p className="text-lg sm:text-2xl font-black font-mono text-white">₹{Math.round(show.ticketPrice[section.priceKey] * surgeMultiplier)}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-400 sm:mt-0.5 mb-1 sm:mb-0">per seat</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3 sm:gap-4">
                                        {section.rows.map(row => (
                                            <div key={row} className="flex items-center gap-2 sm:gap-6 group">
                                                <span className="w-4 sm:w-6 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider select-none group-hover:text-gray-400 transition-colors text-center">{row}</span>
                                                
                                                <div className="flex gap-2 sm:gap-3">
                                                    {[ [0, split1], [split1, split2], [split2, section.cols] ].map(([start, end], blockIdx) => (
                                                        <div key={blockIdx} className="flex gap-1.5 sm:gap-2">
                                                            {dynamicCols.slice(start, end).map(col => {
                                                                const seatId = `${row}${col}`;
                                                                
                                                                const isPermanentlyOccupied = occupiedSeats.includes(seatId);
                                                                const isTemporarilyLocked = lockedSeatsMap[seatId] && lockedSeatsMap[seatId].socketId !== socket.id;
                                                                const isSelected = selectedSeats.includes(seatId);
                                                                
                                                                return (
                                                                    <button 
                                                                        key={seatId}
                                                                        disabled={isPermanentlyOccupied || isTemporarilyLocked}
                                                                        onClick={() => handleSeatClick(seatId)}
                                                                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-bold transition-all duration-300 flex items-center justify-center backdrop-blur-sm transform shrink-0
                                                                            ${isPermanentlyOccupied 
                                                                                ? 'bg-gray-800/60 text-gray-600 cursor-not-allowed border border-gray-700/30 shadow-inner' 
                                                                                : isTemporarilyLocked
                                                                                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40 cursor-not-allowed shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                                                                : isSelected 
                                                                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110 -translate-y-1 border border-blue-400/50' 
                                                                                : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 text-gray-300 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:scale-105'
                                                                            } active:scale-95`}
                                                                        title={isPermanentlyOccupied ? 'Occupied' : isTemporarilyLocked ? 'Currently Being Booked' : isSelected ? 'Selected' : 'Available'}
                                                                    >
                                                                        {isTemporarilyLocked ? <Lock size={10} className="sm:w-3 sm:h-3 text-yellow-500 animate-pulse" /> : col}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="w-4 sm:w-6 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider text-center select-none group-hover:text-gray-400 transition-colors">{row}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 px-4 py-4 sm:py-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700/30 max-w-2xl mx-auto w-full">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded shrink-0"></div>
                        <span className="text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400/50 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0"></div>
                        <span className="text-gray-300">Selected</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500/20 border border-yellow-500/40 rounded flex items-center justify-center shrink-0">
                            <Lock size={10} className="text-yellow-500"/>
                        </div>
                        <span className="text-yellow-400 whitespace-nowrap">In Another Cart</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-800/60 border border-gray-700/30 rounded shrink-0"></div>
                        <span className="text-gray-400 whitespace-nowrap">Sold Out</span>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Bar */}
            {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-900/90 backdrop-blur-xl border-t border-gray-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-slideUp z-50">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
                            
                            <div className="w-full md:w-auto flex flex-col items-center md:items-start min-w-0">
                                <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-bold mb-1.5 sm:mb-2">
                                    {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 max-h-16 sm:max-h-24 overflow-y-auto custom-scrollbar w-full">
                                    {selectedSeats.map(seat => (
                                        <span key={seat} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/20 border border-blue-400/50 text-blue-200 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg backdrop-blur-sm cursor-default whitespace-nowrap shrink-0">
                                            {seat}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="w-full md:w-auto flex flex-row items-center justify-between md:justify-end gap-4 sm:gap-6 pt-2 md:pt-0 border-t border-gray-700/50 md:border-t-0 shrink-0">
                                <div className="text-left md:text-right md:border-r border-gray-700/50 md:pr-6 shrink-0">
                                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5 sm:mb-1">Amount Payable</p>
                                    <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">₹{subtotal}</p>
                                </div>
                                <button 
                                    onClick={handleProceed}
                                    className="flex-1 md:flex-none px-4 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-[0_10px_25px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_35px_rgba(59,130,246,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group text-sm sm:text-base whitespace-nowrap"
                                >
                                    <span>Checkout</span>
                                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SeatLayout;