import React, { useState, useEffect } from 'react'
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Ticket, Film, TrendingUp, ArrowUpRight, PieChart as PieIcon, 
    DollarSign, Building2, Activity, IndianRupee, MessageSquare, Wallet, 
    CreditCard, MapPin, Clock, ArrowDownRight, Gift, Popcorn, Tag,
    MonitorSmartphone, Store, Utensils, TicketCheck, Users
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const Dashboard = () => {

    const { axios, getToken, user } = useAppContext()
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Enterprise Color Palettes
    const BRAND_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F84565'];
    const CHANNEL_COLORS = ['#3B82F6', '#F59E0B']; // Online vs Box Office
    const PRODUCT_COLORS = ['#10B981', '#8B5CF6']; // Tickets vs F&B

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await axios.get("/api/admin/dashboard", { 
                    headers: { Authorization: `Bearer ${await getToken()}` } 
                })
                if (data.success) {
                    setStats(data.dashboardData);
                } else {
                    toast.error(data.message);
                }
            } catch (error) { 
                console.error("Dashboard Fetch Error:", error);
            } finally { 
                setLoading(false);
            }
        };
        if (user) fetchDashboardData();
    }, [user, axios, getToken]);

    // --- SKELETON LOADER ---
    if (loading) return <DashboardSkeleton />;

    // --- DERIVED ENTERPRISE METRICS ---
    const totalRevenue = stats?.totalRevenue || 0;
    const platformProfit = stats?.platformProfit || 0;
    const cinemaShare = stats?.cinemaShare || 0;
    const snacksRevenue = stats?.snacksRevenue || 0;
    const ticketRevenue = Math.max(0, totalRevenue - snacksRevenue);
    
    // Simulate/Extract Box Office vs Online Splits
    const offlineRevenue = stats?.posCashRevenue || Math.round(totalRevenue * 0.3);
    const onlineRevenue = Math.max(0, totalRevenue - offlineRevenue);

    const channelData = [
        { name: 'App/Web', value: onlineRevenue },
        { name: 'Box Office', value: offlineRevenue }
    ];

    const productData = [
        { name: 'Tickets', value: ticketRevenue },
        { name: 'F&B', value: snacksRevenue }
    ];

    const topCinemasData = stats?.topCinemas?.length > 0 ? stats.topCinemas : [];

    return (
        <div className="space-y-8 pb-10 text-white min-h-screen animate-fadeIn">
            
            {/* --- COMMAND CENTER HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.02] backdrop-blur-3xl p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Global Command Center</h1>
                    <p className="text-gray-400 text-sm mt-2 flex items-center gap-2 font-medium">
                        <Activity size={16} className="text-primary animate-pulse"/> Live Platform Telemetry & Financials
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-6 xl:gap-10 w-full xl:w-auto bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Users size={12}/> Total Users</p>
                        <p className="text-xl font-black text-white">{stats?.totalUser?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-800 hidden sm:block"></div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><TicketCheck size={12}/> Tickets Sold</p>
                        <p className="text-xl font-black text-blue-400">{stats?.totalBookings?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-800 hidden sm:block"></div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Film size={12}/> Active Shows</p>
                        <p className="text-xl font-black text-purple-400">{stats?.activeShows?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </div>

            {/* --- ROW 1: PRIMARY FINANCIAL KPIs --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Gross Platform Volume" 
                    value={totalRevenue} 
                    currency 
                    icon={IndianRupee} 
                    color="text-white" 
                    bg="from-white/[0.05] to-white/[0.01]" 
                    border="border-white/5" 
                    subtext="Total processed including F&B"
                />
                <StatCard 
                    title="Platform Net Profit" 
                    value={platformProfit} 
                    currency 
                    icon={TrendingUp} 
                    color="text-emerald-400" 
                    bg="from-emerald-500/10 to-transparent" 
                    border="border-emerald-500/20" 
                    glow="shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    subtext="Retained fees & margins"
                />
                <StatCard 
                    title="Cinema Payouts" 
                    value={cinemaShare} 
                    currency 
                    icon={Building2} 
                    color="text-orange-400" 
                    bg="from-orange-500/10 to-transparent" 
                    border="border-orange-500/20" 
                    subtext="Due to theater partners"
                />
                <StatCard 
                    title="F&B (Snacks) Revenue" 
                    value={snacksRevenue} 
                    currency 
                    icon={Popcorn} 
                    color="text-purple-400" 
                    bg="from-purple-500/10 to-transparent" 
                    border="border-purple-500/20" 
                    subtext="Total concession sales"
                />
            </div>

            {/* --- ROW 2: ANALYTICS GRAPHS --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 7-Day Revenue Trend */}
                <div className="xl:col-span-2 bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500 opacity-60"></div>
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Activity size={18}/></div>
                            7-Day Revenue Trajectory
                        </h3>
                    </div>
                    <div className="h-[280px] w-full relative">
                        {stats?.salesData?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <AreaChart data={stats.salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val)=> `₹${val >= 1000 ? val/1000 + 'k' : val}`} dx={-10}/>
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#10B981', fontWeight: 'bold' }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                    <Area type="monotone" dataKey="sales" name="Revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" animationDuration={1500}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-600 text-sm border border-dashed border-gray-800 rounded-2xl">Awaiting transaction data...</div>
                        )}
                    </div>
                </div>

                {/* Sales Breakdown Donuts */}
                <div className="bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col">
                    <h3 className="text-lg font-bold flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><PieIcon size={18}/></div>
                        Sales Distribution
                    </h3>
                    
                    <div className="flex-1 flex flex-col justify-around gap-6">
                        {/* Channel Split */}
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                            <div className="w-24 h-24 shrink-0 relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie data={channelData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value" stroke="none">
                                            {channelData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: '#fff' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 pl-4 space-y-3">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5"><MonitorSmartphone size={12} className="text-blue-400"/> App/Web</p>
                                    <p className="font-mono text-sm font-bold mt-0.5">₹{onlineRevenue.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5"><Store size={12} className="text-amber-500"/> Box Office</p>
                                    <p className="font-mono text-sm font-bold mt-0.5">₹{offlineRevenue.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Split */}
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                            <div className="w-24 h-24 shrink-0 relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie data={productData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value" stroke="none">
                                            {productData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: '#fff' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 pl-4 space-y-3">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5"><Ticket size={12} className="text-emerald-400"/> Tickets</p>
                                    <p className="font-mono text-sm font-bold mt-0.5">₹{ticketRevenue.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5"><Popcorn size={12} className="text-purple-400"/> Concessions</p>
                                    <p className="font-mono text-sm font-bold mt-0.5">₹{snacksRevenue.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ROW 3: LEADERBOARDS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Movies */}
                <div className="bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><Film size={18}/></div> 
                        Highest Grossing Features
                    </h3>
                    <div className="h-[280px] w-full relative">
                        {stats?.topMovies?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <BarChart data={stats.topMovies} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2a2a2a" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}} width={130} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                    <Bar dataKey="value" name="Tickets Sold" fill="#F84565" radius={[0, 4, 4, 0]} barSize={20}>
                                        {stats.topMovies.map((entry, index) => ( <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} /> ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex h-full items-center justify-center text-gray-600 text-sm border border-dashed border-gray-800 rounded-2xl">Insufficient Data</div>}
                    </div>
                </div>

                {/* Top Cinemas */}
                <div className="bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><MapPin size={18}/></div> 
                        Top Performing Locations
                    </h3>
                    <div className="h-[280px] w-full relative">
                        {topCinemasData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <BarChart data={topCinemasData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} tickFormatter={(val)=> `₹${val>=1000 ? val/1000+'k' : val}`}/>
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(value) => [`₹${value}`, 'Revenue']} />
                                    <Bar dataKey="sales" name="Gross Revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="flex h-full items-center justify-center text-gray-600 text-sm border border-dashed border-gray-800 rounded-2xl">Insufficient Data</div>}
                    </div>
                </div>
            </div>

            {/* --- ROW 4: MASTER LIVE LEDGER --- */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden mt-6">
                <div className="p-6 md:p-8 border-b border-white/5 bg-black/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Clock size={20}/></div>
                            Live Operations Feed
                        </h3>
                        <p className="text-xs text-gray-400 mt-2 ml-12">Granular view of all incoming network transactions, seats, and F&B additions.</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-gray-400 text-[10px] uppercase font-bold tracking-widest bg-black/20 border-b border-white/5">
                            <tr>
                                <th className="p-5 pl-8">Transaction & User</th>
                                <th className="p-5">Feature & Location</th>
                                <th className="p-5">Inventory (Seats & F&B)</th>
                                <th className="p-5">Payment Auth</th>
                                <th className="p-5 text-right pr-8">Platform Net</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {stats?.recentBookings?.length === 0 && (
                                <tr><td colSpan="5" className="p-10 text-center text-gray-500 border-b border-white/5">No recent transactions in the network.</td></tr>
                            )}
                            {stats?.recentBookings?.map((b) => (
                                <tr key={b._id} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-none">
                                    
                                    {/* 1. TXN & USER */}
                                    <td className="p-5 pl-8 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-inner ${b.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                                                {b.guestName ? b.guestName[0].toUpperCase() : (b.user?.name?.[0] || "G")}
                                            </div>
                                            <div>
                                                <span className={`block whitespace-nowrap ${b.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                    {b.guestName || b.user?.name || "Walk-in Guest"}
                                                </span>
                                                <span className="block text-[10px] text-gray-500 font-mono mt-0.5 tracking-widest">
                                                    TXN-{b._id.slice(-6).toUpperCase()}
                                                </span>
                                                <span className="block text-[10px] text-gray-600 mt-1">
                                                    {new Date(b.createdAt).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})} • {new Date(b.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. FEATURE */}
                                    <td className="p-5 align-top">
                                        <span className={`block font-bold truncate max-w-[200px] ${b.status === 'Cancelled' ? 'text-gray-600' : 'text-blue-400'}`}>{b.show?.movie?.title || "Unknown Feature"}</span>
                                        <span className="block text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                            <MapPin size={10}/> {b.show?.theater?.name || "Unknown Cinema"}
                                        </span>
                                        <span className={`inline-block text-[9px] mt-2 px-2 py-0.5 rounded border uppercase tracking-widest ${b.status === 'Cancelled' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                                            {b.status === 'Cancelled' ? 'VOIDED' : 'CONFIRMED'}
                                        </span>
                                    </td>

                                    {/* 3. INVENTORY (Seats & Snacks) */}
                                    <td className="p-5 align-top">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold flex items-center gap-1"><Ticket size={10}/> Seats</p>
                                                <p className={`text-xs font-mono font-bold ${b.status === 'Cancelled' ? 'text-gray-600 line-through' : 'text-white'}`}>
                                                    {b.bookedSeats?.join(', ') || 'N/A'}
                                                </p>
                                            </div>
                                            {b.snacks?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold flex items-center gap-1"><Utensils size={10}/> Add-ons</p>
                                                    <div className="text-[10px] text-gray-400">
                                                        {b.snacks.map((s, i) => (
                                                            <span key={i} className="block truncate max-w-[180px]">{s.quantity}x {s.name}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* 4. PAYMENT */}
                                    <td className="p-5 align-top">
                                        <div className="flex items-center gap-2 mb-1">
                                            {b.paymentMethod === 'VENUE' || b.paymentMethod === 'CASH' ? (
                                                <div className="bg-orange-500/10 p-1.5 rounded text-orange-400" title="Box Office Counter"><Store size={14}/></div>
                                            ) : (
                                                <div className="bg-blue-500/10 p-1.5 rounded text-blue-400" title="Online Checkout"><MonitorSmartphone size={14}/></div>
                                            )}
                                            <span className={`font-mono font-bold text-base ${b.status === 'Cancelled' ? 'text-gray-600 line-through' : 'text-white'}`}>
                                                ₹{b.amount}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{b.paymentMethod === 'VENUE' ? 'Counter Sale' : 'Digital Gateway'}</span>
                                    </td>

                                    {/* 5. PLATFORM NET */}
                                    <td className="p-5 text-right pr-8 align-top">
                                        <div className="flex flex-col items-end">
                                            <span className={`inline-flex items-center gap-1 font-mono font-bold px-3 py-1.5 rounded-lg border ${
                                                b.status === 'Cancelled' 
                                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                                +₹{b.status === 'Cancelled' 
                                                    ? Math.round(b.amount * 0.40) // 40% Cancellation Fee Retained
                                                    : b.paymentMethod === 'VENUE' 
                                                        ? Math.round((Math.max(0, b.amount - 50) / 1.1) * 0.10 + 50) // Booking fee + 10% cut
                                                        : Math.round((b.amount / 1.1) * 0.10) // Standard 10% margin
                                                }
                                            </span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 font-bold">
                                                {b.status === 'Cancelled' ? 'Cancel Fee Retained' : 'Commission Earned'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>
        </div>
    )
}

// --- SUBCOMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, bg, border, glow = "", currency = false, subtext }) => (
    <div className={`p-6 rounded-3xl border ${border} bg-gradient-to-br ${bg} relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl ${glow} flex flex-col justify-between`}>
        <div className="absolute right-0 top-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
            <Icon size={120} />
        </div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center shadow-inner border border-white/10`}>
                    <Icon size={24} className={color} />
                </div>
            </div>
            <div>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-2 opacity-80">{title}</p>
                <div className="flex items-center gap-1">
                    {currency && <IndianRupee size={22} className={color} strokeWidth={3} />}
                    <h3 className={`text-3xl lg:text-4xl font-black ${color} tracking-tight font-mono`}>
                        {typeof value === 'number' ? value.toLocaleString('en-IN') : value || 0}
                    </h3>
                </div>
                {subtext && <p className="text-[10px] text-gray-500 mt-2 font-medium">{subtext}</p>}
            </div>
        </div>
    </div>
)

// --- SKELETON COMPONENT ---
const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 pb-10 min-h-screen">
            {/* Header Skeleton */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.02] p-6 md:p-8 rounded-3xl border border-white/5">
                <div className="space-y-3">
                    <div className="h-10 w-64 bg-gray-800 animate-pulse rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-800 animate-pulse rounded-lg"></div>
                </div>
                <div className="h-16 w-full xl:w-96 bg-gray-800 animate-pulse rounded-2xl"></div>
            </div>

            {/* Row 1 Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-44 bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                        <div className="w-12 h-12 bg-white/5 animate-pulse rounded-2xl"></div>
                        <div className="space-y-2">
                            <div className="h-3 w-24 bg-gray-800 animate-pulse rounded-full"></div>
                            <div className="h-8 w-32 bg-gray-800 animate-pulse rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2 Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 h-[400px] bg-[#121212] border border-gray-800 rounded-3xl animate-pulse"></div>
                <div className="h-[400px] bg-[#121212] border border-gray-800 rounded-3xl animate-pulse"></div>
            </div>

            {/* Row 3 Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[380px] bg-[#121212] border border-gray-800 rounded-3xl animate-pulse"></div>
                <div className="h-[380px] bg-[#121212] border border-gray-800 rounded-3xl animate-pulse"></div>
            </div>
            
            {/* Row 4 Skeleton */}
            <div className="h-[500px] bg-[#121212] border border-gray-800 rounded-3xl animate-pulse mt-6"></div>
        </div>
    );
};

export default Dashboard;