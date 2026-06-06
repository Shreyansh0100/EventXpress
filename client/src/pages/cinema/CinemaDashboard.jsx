import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import { 
    Ticket, Users, Banknote, MonitorPlay, Calendar, Clock, MapPin, 
    QrCode, Activity, ArrowRight, TrendingUp, CreditCard, Globe, Film, X, User, RefreshCw 
} from 'lucide-react';
import Loading from '../../components/Loading';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CinemaDashboard = () => {
    const { axios, getToken } = useAppContext();
    const navigate = useNavigate();
    
    // State
    const [stats, setStats] = useState(null);
    const [theaterName, setTheaterName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); 
    
    const [selectedShow, setSelectedShow] = useState(null);
    const [showBookings, setShowBookings] = useState([]);
    const [isMapLoading, setIsMapLoading] = useState(false);

    // Fetch Stats Data
    const fetchTheaterStats = useCallback(async (isSilent = false) => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/box-office/dashboard-stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setStats(data.stats);
                setTheaterName(data.theaterName);
            }
        } catch (error) {
            console.error("Failed to load theater stats:", error);
            if (!isSilent) toast.error("Failed to load dashboard data.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [axios, getToken]);

    // Initial load and polling
    useEffect(() => {
        fetchTheaterStats(false);
        const interval = setInterval(() => fetchTheaterStats(true), 10000); 
        return () => clearInterval(interval);
    }, [fetchTheaterStats]);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        fetchTheaterStats(true); 
    };

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setSelectedShow(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Fetch Manifest for Seat Map
    const openSeatMap = async (show) => {
        setSelectedShow(show);
        setIsMapLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/box-office/manifest", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                const specificBookings = data.bookings.filter(b => b.show?._id === show.id);
                setShowBookings(specificBookings);
            } else {
                toast.error("Failed to load seat data.");
            }
        } catch (error) {
            toast.error("Network error while loading seat map.");
        } finally {
            setIsMapLoading(false);
        }
    };

    const seatMapDict = useMemo(() => {
        const dict = {};
        showBookings.forEach(booking => {
            const guest = booking.guestName || booking.user?.name || "Walk-in Guest";
            booking.bookedSeats?.forEach(seat => {
                dict[seat] = {
                    guest,
                    method: booking.paymentMethod,
                    id: booking._id,
                    time: booking.createdAt
                };
            });
        });
        return dict;
    }, [showBookings]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading) return <Loading />;

    return (
        <div className="pb-20 pt-6 px-4 sm:px-6 lg:px-8 font-outfit text-white animate-fadeIn relative max-w-[1600px] mx-auto">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/4 w-[50%] h-[500px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-[40%] h-[400px] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

            <div className="relative z-10 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 bg-[#060606]/80 p-6 md:p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                    <div className="w-full md:w-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.25em]">System Live</p>
                            
                            <button 
                                onClick={handleManualRefresh} 
                                className="ml-auto md:ml-3 p-1.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 transition-all group shadow-sm flex items-center justify-center"
                                title="Refresh Data"
                            >
                                <RefreshCw size={12} className={`text-gray-400 group-hover:text-white ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
                            </button>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Cinema Dashboard</h2>
                        <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner break-words max-w-full">
                            <MapPin size={16} className="text-orange-500 shrink-0" /> <span className="truncate">{theaterName || 'Local View'}</span>
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button onClick={() => navigate('/cinema/scan')} className="w-full sm:w-auto bg-[#121212] hover:bg-[#1a1a1a] text-gray-300 px-6 py-3.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-sm border border-white/5 hover:border-white/10 hover:text-white shadow-lg">
                            <QrCode size={18} className="text-blue-400"/> Scan Tickets
                        </button>
                        <button onClick={() => navigate('/cinema/pos')} className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white px-8 py-3.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-sm shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] border border-orange-400/30">
                            <Ticket size={18}/> Sell Tickets
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-10">
                    <StatCard icon={<Users size={24}/>} label="Guests Today" value={stats?.totalGuests || 0} colorTheme="blue" />
                    <StatCard icon={<Ticket size={24}/>} label="Tickets Sold" value={stats?.todayTickets || 0} colorTheme="purple" />
                    <StatCard icon={<Banknote size={24}/>} label="Box Office Cash" value={formatCurrency(stats?.posCashRevenue)} colorTheme="emerald" />
                    <StatCard icon={<MonitorPlay size={24}/>} label="Total Revenue" value={formatCurrency(stats?.totalRevenue)} colorTheme="orange" trend="Live"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left Column: Today's Screenings */}
                    <div className="lg:col-span-8 bg-[#060606]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.04] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-white/5 pb-4 sm:pb-5">
                            <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 sm:gap-3 text-white uppercase tracking-[0.2em]">
                                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20"><Calendar size={18} className="text-orange-500" /></div> 
                                Today's Shows
                            </h3>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-400 bg-white/5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner shrink-0">{stats?.upcomingShows?.length || 0} Shows</span>
                        </div>
                        
                        {stats?.upcomingShows?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 sm:py-24 border border-dashed border-white/10 rounded-2xl bg-black/40 shadow-inner">
                                <Film size={40} className="text-gray-800 mb-4" />
                                <p className="text-gray-500 text-sm font-medium">No shows scheduled for today.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats?.upcomingShows?.map((show, i) => {
                                    const capacity = parseInt(show.capacity || show.totalSeats) || 100; 
                                    let bookedCount = parseInt(show.bookedSeatsCount, 10);
                                    if (isNaN(bookedCount)) bookedCount = 0;

                                    const occupancyPercentage = Math.min(100, Math.round((bookedCount / capacity) * 100));
                                    
                                    let progressColor = "from-emerald-500 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-500/50";
                                    if (occupancyPercentage > 60) progressColor = "from-orange-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] border-orange-500/50";
                                    if (occupancyPercentage > 85) progressColor = "from-red-500 to-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/50";

                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => openSeatMap(show)}
                                            className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#0a0a0a] rounded-2xl border border-white/5 hover:border-orange-500/40 hover:bg-white/[0.03] transition-all duration-300 gap-4 sm:gap-5 group cursor-pointer shadow-lg"
                                        >
                                            <div className="flex items-center gap-4 sm:gap-5">
                                                <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-black border border-white/10 shadow-lg group-hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all relative">
                                                    <img src={show.poster} className="w-full h-full object-cover" alt={`${show.movieTitle} poster`} loading="lazy" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-gray-100 text-base sm:text-lg mb-1.5 tracking-tight group-hover:text-orange-400 transition-colors truncate">{show.movieTitle}</p>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-400 font-bold">
                                                        <span className="flex items-center gap-1.5 bg-black px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-white/5 shadow-inner">
                                                            <Clock size={12} className="text-orange-500 shrink-0"/> 
                                                            <span className="truncate">{new Date(show.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        </span>
                                                        <span className="border border-white/10 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[9px] uppercase tracking-[0.2em] bg-black shadow-inner shrink-0">
                                                            {show.format}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="w-full md:w-56 lg:w-64 flex flex-col gap-2 bg-[#050505] p-3 sm:p-4 rounded-xl border border-white/5 shadow-inner relative overflow-hidden group/bar shrink-0 mt-2 md:mt-0">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover/bar:translate-x-full transition-transform duration-1000"></div>
                                                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10">
                                                    <span>Seats Sold</span>
                                                    <span className="text-white relative z-10">{bookedCount} / {capacity} <span className="text-gray-500 ml-1">({occupancyPercentage}%)</span></span>
                                                </div>
                                                <div className="w-full bg-[#111] rounded-full h-2 sm:h-2.5 overflow-hidden border border-black inset-shadow relative z-10">
                                                    <div className={`h-full rounded-full border-t border-b bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-out`} style={{ width: `${occupancyPercentage}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Live Activity Feed */}
                    <div className="lg:col-span-4 bg-[#060606]/80 backdrop-blur-2xl rounded-3xl border border-white/[0.04] flex flex-col shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-blue-500/50 to-transparent"></div>
                        <div className="p-5 sm:p-8 pb-4 sm:pb-5 flex justify-between items-center border-b border-white/5 shrink-0">
                            <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 sm:gap-3 text-white uppercase tracking-[0.2em]">
                                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20"><Activity size={18} className="text-blue-500" /></div>
                                Recent Sales
                            </h3>
                        </div>
                        
                        {stats?.recentSales?.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-50 min-h-[300px]">
                                <Activity size={40} className="mb-4 text-gray-600"/>
                                <p className="text-gray-500 text-sm font-bold tracking-wide">Awaiting Transactions</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4 flex-1 p-4 sm:p-8 sm:pt-4 overflow-y-auto custom-scrollbar max-h-[500px] lg:max-h-none">
                                {stats?.recentSales?.map((sale, i) => {
                                    let MethodIcon = Banknote;
                                    let methodColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
                                    let methodLabel = "CASH";

                                    if (sale.method === 'CARD_TERMINAL') {
                                        MethodIcon = CreditCard;
                                        methodColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
                                        methodLabel = "CARD";
                                    } else if (sale.method === 'ONLINE') {
                                        MethodIcon = Globe;
                                        methodColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
                                        methodLabel = "ONLINE";
                                    }

                                    return (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#121212] border border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg flex items-center justify-center border ${methodColor}`}>
                                                    <MethodIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs sm:text-sm font-bold text-gray-200 truncate" title={sale.customer}>{sale.customer}</p>
                                                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                                        <span className="text-[9px] text-gray-500 font-medium shrink-0">
                                                            {new Date(sale.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                        <span className="w-1 h-1 bg-gray-700 rounded-full shrink-0"></span>
                                                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium shrink-0">
                                                            {sale.seats.split(',').length} Tix
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 bg-[#050505] p-2 rounded-lg border border-white/[0.05]">
                                                <p className="font-mono text-xs sm:text-[13px] font-black text-white">+{formatCurrency(sale.amount)}</p>
                                                <span className={`text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.2em] mt-1 inline-block border ${methodColor}`}>
                                                    {methodLabel}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        
                        <div className="p-5 sm:p-6 shrink-0 border-t border-white/[0.05] bg-[#030303] mt-auto">
                            <button onClick={() => navigate('/cinema/manifest')} className="w-full py-3 sm:py-3.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-300 hover:text-white transition-all flex justify-center items-center gap-2 shadow-lg">
                                View Guest List <ArrowRight size={14}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {selectedShow && (
                <SeatMapModal 
                    show={selectedShow} 
                    onClose={() => setSelectedShow(null)} 
                    isLoading={isMapLoading} 
                    seatMapDict={seatMapDict} 
                />
            )}
            
        </div>
    );
};

const StatCard = ({ icon, label, value, colorTheme, trend }) => {
    const themes = {
        blue: { bg: 'from-blue-500/10 via-blue-600/5 to-transparent', border: 'border-blue-500/20', iconColor: 'text-blue-500', glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]' },
        purple: { bg: 'from-purple-500/10 via-purple-600/5 to-transparent', border: 'border-purple-500/20', iconColor: 'text-purple-500', glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]' },
        emerald: { bg: 'from-emerald-500/10 via-emerald-600/5 to-transparent', border: 'border-emerald-500/20', iconColor: 'text-emerald-500', glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]' },
        orange: { bg: 'from-orange-500/10 via-orange-600/5 to-transparent', border: 'border-orange-500/20', iconColor: 'text-orange-500', glow: 'group-hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]' },
    };

    const theme = themes[colorTheme] || themes.blue;

    return (
        <div className={`relative overflow-hidden bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${theme.glow}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl ${theme.bg} rounded-full blur-[30px] pointer-events-none transform translate-x-1/3 -translate-y-1/3 opacity-70 group-hover:opacity-100 transition-opacity`}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-4 sm:mb-6">
                <div className={`p-3 sm:p-3.5 rounded-2xl bg-[#060606] shadow-inner border border-white/[0.05] ${theme.iconColor}`}>
                    {React.cloneElement(icon, { size: 24, className: "sm:w-7 sm:h-7" })}
                </div>
                {trend && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-emerald-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] shadow-inner">
                        <TrendingUp size={10} className="sm:w-3 sm:h-3"/> {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1 sm:mb-2 font-mono drop-shadow-md truncate">{value}</p>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] line-clamp-1">{label}</p>
            </div>
        </div>
    );
};

const SeatMapModal = ({ show, onClose, isLoading, seatMapDict }) => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return createPortal(
        <div 
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 sm:p-6 border-b border-gray-800 bg-[#121212] flex justify-between items-center shrink-0">
                    <div className="min-w-0 pr-4">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 truncate">
                            <MonitorPlay className="text-orange-500 shrink-0" size={20} /> 
                            <span className="truncate">{show.movieTitle}</span>
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1 font-mono">{new Date(show.time).toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 shrink-0 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#050505] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-gray-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Loading Live Map...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-10 bg-[#121212] px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full border border-gray-800 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider w-full sm:w-auto">
                                <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#1a1a1a] border border-gray-700 rounded-sm"></div> Available</div>
                                <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500/20 border border-emerald-500 rounded-sm"></div> Cash</div>
                                <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500/20 border border-purple-500 rounded-sm"></div> Card</div>
                                <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500/20 border border-blue-500 rounded-sm"></div> Online</div>
                            </div>

                            <div className="w-full overflow-x-auto custom-scrollbar pb-6">
                                <div className="min-w-[500px] flex flex-col items-center mx-auto px-2">
                                    <div className="w-full max-w-2xl mb-12 sm:mb-16 relative">
                                        <div className="h-1.5 bg-gradient-to-r from-gray-800 via-gray-500 to-gray-800 w-full rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.1)]"></div>
                                        <p className="text-center text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[10px] sm:tracking-[15px] mt-4 font-bold">Screen</p>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:gap-3">
                                        {rows.map(row => (
                                            <div key={row} className="flex justify-center items-center gap-1.5 sm:gap-3">
                                                <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-600 font-mono">{row}</span>
                                                {cols.map(col => {
                                                    const seatId = `${row}${col}`;
                                                    const booking = seatMapDict[seatId];
                                                    
                                                    let seatStyle = 'bg-[#1a1a1a] border-gray-700 text-gray-500'; 
                                                    if (booking) {
                                                        if (booking.method === 'VENUE') seatStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                                                        else if (booking.method === 'CARD_TERMINAL') seatStyle = 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
                                                        else seatStyle = 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
                                                    }

                                                    return (
                                                        <div key={seatId} className="relative group cursor-crosshair">
                                                            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm border text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all duration-300 ${seatStyle} ${booking ? 'hover:scale-110 hover:brightness-150 z-10' : ''}`}>
                                                                {col}
                                                            </div>
                                                            
                                                            {booking && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 sm:mb-3 w-max bg-[#121212] border border-gray-700 text-white text-xs rounded-lg p-2.5 sm:p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-50 transform group-hover:-translate-y-1">
                                                                    <p className="font-bold flex items-center gap-1.5 mb-1 text-xs sm:text-sm"><User size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5"/> {booking.guest}</p>
                                                                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-mono uppercase tracking-widest border-t border-gray-800 pt-1 mt-1">ID: TXN-{booking.id.slice(-6)}</p>
                                                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#121212] border-b border-r border-gray-700 rotate-45"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-600 font-mono">{row}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CinemaDashboard;