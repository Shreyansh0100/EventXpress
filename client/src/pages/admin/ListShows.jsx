import React, { useEffect, useState, useMemo } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import { 
    Search, Trash2, Calendar, MapPin, Film, Clock, Users, Eye, X, 
    Ticket, QrCode, Download, User, Armchair, Filter, AlertCircle, 
    CheckCircle2, ChevronLeft, ChevronRight, LayoutGrid, List, MonitorSmartphone, Store 
} from 'lucide-react';
import toast from 'react-hot-toast';

const ListShows = () => {

    const { axios, getToken, user } = useAppContext()
    const currency = "₹"; 

    const [shows, setShows] = useState([]);
    const [allBookings, setAllBookings] = useState([]); 
    const [loading, setLoading] = useState(true);

    // --- FILTERS & PAGINATION ---
    const [searchFilter, setSearchFilter] = useState("");
    const [theaterFilter, setTheaterFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState(""); // <-- NEW: Date Filter State
    const [currentPage, setCurrentPage] = useState(1);
    const showsPerPage = 20;

    // --- MODALS & VIEWS ---
    const [viewingShow, setViewingShow] = useState(null); 
    const [viewingTicket, setViewingTicket] = useState(null); 
    const [panelViewMode, setPanelViewMode] = useState('LIST'); // 'LIST' or 'MAP'
    const [selectedSeatData, setSelectedSeatData] = useState(null);

    // Standard Cinema Seat Map Config
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const fetchData = async () =>{
        try {
            const token = await getToken();
            const [showsRes, bookingsRes] = await Promise.all([
                axios.get("/api/admin/all-shows", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/admin/all-bookings", { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if(showsRes.data.success) setShows(showsRes.data.shows);
            if(bookingsRes.data.success) setAllBookings(bookingsRes.data.bookings);

        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    }

    const deleteShow = async (id) => {
        if(!window.confirm("Are you sure? This will permanently delete this show and its bookings.")) return;
        try {
            const { data } = await axios.post("/api/admin/delete-show", { id }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if(data.success) {
                toast.success("Show Deleted Successfully");
                fetchData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Server Error: Could not delete show");
        }
    }

    useEffect(() => {
        if(user) fetchData();
    }, [user]);

    // Reset pagination when ANY filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchFilter, theaterFilter, dateFilter]);

    // --- OPTIMIZATION: HASH MAP FOR BOOKINGS ---
    const bookingsDataMap = useMemo(() => {
        const map = {};
        allBookings.forEach(b => {
            // 🚨 CRITICAL FIX: Ensure we extract the ID even if 'b.show' isn't populated!
            const showId = typeof b.show === 'object' ? b.show?._id : b.show;
            if (!showId) return;
            
            if (!map[showId]) {
                map[showId] = { list: [], revenue: 0 };
            }
            
            map[showId].list.push(b);
            map[showId].revenue += (b.status === 'Cancelled' ? (b.amount * 0.40) : b.amount);
        });
        return map;
    }, [allBookings]);

    // --- SEAT MAP DATA BUILDER ---
    const seatDictionary = useMemo(() => {
        if (!viewingShow) return {};
        const map = {};
        const showBookings = bookingsDataMap[viewingShow._id]?.list || [];
        
        showBookings.forEach(booking => {
            if (booking.status !== 'Cancelled') {
                const seats = booking.seats || booking.bookedSeats || [];
                seats.forEach(seat => {
                    map[seat] = booking;
                });
            }
        });
        return map;
    }, [viewingShow, bookingsDataMap]);

    // --- EXTRACT UNIQUE THEATERS FOR DROPDOWN ---
    const uniqueTheaters = Array.from(new Set(shows.map(s => s.theater?._id)))
        .map(id => shows.find(s => s.theater?._id === id)?.theater)
        .filter(Boolean);

    // --- ENHANCED FILTER LOGIC ---
    const filteredShows = shows.filter(show => {
        const matchesSearch = show.movie?.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
                              show.theater?.name.toLowerCase().includes(searchFilter.toLowerCase());
        
        const matchesTheater = theaterFilter === "ALL" || show.theater?._id === theaterFilter;
        
        // Date Logic
        let matchesDate = true;
        if (dateFilter) {
            const showDateStr = new Date(show.showDateTime).toISOString().split('T')[0];
            matchesDate = showDateStr === dateFilter;
        }

        return matchesSearch && matchesTheater && matchesDate;
    });

    const totalPages = Math.ceil(filteredShows.length / showsPerPage);
    const paginatedShows = filteredShows.slice((currentPage - 1) * showsPerPage, currentPage * showsPerPage);

    const currentShowBookings = viewingShow ? (bookingsDataMap[viewingShow._id]?.list || []) : [];

    const handlePrintTicket = () => window.print();

  return !loading ? (
    <div className='pb-20 min-h-screen font-outfit text-white relative'>
      
      {/* --- TICKET MODAL (Highest Z-Index) --- */}
      {viewingTicket && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn print:bg-white print:p-0">
              <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative print:shadow-none print:w-full print:max-w-none">
                  
                  {/* Non-printable close buttons */}
                  <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
                      <button onClick={handlePrintTicket} className="bg-black/20 hover:bg-black/40 text-black p-2 rounded-full backdrop-blur-sm transition"><Download size={18}/></button>
                      <button onClick={()=>setViewingTicket(null)} className="bg-black/20 hover:bg-red-500 text-black hover:text-white p-2 rounded-full backdrop-blur-sm transition"><X size={18}/></button>
                  </div>

                  {/* Ticket Header Image */}
                  <div className="h-40 bg-gray-900 relative">
                      <img src={viewingTicket.show?.movie?.poster_path} alt="Movie" className={`w-full h-full object-cover ${viewingTicket.status === 'Cancelled' ? 'grayscale opacity-30' : 'opacity-60'}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                      {viewingTicket.status === 'Cancelled' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-red-600 font-black text-4xl uppercase tracking-widest border-4 border-red-600 p-2 rotate-[-15deg] opacity-80 rounded-xl">VOID</span>
                          </div>
                      )}
                  </div>

                  {/* Ticket Body */}
                  <div className="px-8 pb-8 pt-4 relative bg-white text-black">
                      <div className="absolute -top-12 left-8 right-8">
                          <h2 className="text-2xl font-black text-white shadow-black drop-shadow-md truncate">{viewingTicket.show?.movie?.title}</h2>
                          <p className="text-sm font-bold text-primary shadow-black drop-shadow-md">{viewingTicket.show?.theater?.name}</p>
                      </div>

                      <div className="border-b-2 border-dashed border-gray-300 pb-6 mb-6">
                          <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Date</p>
                                  <p className="font-bold">{new Date(viewingTicket.show?.showDateTime).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Time</p>
                                  <p className="font-bold">{new Date(viewingTicket.show?.showDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Screening</p>
                                  <p className="font-bold">{viewingTicket.show?.format} • {viewingTicket.show?.language}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Total Paid</p>
                                  <p className="font-bold text-primary">₹{viewingTicket.amount}</p>
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Passenger</p>
                              <p className="font-bold">{viewingTicket.guestName || viewingTicket.user?.name || "Guest"}</p>
                              <p className="text-xs text-gray-500">{viewingTicket.user?.email || "Box Office Walk-in"}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Seats ({viewingTicket.seats?.length || viewingTicket.bookedSeats?.length})</p>
                              <p className={`font-black text-lg ${viewingTicket.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-primary'}`}>
                                  {(viewingTicket.seats || viewingTicket.bookedSeats).join(', ')}
                              </p>
                          </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-100">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewingTicket._id}`} alt="QR Code" className={`w-32 h-32 mix-blend-multiply ${viewingTicket.status === 'Cancelled' && 'opacity-20'}`} />
                          <p className="text-[10px] font-mono text-gray-400 mt-3 tracking-widest">{viewingTicket._id}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- SHOW DETAILS / GUEST LIST / MAP PANEL --- */}
      {viewingShow && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm print:hidden">
              <div className="absolute inset-0" onClick={() => { setViewingShow(null); setSelectedSeatData(null); }}></div>
              
              <div className="w-full max-w-2xl bg-[#121212] border-l border-gray-800 h-full shadow-2xl relative z-10 flex flex-col animate-slideInRight">
                  
                  <div className="p-6 bg-gray-900 border-b border-gray-800 flex justify-between items-start">
                      <div>
                          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><MonitorSmartphone className="text-primary"/> Operations Panel</h2>
                          <p className="text-xs text-gray-400 font-mono">{viewingShow.movie?.title} • {new Date(viewingShow.showDateTime).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                      <button onClick={() => { setViewingShow(null); setSelectedSeatData(null); }} className="bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white p-2 rounded-full transition"><X size={16}/></button>
                  </div>

                  <div className="p-6 bg-gray-800/30 flex justify-between items-center border-b border-gray-800">
                      <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Tickets</p>
                          <p className="text-2xl font-black text-white">{currentShowBookings.length}</p>
                      </div>
                      
                      {/* VIEW TOGGLE */}
                      <div className="flex bg-black p-1 rounded-xl border border-gray-800 shadow-inner">
                          <button 
                              onClick={() => setPanelViewMode('LIST')} 
                              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${panelViewMode === 'LIST' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                              <List size={14}/> List
                          </button>
                          <button 
                              onClick={() => setPanelViewMode('MAP')} 
                              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${panelViewMode === 'MAP' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                              <LayoutGrid size={14}/> Map
                          </button>
                      </div>

                      <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Net Revenue</p>
                          <p className="text-2xl font-black text-emerald-400">
                              ₹{bookingsDataMap[viewingShow._id]?.revenue || 0}
                          </p>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      
                      {/* ==== LIST VIEW ==== */}
                      {panelViewMode === 'LIST' && (
                          <div className="space-y-4">
                              {currentShowBookings.length === 0 ? (
                                  <div className="text-center text-gray-600 mt-10 flex flex-col items-center">
                                      <Ticket size={40} className="mb-3 opacity-20"/>
                                      <p>No bookings for this show yet.</p>
                                  </div>
                              ) : (
                                  currentShowBookings.map((booking) => (
                                      <div key={booking._id} className={`bg-[#1a1a1a] border rounded-xl p-4 transition-colors group ${booking.status === 'Cancelled' ? 'border-red-900/30 opacity-70' : 'border-gray-800 hover:border-primary/50'}`}>
                                          <div className="flex justify-between items-start mb-3">
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-400 ${booking.status === 'Cancelled' ? 'bg-red-900/20 text-red-500' : 'bg-gray-800'}`}>
                                                      {booking.status === 'Cancelled' ? <AlertCircle size={16}/> : <User size={16}/>}
                                                  </div>
                                                  <div>
                                                      <p className={`font-bold text-sm ${booking.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-white'}`}>{booking.guestName || booking.user?.name || "Walk-in Guest"}</p>
                                                      <p className="text-[10px] text-gray-500 font-mono">{booking.user?.email || (booking.paymentMethod === 'VENUE' ? 'Box Office Sale' : 'Online Guest')}</p>
                                                  </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-1">
                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider flex items-center gap-1 ${booking.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                      {booking.status === 'Cancelled' ? <><X size={10}/> Cancelled</> : <><CheckCircle2 size={10}/> Confirmed</>}
                                                  </span>
                                                  <span className="text-xs font-bold text-gray-400">₹{booking.amount}</span>
                                              </div>
                                          </div>
                                          
                                          <div className="flex justify-between items-end border-t border-gray-800/50 pt-3 mt-1">
                                              <div>
                                                  <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-0.5"><Armchair size={10}/> Seats</p>
                                                  <p className={`text-xs font-bold ${booking.status === 'Cancelled' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{(booking.seats || booking.bookedSeats).join(', ')}</p>
                                              </div>
                                              <button 
                                                  onClick={() => setViewingTicket(booking)}
                                                  className={`text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-bold ${booking.status === 'Cancelled' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-primary hover:bg-red-600 text-white shadow-lg shadow-primary/20'}`}
                                              >
                                                  <QrCode size={12}/> View Ticket
                                              </button>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      )}

                      {/* ==== MAP VIEW ==== */}
                      {panelViewMode === 'MAP' && (
                          <div className="flex flex-col items-center">
                              {/* Screen SVG/Indicator */}
                              <div className="w-full max-w-sm mb-12 relative">
                                  <div className="h-1.5 bg-gray-600 w-full rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.1)]"></div>
                                  <p className="text-center text-[10px] text-gray-500 uppercase tracking-[15px] mt-4 font-bold ml-[15px]">Screen</p>
                              </div>

                              {/* Seat Grid */}
                              <div className="flex flex-col gap-2 md:gap-3 mb-8 w-full max-w-lg mx-auto">
                                  {rows.map(row => (
                                      <div key={row} className="flex justify-center items-center gap-1.5 md:gap-2">
                                          <span className="w-4 md:w-6 text-center text-xs font-bold text-gray-600 font-mono">{row}</span>
                                          {cols.map(col => {
                                              const seatId = `${row}${col}`;
                                              const booking = seatDictionary[seatId];
                                              const isBooked = !!booking;
                                              
                                              // Determine source of booking
                                              const isOffline = booking && (booking.paymentMethod === 'VENUE' || booking.paymentMethod === 'CASH');
                                              
                                              let seatClass = 'bg-[#1a1a1a] border-gray-700 text-gray-500 hover:border-gray-500 hover:bg-gray-800 cursor-default';
                                              
                                              if (isBooked) {
                                                  if (selectedSeatData?._id === booking._id) {
                                                      // Highlight selected entire booking block
                                                      seatClass = 'bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-110 cursor-pointer z-10';
                                                  } else if (isOffline) {
                                                      seatClass = 'bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white cursor-pointer';
                                                  } else {
                                                      seatClass = 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white cursor-pointer';
                                                  }
                                              }

                                              return (
                                                  <button
                                                      key={seatId}
                                                      onClick={() => isBooked && setSelectedSeatData(booking)}
                                                      className={`w-6 h-6 md:w-8 md:h-8 rounded-t-lg rounded-b-sm border transition-all text-[9px] md:text-[10px] font-bold flex items-center justify-center ${seatClass}`}
                                                      title={isBooked ? `Booked by ${booking.guestName || booking.user?.name || 'Guest'}` : `Seat ${seatId}`}
                                                  >
                                                      {col}
                                                  </button>
                                              );
                                          })}
                                          <span className="w-4 md:w-6 text-center text-xs font-bold text-gray-600 font-mono">{row}</span>
                                      </div>
                                  ))}
                              </div>

                              {/* Map Legend */}
                              <div className="flex flex-wrap justify-center gap-4 mb-8 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#1a1a1a] border border-gray-700"></div> Available</div>
                                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/50"></div> App/Web Sale</div>
                                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-orange-500/20 border border-orange-500/50"></div> Box Office Sale</div>
                              </div>

                              {/* Inspector Panel (Appears when clicking a booked seat) */}
                              {selectedSeatData ? (
                                  <div className="w-full bg-[#151515] border border-gray-700 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-slideUp">
                                      <div className={`absolute top-0 left-0 w-full h-1 ${(selectedSeatData.paymentMethod === 'VENUE' || selectedSeatData.paymentMethod === 'CASH') ? 'bg-gradient-to-r from-orange-400 to-amber-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`}></div>
                                      
                                      <button onClick={() => setSelectedSeatData(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition"><X size={16}/></button>
                                      
                                      <div className="flex items-start gap-4 mb-4">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-inner ${
                                              (selectedSeatData.paymentMethod === 'VENUE' || selectedSeatData.paymentMethod === 'CASH')
                                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                          }`}>
                                              {(selectedSeatData.paymentMethod === 'VENUE' || selectedSeatData.paymentMethod === 'CASH') ? <Store size={18}/> : <MonitorSmartphone size={18}/>}
                                          </div>
                                          <div>
                                              <p className="font-bold text-white text-base">{selectedSeatData.guestName || selectedSeatData.user?.name || "Walk-in Guest"}</p>
                                              <p className="text-xs text-gray-400 font-mono">ID: {selectedSeatData._id.slice(-8).toUpperCase()}</p>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4 mb-4">
                                          <div>
                                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Seats Bound</p>
                                              <p className="text-sm font-bold text-white">{(selectedSeatData.seats || selectedSeatData.bookedSeats).join(', ')}</p>
                                          </div>
                                          <div>
                                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Transaction Value</p>
                                              <p className="text-sm font-bold text-emerald-400">₹{selectedSeatData.amount}</p>
                                          </div>
                                          <div>
                                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Timestamp</p>
                                              <p className="text-sm font-medium text-gray-300">{new Date(selectedSeatData.createdAt).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</p>
                                          </div>
                                          <div>
                                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">F&B Add-ons</p>
                                              <p className="text-sm font-medium text-gray-300">{selectedSeatData.snacks?.length > 0 ? `${selectedSeatData.snacks.length} Items` : 'None'}</p>
                                          </div>
                                      </div>
                                      
                                      <button onClick={() => {setViewingTicket(selectedSeatData); setSelectedSeatData(null);}} className="w-full py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 transition shadow-lg flex items-center justify-center gap-2">
                                          <QrCode size={16}/> Inspect Full Receipt
                                      </button>
                                  </div>
                              ) : (
                                  <div className="w-full bg-[#151515] border border-gray-800 border-dashed rounded-2xl p-6 text-center text-gray-600 text-sm font-medium flex flex-col items-center">
                                      <Armchair size={24} className="mb-2 opacity-50"/>
                                      Click any colored seat above to inspect booking origin and details.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 print:hidden">
          <div>
            <Title text1="Manage" text2="Shows" />
            <p className="text-gray-400 text-sm mt-1">Monitor active screenings, filter by location, and analyze projected revenue.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-wrap justify-end">
              {/* DATE FILTER */}
              <div className="relative w-full sm:w-40 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                  </div>
                  <input 
                      type="date" 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm shadow-inner [color-scheme:dark] cursor-pointer"
                  />
                  {dateFilter && (
                      <button onClick={() => setDateFilter("")} className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white transition-colors">
                          <X size={14}/>
                      </button>
                  )}
              </div>

              {/* THEATER FILTER DROPDOWN */}
              <div className="relative w-full sm:w-48 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                  </div>
                  <select 
                      value={theaterFilter} 
                      onChange={(e) => setTheaterFilter(e.target.value)}
                      className="w-full bg-[#121212] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm shadow-inner appearance-none cursor-pointer"
                  >
                      <option value="ALL">All Theaters</option>
                      {uniqueTheaters.map(t => (
                          <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                      ))}
                  </select>
              </div>

              {/* SEARCH BAR */}
              <div className="relative w-full sm:w-56 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search movies..." 
                    value={searchFilter}
                    onChange={(e)=>setSearchFilter(e.target.value)}
                    className="w-full bg-[#121212] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm shadow-inner"
                  />
              </div>
          </div>
      </div>

      <div className="bg-[#121212] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative print:hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-70"></div>

         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead className="bg-[#1a1a1a] text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-800">
                    <tr>
                        <th className="p-5 pl-6">Movie & Specs</th>
                        <th className="p-5">Location & Time</th>
                        <th className="p-5">Seat Availability</th>
                        <th className="p-5">Financial Projection</th>
                        <th className="p-5 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {paginatedShows.length === 0 ? (
                        <tr><td colSpan="5" className="p-10 text-center text-gray-500 italic">No active shows found matching your criteria.</td></tr>
                    ) : (
                        paginatedShows.map((show, index) => {
                            // 🚨 CRITICAL FIX: Get booked count DIRECTLY from active bookings, not the buggy occupiedSeats array!
                            const showBookingsList = bookingsDataMap[show._id]?.list || [];
                            const bookedCount = showBookingsList.reduce((total, b) => {
                                return b.status !== 'Cancelled' ? total + (b.seats?.length || b.bookedSeats?.length || 0) : total;
                            }, 0);

                            // SEAT MATH
                            const totalCapacity = 120; // Assuming 40 Royal, 40 Premium, 40 Plaza
                            const availableCount = totalCapacity - bookedCount;
                            const percentFull = Math.min((bookedCount / totalCapacity) * 100, 100);
                            
                            let progressColor = "bg-green-500";
                            if(percentFull > 50) progressColor = "bg-yellow-500";
                            if(percentFull > 80) progressColor = "bg-red-500";

                            // REVENUE MATH
                            const maxRevenue = (40 * (show.ticketPrice?.royal || 300)) + (40 * (show.ticketPrice?.premium || 200)) + (40 * (show.ticketPrice?.plaza || 150));
                            const actualRevenue = bookingsDataMap[show._id]?.revenue || 0;
                            const revPercent = Math.min((actualRevenue / maxRevenue) * 100, 100);

                            return (
                                <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                                    
                                    {/* 1. Movie Details */}
                                    <td className="p-5 pl-6 min-w-[250px]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-16 rounded-lg bg-gray-800 overflow-hidden shadow-md flex-shrink-0 border border-gray-700">
                                                {show.movie?.poster_path ? (
                                                    <img src={show.movie.poster_path} alt="poster" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><Film size={20} className="text-gray-600"/></div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-base group-hover:text-primary transition-colors line-clamp-1">{show.movie?.title}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">{show.movie?.language || show.language}</span>
                                                    <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">{show.format}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Location & Time */}
                                    <td className="p-5 min-w-[200px]">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
                                                <MapPin size={14} className="text-blue-400"/> {show.theater?.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Calendar size={12} className="text-primary"/> 
                                                <span>{new Date(show.showDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at {new Date(show.showDateTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 3. Seat Availability */}
                                    <td className="p-5 min-w-[200px]">
                                        <div className="w-full max-w-[150px]">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-400">Available: <span className="text-white font-bold">{availableCount}</span></span>
                                                <span className="text-gray-400">Booked: <span className="text-white font-bold">{bookedCount}</span></span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                                                <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${percentFull}%` }}></div>
                                                <div className="h-full bg-gray-700" style={{ width: `${100 - percentFull}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1 text-right">{percentFull.toFixed(0)}% Occupancy</p>
                                        </div>
                                    </td>

                                    {/* 4. Financial Projections */}
                                    <td className="p-5 min-w-[200px]">
                                        <div className="w-full max-w-[150px]">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500 uppercase tracking-wider font-bold text-[9px]">Actual Gross</span>
                                                <span className="text-emerald-400 font-bold">₹{actualRevenue}</span>
                                            </div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-500 uppercase tracking-wider font-bold text-[9px]">Max Potential</span>
                                                <span className="text-gray-300 font-bold">₹{maxRevenue}</span>
                                            </div>
                                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${revPercent}%` }}></div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 5. Actions */}
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => setViewingShow(show)}
                                                className="group/btn relative p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 transition-colors text-blue-500 hover:text-white border border-blue-500/20"
                                                title="View Seat Layout & Guests"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button 
                                                onClick={() => deleteShow(show._id)}
                                                className="group/btn relative p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500 transition-colors text-red-500 hover:text-white border border-red-500/20"
                                                title="Delete Show"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
             </table>

             {/* --- PAGINATION CONTROLS --- */}
             {totalPages > 1 && (
                 <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
                     <span className="text-xs text-gray-500 font-bold">
                         Showing {(currentPage - 1) * showsPerPage + 1} - {Math.min(currentPage * showsPerPage, filteredShows.length)} of {filteredShows.length}
                     </span>
                     <div className="flex gap-2">
                         <button 
                             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                             disabled={currentPage === 1}
                             className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                         >
                             <ChevronLeft size={16}/>
                         </button>
                         <button 
                             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                             disabled={currentPage === totalPages}
                             className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                         >
                             <ChevronRight size={16}/>
                         </button>
                     </div>
                 </div>
             )}

         </div>
      </div>
    </div>
  ) : <Loading />
}

export default ListShows