import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { Search, Printer, Ticket, CheckCircle2, XCircle, Globe, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const CinemaBookings = () => {
    const { axios, getToken } = useAppContext();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, ONLINE, VENUE

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get("/api/box-office/all-bookings", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) {
                    setBookings(data.bookings);
                }
            } catch (error) {
                toast.error("Failed to load booking history.");
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [axios, getToken]);

    // --- REPRINT TICKET LOGIC ---
    const reprintTicket = async (booking) => {
        if (booking.status === 'Cancelled' || booking.status === 'CANCELLED') {
            return toast.error("Cannot print a cancelled ticket.");
        }

        try {
            const doc = new jsPDF();
            const qrCodeDataUrl = await QRCode.toDataURL(booking._id, { errorCorrectionLevel: 'L', margin: 2, width: 300 });
            const bookingIdShort = booking._id.slice(-8).toUpperCase();
            
            // Safe date parsing
            const showDateObj = booking.show?.showDateTime ? new Date(booking.show.showDateTime) : null;
            const showDate = showDateObj ? showDateObj.toDateString() : 'N/A';
            const showTime = showDateObj ? showDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
            const guestName = booking.guestName || booking.user?.name || 'Walk-in Guest';

            // Header
            doc.setFillColor(10, 10, 10); doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(234, 88, 12); doc.setFontSize(26); doc.setFont("helvetica", "bold");
            doc.text("EventXpress Box Office", 15, 25);
            doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal");
            doc.text("Admit One - Official Ticket", 145, 25);

            // Guest Info
            doc.setTextColor(0, 0, 0); let y = 55;
            doc.setFontSize(10); doc.setTextColor(100);
            doc.text("Issued To:", 15, y); doc.text("Transaction Details:", 130, y);
            
            y += 7;
            doc.setFontSize(11); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(guestName, 15, y);
            doc.text(`ID: TXN-${bookingIdShort}`, 130, y);
            
            y += 6;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            doc.text(booking.paymentMethod === 'ONLINE' ? 'Online App Booking' : 'Counter Sale / Walk-in', 15, y);
            doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 130, y);

            // Movie Block
            y += 20;
            doc.setDrawColor(230); doc.setFillColor(250, 250, 250); doc.roundedRect(15, y, 180, 50, 3, 3, 'FD');
            doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
            doc.text(booking.show?.movie?.title || 'Unknown Feature', 25, y+16);
            doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
            doc.text(`${booking.show?.theater?.name || 'Local Theater'}`, 25, y+28);
            doc.text(`${showDate} | ${showTime}`, 25, y+36);
            
            // Seats Block
            const seatsToPrint = booking.bookedSeats || booking.selectedSeats || [];
            doc.setFillColor(234, 88, 12); doc.roundedRect(140, y+15, 45, 14, 2, 2, 'F');
            doc.setTextColor(255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
            doc.text(`Seats: ${seatsToPrint.join(', ')}`, 162.5, y+24, {align: 'center'});

            // Billing
            y += 65; doc.setFontSize(10); doc.setTextColor(0);
            doc.text("Payment Method", 15, y); doc.text("Total Paid", 180, y, {align: 'right'});
            doc.setDrawColor(200); doc.line(15, y+2, 195, y+2);
            y += 10;
            doc.text(booking.paymentMethod === 'VENUE' ? 'Cash at Counter' : booking.paymentMethod === 'CARD_TERMINAL' ? 'Card Terminal' : 'Online Payment', 15, y);
            doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
            doc.text(`Rs. ${booking.amount}.00`, 180, y, {align: 'right'});

            // QR Code
            y += 20; doc.addImage(qrCodeDataUrl, 'PNG', 85, y, 40, 40);
            y += 45; doc.setTextColor(100); doc.setFontSize(9); doc.setFont("helvetica", "normal");
            doc.text("Present this QR code to the gate staff for entry.", 105, y, {align: 'center'});

            doc.save(`Ticket_${bookingIdShort}.pdf`);
            toast.success("Ticket reprinted successfully!");
        } catch (error) { 
            console.error(error); 
            toast.error("Failed to generate PDF."); 
        }
    };

    // Apply Search and Filter
    const filteredBookings = bookings.filter(b => {
        const matchesSearch = 
            (b._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            ((b.guestName || b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesFilter = 
            filter === 'ALL' || 
            (filter === 'ONLINE' && b.paymentMethod === 'ONLINE') ||
            (filter === 'VENUE' && (b.paymentMethod === 'VENUE' || b.paymentMethod === 'CARD_TERMINAL'));

        return matchesSearch && matchesFilter;
    });

    if (loading) return <Loading />;

    return (
        <div className="pb-20 pt-6 px-4 sm:px-6 lg:px-8 font-outfit text-white animate-fadeIn relative max-w-[1600px] mx-auto">
            
            {/* Ambient Background Glows */}
            <div className="fixed top-20 right-1/4 w-[40%] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0 hidden md:block"></div>
            <div className="fixed bottom-0 left-0 w-[40%] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0 hidden md:block"></div>

            <div className="relative z-10 w-full">
                {/* Header Sub-Nav Style */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 sm:mb-10 gap-6 bg-[#060606]/80 p-5 sm:p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                    <div className="w-full xl:w-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <Ticket fill="currentColor" size={12} className="text-purple-500" />
                            <p className="text-purple-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">Transaction Ledger</p>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Booking History</h2>
                        <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3 sm:px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner break-words">
                            Search, verify, and reprint online and walk-in tickets
                        </p>
                    </div>
                
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full xl:w-auto mt-4 xl:mt-0">
                        {/* Filter Dropdown */}
                        <div className="relative group w-full sm:w-auto shrink-0">
                            <select 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold uppercase tracking-wider outline-none text-[10px] sm:text-[11px] cursor-pointer appearance-none pr-10 shadow-inner group-hover:border-purple-500/50 transition-all focus:border-purple-500/50"
                            >
                                <option value="ALL">All Sources</option>
                                <option value="ONLINE">Online App</option>
                                <option value="VENUE">Box Office</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-purple-500 transition-colors">
                                <MonitorPlay size={14} className="sm:w-[14px] sm:h-[14px]"/>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 sm:w-64 md:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-500" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search Name or ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 text-white pl-9 sm:pl-11 pr-4 py-3 sm:py-3.5 rounded-xl outline-none focus:border-purple-500/50 text-xs sm:text-sm transition-all shadow-inner placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-[#060606]/80 backdrop-blur-2xl border border-white/[0.04] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-purple-500/30 to-transparent"></div>
                    <div className="overflow-x-auto custom-scrollbar pb-4 sm:pb-0">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#030303]/50 border-b border-white/[0.05]">
                                <tr>
                                    <th className="py-4 sm:py-6 px-4 sm:px-8 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Transaction ID</th>
                                    <th className="py-4 sm:py-6 px-4 sm:px-6 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Guest Profile</th>
                                    <th className="py-4 sm:py-6 px-4 sm:px-6 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Feature & Show</th>
                                    <th className="py-4 sm:py-6 px-4 sm:px-6 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Origin</th>
                                    <th className="py-4 sm:py-6 px-4 sm:px-6 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="py-4 sm:py-6 px-4 sm:px-8 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-16 sm:py-24 text-center text-gray-500 bg-black/20">
                                            <p className="text-xs sm:text-sm font-medium tracking-wide">No bookings found matching your search criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => {
                                        const isCancelled = booking.status === 'Cancelled' || booking.status === 'CANCELLED';
                                        const isOnline = booking.paymentMethod === 'ONLINE';
                                        
                                        return (
                                            <tr key={booking._id} className={`hover:bg-white/[0.02] transition-colors ${isCancelled ? 'opacity-40 grayscale-[80%]' : ''}`}>
                                                
                                                {/* Booking ID */}
                                                <td className="py-4 sm:py-5 px-4 sm:px-8">
                                                    <span className="font-mono text-[9px] sm:text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg shadow-inner inline-block">
                                                        #{booking._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>

                                                {/* Guest Profile */}
                                                <td className="py-4 sm:py-5 px-4 sm:px-6">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-xs sm:text-sm text-gray-200 truncate max-w-[120px] sm:max-w-[150px] tracking-tight">
                                                            {booking.guestName || booking.user?.name || "Walk-in Guest"}
                                                        </p>
                                                        <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 uppercase tracking-wider font-mono truncate">
                                                            {new Date(booking.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Feature & Show */}
                                                <td className="py-4 sm:py-5 px-4 sm:px-6">
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-[13px] font-bold text-gray-200 truncate max-w-[140px] sm:max-w-[180px]">{booking.show?.movie?.title || "N/A"}</p>
                                                        <p className="text-[9px] sm:text-[11px] text-orange-400 font-bold mt-1 sm:mt-1.5 flex items-center gap-1 sm:gap-1.5 bg-orange-500/10 inline-flex px-1.5 sm:px-2 py-0.5 rounded border border-orange-500/20">
                                                            <Ticket size={10} className="shrink-0"/> <span className="truncate">{(booking.bookedSeats || booking.selectedSeats || []).join(', ')}</span>
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Origin */}
                                                <td className="py-4 sm:py-5 px-4 sm:px-6">
                                                    <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] ${
                                                        isOnline ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]' : 'bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[inset_0_0_10px_rgba(236,72,153,0.1)]'
                                                    }`}>
                                                        {isOnline ? <Globe size={10} className="sm:w-3 sm:h-3 shrink-0"/> : <MonitorPlay size={10} className="sm:w-3 sm:h-3 shrink-0"/>}
                                                        <span className="whitespace-nowrap">{isOnline ? 'Online App' : 'Box Office'}</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-4 sm:py-5 px-4 sm:px-6">
                                                    {isCancelled ? (
                                                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-red-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] border border-red-500/20 bg-red-500/10 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg whitespace-nowrap">
                                                            <XCircle size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2.5}/> VOID
                                                        </span>
                                                    ) : booking.isCheckedIn ? (
                                                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-emerald-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] border border-emerald-500/20 bg-emerald-500/10 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg whitespace-nowrap">
                                                            <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2.5}/> Scanned
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 sm:gap-1.5 text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] border border-white/10 bg-white/5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg whitespace-nowrap">
                                                            <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" strokeWidth={2.5}/> Valid
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 sm:py-5 px-4 sm:px-8 text-right">
                                                    <button 
                                                        onClick={() => reprintTicket(booking)}
                                                        disabled={isCancelled}
                                                        className="bg-[#111] hover:bg-white border border-white/10 hover:border-white text-gray-400 hover:text-black p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-[#111] disabled:hover:text-gray-400 disabled:hover:border-white/10 shadow-lg shrink-0 inline-flex"
                                                        title="Download / Reprint PDF Ticket"
                                                    >
                                                        <Printer size={14} className="sm:w-4 sm:h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CinemaBookings;