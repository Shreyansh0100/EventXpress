import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import { Search, CheckCircle, Clock, User, Film, CreditCard, MapPin, Calendar, Download, Trash2, X, Ticket, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ListBookings = () => {
    
    const currency = "₹"; 
    const { axios, getToken, user } = useAppContext();

    const [bookings, setBookings] = useState([]);
    const [theaters, setTheaters] = useState([]); // Needed for the filter dropdown
    const [totalBookings, setTotalBookings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // --- FILTERS & PAGINATION STATE ---
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("UPCOMING"); 
    const [theaterFilter, setTheaterFilter] = useState("ALL");
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15; 

    // --- DEBOUNCE SEARCH INPUT ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (currentPage !== 1) setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // --- FETCH THEATERS FOR DROPDOWN ---
    useEffect(() => {
        const fetchTheaters = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get("/api/admin/all-theaters", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) setTheaters(data.theaters);
            } catch (error) {
                console.error("Failed to fetch theaters for filter", error);
            }
        };
        if (user) fetchTheaters();
    }, [user, axios, getToken]);

    // --- FETCH PAGINATED BOOKINGS ---
    const getBookings = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                dateFilter: dateFilter,
                theaterFilter: theaterFilter
            });

            const { data } = await axios.get(`/api/admin/all-bookings?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setBookings(data.bookings);
                setTotalBookings(data.total); 
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load bookings");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        if (user) getBookings(); 
    }, [user, currentPage, debouncedSearch, dateFilter, theaterFilter]);

    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalBookings / itemsPerPage);

    // --- ACTIONS ---
    const cancelBooking = async (id) => {
        if(!window.confirm("Are you sure you want to cancel this booking? This will officially mark the ticket as void.")) return;
        try {
            const { data } = await axios.post("/api/admin/delete-booking", { id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if(data.success) {
                toast.success("Booking Cancelled Successfully");
                getBookings(); 
            } else toast.error(data.message);
        } catch (error) { toast.error("Server Error: Could not cancel booking"); }
    }

    const downloadReceipt = async (booking) => {
        try {
            const doc = new jsPDF();
            const { _id, amount, isPaid, show, bookedSeats, paymentMethod, createdAt, status, qrToken } = booking;
            const { movie, theater, showDateTime } = show;
            
            const bookingTimestamp = new Date(createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium'});
            const showDate = new Date(showDateTime).toDateString();
            const showTime = new Date(showDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // --- SECURITY FIX: Use Cryptographic Token for Admin PDF ---
            const secureData = qrToken || _id;
            const qrCodeDataUrl = await QRCode.toDataURL(secureData, { errorCorrectionLevel: 'L', margin: 2, width: 300 });

            doc.setFillColor(15, 15, 15); doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(248, 69, 101); doc.setFontSize(22); doc.setFont("helvetica", "bold");
            doc.text("EventXpress", 15, 25);
            doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal");
            doc.text("TAX INVOICE (ADMIN COPY)", 150, 25);

            if (status === 'Cancelled') {
                doc.setTextColor(255, 200, 200); doc.setFontSize(60); doc.setFont("helvetica", "bold");
                doc.text("VOID / CANCELLED", 35, 150, { angle: 45 });
            }

            let y = 55; doc.setTextColor(0); doc.setFontSize(10); 
            doc.text(`Booking ID: ${_id}`, 15, y); doc.text(`Transaction Date: ${bookingTimestamp}`, 15, y+5);
            doc.text(`Status: ${status === 'Cancelled' ? 'VOID' : 'CONFIRMED'}`, 15, y+10);
            
            doc.setFont("helvetica", "bold"); doc.text("Billed To:", 130, y); doc.setFont("helvetica", "normal"); 
            doc.text(booking.user?.name || "Guest", 130, y+5); doc.text(booking.user?.email || "", 130, y+10);

            y += 25; doc.setFillColor(240, 240, 240); doc.rect(15, y, 180, 10, 'F');
            doc.setFont("helvetica", "bold"); doc.text("Description", 20, y+7); doc.text("Amount", 180, y+7, {align:'right'});
            
            y += 18; doc.setFont("helvetica", "normal");
            doc.text(`${movie.title} (${theater.name})`, 20, y); doc.text(`${amount}.00`, 180, y, {align:'right'});
            
            y += 7; doc.setFontSize(9); doc.setTextColor(100);
            doc.text(`Show: ${showDate} | ${showTime}`, 20, y); doc.text(`Seats: ${(bookedSeats || booking.seats).join(', ')}`, 20, y+5);

            y += 15; doc.setDrawColor(200); doc.line(15, y, 195, y); y += 10;
            doc.setFontSize(14); doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.text("Total Paid", 140, y);
            doc.setTextColor(248, 69, 101); doc.text(`Rs. ${amount}`, 190, y, {align:'right'});

            y += 20; doc.addImage(qrCodeDataUrl, 'PNG', 15, y, 30, 30);
            doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
            doc.text("Official System Generated Receipt", 50, y+15);
            doc.text(`Payment Status: ${isPaid ? "PAID" : "PENDING"} | Method: ${paymentMethod}`, 50, y+20);

            doc.save(`Invoice_${_id}.pdf`); toast.success("Receipt Downloaded");
        } catch (error) { toast.error("PDF Generation Failed"); }
    }

  return (
    <div className='pb-20 min-h-screen font-outfit text-white'>
      
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
          <div>
            <Title text1="Booking" text2="Transactions" />
            <p className="text-gray-400 text-sm mt-1">Showing {bookings.length} of {totalBookings} total records.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              {/* Date Filter */}
              <div className="relative w-full sm:w-40 group">
                  <select 
                      value={dateFilter} 
                      onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer"
                  >
                      <option value="ALL">All Time</option>
                      <option value="UPCOMING">Upcoming & Today</option>
                      <option value="TODAY">Strictly Today</option>
                      <option value="PAST">Past Shows</option>
                  </select>
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none"/>
              </div>

              {/* Theater Filter */}
              <div className="relative w-full sm:w-48 group">
                  <select 
                      value={theaterFilter} 
                      onChange={(e) => handleFilterChange(setTheaterFilter, e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer line-clamp-1"
                  >
                      <option value="ALL">All Theaters</option>
                      {theaters.map(t => (
                          <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                      ))}
                  </select>
                  <Filter className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none"/>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search ID, User, or Movie..." 
                    value={searchQuery}
                    onChange={(e)=>setSearchQuery(e.target.value)}
                    className="w-full bg-[#121212] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-all text-sm shadow-inner"
                  />
              </div>
          </div>
      </div>

      {/* --- DESKTOP VIEW: DATA TABLE --- */}
      <div className="hidden md:block bg-[#121212] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative mb-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-orange-500 opacity-70"></div>

        <div className="overflow-x-auto min-h-[400px] relative">
            {isLoading && (
                <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <Loading />
                </div>
            )}

            <table className="w-full text-left border-collapse">
                <thead className="bg-[#1a1a1a] text-gray-400 text-xs uppercase font-bold tracking-wider">
                    <tr>
                        <th className="p-5 pl-6">User & Status</th>
                        <th className="p-5">Movie Banner</th>
                        <th className="p-5">Show Details</th>
                        <th className="p-5">Transaction Info</th>
                        <th className="p-5">Amount</th>
                        <th className="p-5 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {!isLoading && bookings.length === 0 ? (
                        <tr><td colSpan="6" className="p-10 text-center text-gray-500 italic">No bookings found for the selected filters.</td></tr>
                    ) : (
                        bookings.map((item) => (
                            <tr key={item._id} className={`hover:bg-white/[0.02] transition-colors group ${item.status === 'Cancelled' ? 'opacity-70 bg-red-900/5' : ''}`}>
                                {/* User Info & Status */}
                                <td className="p-5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-400 border border-gray-700 overflow-hidden shrink-0 ${item.status === 'Cancelled' ? 'bg-red-900/20 text-red-500' : 'bg-gray-800'}`}>
                                            {item.user?.image ? (
                                                <img src={item.user.image} alt="" className={`w-full h-full object-cover ${item.status === 'Cancelled' ? 'grayscale' : ''}`}/>
                                            ) : <User size={18}/>}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm whitespace-nowrap ${item.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-white'}`}>{item.guestName || item.user?.name || "Guest"}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {item._id.slice(-6).toUpperCase()}</p>
                                            <div className="mt-1.5">
                                                {item.status === 'Cancelled' ? (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">
                                                        <X size={10}/> Cancelled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        <CheckCircle size={10}/> Confirmed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                {/* Movie Banner */}
                                <td className="p-5">
                                    <div className={`w-16 h-24 rounded-lg bg-gray-800 overflow-hidden border border-gray-700 shadow-md transition-transform duration-300 ${item.status === 'Cancelled' ? '' : 'group-hover:scale-105'}`}>
                                        {item.show?.movie?.poster_path ? (
                                            <img src={item.show.movie.poster_path} className={`w-full h-full object-cover ${item.status === 'Cancelled' ? 'grayscale opacity-50' : ''}`}/>
                                        ) : <Film className="m-auto mt-8 text-gray-600" size={20}/>}
                                    </div>
                                </td>
                                {/* Show Details */}
                                <td className="p-5">
                                    <div className={`flex flex-col gap-1 min-w-[150px] ${item.status === 'Cancelled' ? 'opacity-60' : ''}`}>
                                        <p className="font-bold text-white text-sm line-clamp-1">{item.show?.movie?.title}</p>
                                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                            <MapPin size={12} className="text-blue-400 shrink-0"/> <span className="truncate">{item.show?.theater?.name}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar size={12} className="text-primary shrink-0"/> {dateFormat(item.show?.showDateTime)}
                                        </div>
                                        <div className="mt-1">
                                             <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700 break-words whitespace-normal">
                                                <Ticket size={10} className="inline mr-1 text-gray-500"/>
                                                {(item.bookedSeats || item.seats || []).join(", ")}
                                             </span>
                                        </div>
                                    </div>
                                </td>
                                {/* Transaction Info */}
                                <td className="p-5">
                                    <div className="flex flex-col gap-1 min-w-[140px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.isPaid ? 
                                                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${item.status === 'Cancelled' ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                    <CheckCircle size={10}/> PAID
                                                </span> : 
                                                <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">
                                                    <Clock size={10}/> PENDING
                                                </span>
                                            }
                                        </div>
                                        <div className="text-xs text-gray-300 font-medium flex items-center gap-1">
                                            <CreditCard size={12} className="text-gray-500 shrink-0"/> 
                                            {item.paymentMethod === 'VENUE' ? 'Cash @ Venue' : 'Online / UPI'}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                                            {new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                                        </p>
                                    </div>
                                </td>
                                {/* Amount */}
                                <td className="p-5">
                                    <div className="flex flex-col">
                                        <p className={`font-mono font-bold text-lg ${item.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-white'}`}>
                                            {currency}{item.amount}
                                        </p>
                                        {item.status === 'Cancelled' && (
                                            <p className="text-[10px] font-bold text-primary mt-1">Fee Retained: {currency}{item.amount * 0.4}</p>
                                        )}
                                    </div>
                                </td>
                                {/* Action */}
                                <td className="p-5">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => downloadReceipt(item)} className="p-2.5 rounded-xl bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/25 group/btn" title="Download Invoice">
                                            <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform"/>
                                        </button>
                                        {item.status !== 'Cancelled' && (
                                            <button onClick={() => cancelBooking(item._id)} className="p-2.5 rounded-xl bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-all shadow-lg hover:shadow-red-500/25 group/btn" title="Cancel Booking">
                                                <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform"/>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MOBILE VIEW: CARD STACK --- */}
      <div className="md:hidden space-y-4 relative mb-6">
        {isLoading && (
            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Loading />
            </div>
        )}
        
        {!isLoading && bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic bg-[#121212] rounded-xl border border-gray-800">
                No bookings found for the selected filters.
            </div>
        ) : (
            bookings.map((item) => (
                <div key={item._id} className={`bg-[#121212] border rounded-2xl p-4 flex flex-col gap-4 shadow-lg ${item.status === 'Cancelled' ? 'border-red-900/30 opacity-80' : 'border-gray-800'}`}>
                    
                    {/* User & Status Row */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border ${item.status === 'Cancelled' ? 'border-red-900/50 bg-red-900/20 text-red-500' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>
                                {item.user?.image ? (
                                    <img src={item.user.image} alt="" className={`w-full h-full object-cover ${item.status === 'Cancelled' ? 'grayscale' : ''}`}/>
                                ) : <User size={16}/>}
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${item.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-white'}`}>{item.guestName || item.user?.name || "Guest"}</p>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {item._id.slice(-6).toUpperCase()}</p>
                            </div>
                        </div>
                        <div>
                            {item.status === 'Cancelled' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">
                                    <X size={10}/> Cancelled
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                                    <CheckCircle size={10}/> Confirmed
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Movie Info Box */}
                    <div className="flex gap-3 bg-[#1a1a1a] p-3 rounded-xl border border-gray-800/50">
                        <div className="w-14 h-20 rounded-md bg-gray-800 overflow-hidden shrink-0">
                            {item.show?.movie?.poster_path ? (
                                <img src={item.show.movie.poster_path} className={`w-full h-full object-cover ${item.status === 'Cancelled' ? 'grayscale opacity-50' : ''}`}/>
                            ) : <Film className="m-auto mt-6 text-gray-600" size={16}/>}
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                            <p className="font-bold text-sm text-white line-clamp-1 mb-1">{item.show?.movie?.title}</p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate"><MapPin size={10} className="text-blue-400 shrink-0"/> {item.show?.theater?.name}</p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><Calendar size={10} className="text-primary shrink-0"/> {dateFormat(item.show?.showDateTime)}</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-[#0a0a0a] p-3 rounded-xl border border-gray-800/50">
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Seats</p>
                            <p className="text-xs font-bold text-gray-300 break-words leading-snug">
                                <Ticket size={10} className="inline mr-1 text-gray-600"/>
                                {(item.bookedSeats || item.seats || []).join(", ")}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Amount</p>
                            <p className={`font-mono font-bold text-base ${item.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-primary'}`}>
                                {currency}{item.amount}
                            </p>
                        </div>
                        <div className="col-span-2 pt-2 mt-1 border-t border-gray-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                                {item.isPaid ? <CheckCircle size={10} className="text-emerald-500"/> : <Clock size={10} className="text-yellow-500"/>}
                                <span className="text-[10px] text-gray-400 font-medium">{item.paymentMethod === 'VENUE' ? 'Cash @ Venue' : 'Online / UPI'}</span>
                            </div>
                            <span className="text-[9px] text-gray-500 font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-1">
                        <button onClick={() => downloadReceipt(item)} className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-blue-500/20">
                            <Download size={14}/> Download
                        </button>
                        {item.status !== 'Cancelled' && (
                            <button onClick={() => cancelBooking(item._id)} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-red-500/20">
                                <Trash2 size={14}/> Cancel
                            </button>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      {totalPages > 1 && (
          <div className="flex items-center justify-between bg-[#121212] border border-gray-800 rounded-xl p-4 shadow-lg">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Page {currentPage} of {totalPages} ({totalBookings} Total)
              </p>
              <div className="flex gap-2">
                  <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-gray-800 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-colors"
                  >
                      <ChevronLeft size={16}/> Prev
                  </button>
                  <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || isLoading}
                      className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-gray-800 px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-colors"
                  >
                      Next <ChevronRight size={16}/>
                  </button>
              </div>
          </div>
      )}

    </div>
  )
}

export default ListBookings