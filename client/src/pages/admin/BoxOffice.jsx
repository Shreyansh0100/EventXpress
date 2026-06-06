import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import { 
    MonitorPlay, Clock, Ticket as TicketIcon, CreditCard, Banknote, 
    CheckCircle2, Film, Printer, ArrowRight, Popcorn, Plus, Minus, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const BoxOffice = () => {
    const { axios, getToken } = useAppContext();
    const [shows, setShows] = useState([]);
    const [availableSnacks, setAvailableSnacks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // POS State
    const [activeTab, setActiveTab] = useState('SEATS'); // 'SEATS' or 'SNACKS'
    const [selectedShow, setSelectedShow] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [cartSnacks, setCartSnacks] = useState([]); // [{ ...snack, qty }]
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    
    // Processing States
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [completedTxn, setCompletedTxn] = useState(null);

    // Standard Cinema Seat Map
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    useEffect(() => {
        fetchPOSData();
    }, []);

    const fetchPOSData = async () => {
        try {
            const token = await getToken();
            const [showsRes, snacksRes] = await Promise.all([
                axios.get("/api/box-office/shows", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/snacks/my-menu", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (showsRes.data.success) setShows(showsRes.data.shows);
            if (snacksRes.data.success) setAvailableSnacks(snacksRes.data.snacks);
            
        } catch (error) {
            console.error("Fetch POS Data Error:", error);
            toast.error("Failed to load terminal data.");
        } finally {
            setLoading(false);
        }
    };

    // --- MEMOIZED CART MATH (Performance Upgrade) ---
    const ticketPrice = useMemo(() => selectedShow?.ticketPrice?.premium || 200, [selectedShow]);
    
    const ticketsTotal = useMemo(() => selectedSeats.length * ticketPrice, [selectedSeats.length, ticketPrice]);
    
    const snacksTotal = useMemo(() => {
        return cartSnacks.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }, [cartSnacks]);

    const grandTotal = useMemo(() => ticketsTotal + snacksTotal, [ticketsTotal, snacksTotal]);

    const totalItemsCount = useMemo(() => {
        return cartSnacks.reduce((sum, s) => sum + s.qty, 0);
    }, [cartSnacks]);

    // --- SEAT LOGIC ---
    const isSeatOccupied = (seatId) => {
        const seats = selectedShow?.occupiedSeats;
        if (!seats) return false;
        // Handle Mongoose Map, Object, or Array safely
        if (typeof seats.has === 'function') return seats.has(seatId); 
        if (Array.isArray(seats)) return seats.includes(seatId);
        return !!seats[seatId]; 
    };

    const handleSeatClick = (seatId) => {
        if (isSeatOccupied(seatId)) return; 
        
        setSelectedSeats(prev => {
            if (prev.includes(seatId)) {
                return prev.filter(s => s !== seatId);
            }
            if (prev.length >= 10) {
                toast.error("Maximum 10 seats per transaction.");
                return prev;
            }
            return [...prev, seatId];
        });
    };

    // --- SNACK LOGIC ---
    const addSnack = (snack) => {
        setCartSnacks(prev => {
            const exists = prev.find(s => s._id === snack._id);
            if (exists) return prev.map(s => s._id === snack._id ? { ...s, qty: s.qty + 1 } : s);
            return [...prev, { ...snack, qty: 1 }];
        });
    };

    const removeSnack = (snackId) => {
        setCartSnacks(prev => {
            const exists = prev.find(s => s._id === snackId);
            if (!exists) return prev;
            if (exists.qty === 1) return prev.filter(s => s._id !== snackId);
            return prev.map(s => s._id === snackId ? { ...s, qty: s.qty - 1 } : s);
        });
    };

    const getSnackQty = (snackId) => {
        const item = cartSnacks.find(s => s._id === snackId);
        return item ? item.qty : 0;
    };

    // --- CHECKOUT ---
    const handleCheckout = async (paymentMethod) => {
        if (selectedSeats.length === 0 && cartSnacks.length === 0) {
            return toast.error("Cart is empty.");
        }
        if (selectedSeats.length === 0 && selectedShow) {
            return toast.error("Select at least one seat for the feature.");
        }
        
        setIsProcessing(true);
        try {
            const token = await getToken();
            
            // Format snacks
            const orderedSnacks = cartSnacks.map(s => ({ 
                snackId: s._id, 
                name: s.name, 
                price: s.price, 
                quantity: s.qty 
            }));

            const { data } = await axios.post("/api/bookings/create", {
                showId: selectedShow?._id,
                selectedSeats: selectedSeats, 
                amount: grandTotal,
                paymentMethod: paymentMethod, 
                guestName: customerName || 'Walk-in Guest',
                guestEmail: customerEmail,
                guestPhone: customerPhone,
                snacks: orderedSnacks,
                isPosTransaction: true // <-- CRITICAL FIX: Stops Cashier from getting loyalty coins
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(`Transaction Complete!`);
                setCompletedTxn({
                    bookingId: data.booking._id,
                    seats: [...selectedSeats],
                    snacks: [...cartSnacks], 
                    amount: grandTotal,
                    guestName: customerName || 'Walk-in Guest',
                    method: paymentMethod,
                    show: selectedShow,
                    date: new Date()
                });
                fetchPOSData(); // Refresh seat availability immediately
            } else {
                toast.error(data.message || "Transaction failed.");
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            toast.error(error.response?.data?.message || "Network Error. Check connection.");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTerminal = () => {
        setCompletedTxn(null);
        setSelectedSeats([]);
        setCartSnacks([]);
        setSelectedShow(null);
        setActiveTab('SEATS');
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
    };

    // --- GENERATE PDF TICKET ---
    const generateAndPrintTicket = async () => {
        if (!completedTxn || isPrinting) return;
        
        setIsPrinting(true);
        try {
            const doc = new jsPDF();
            const qrCodeDataUrl = await QRCode.toDataURL(completedTxn.bookingId, { errorCorrectionLevel: 'L', margin: 2, width: 300 });
            const bookingIdShort = completedTxn.bookingId.slice(-8).toUpperCase();
            const showDate = completedTxn.show ? new Date(completedTxn.show.showDateTime).toDateString() : 'N/A';
            const showTime = completedTxn.show ? new Date(completedTxn.show.showDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
            const txnTicketPrice = completedTxn.show ? (completedTxn.show.ticketPrice?.premium || 200) : 0;
            const txnTicketsTotal = completedTxn.seats.length * txnTicketPrice;

            // Header
            doc.setFillColor(10, 10, 10); doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(234, 88, 12); doc.setFontSize(26); doc.setFont("helvetica", "bold");
            doc.text("EventXpress Box Office", 15, 25);
            doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal");
            doc.text("Official Ticket & Receipt", 145, 25);

            // Guest Info
            doc.setTextColor(0, 0, 0); let y = 55;
            doc.setFontSize(10); doc.setTextColor(100);
            doc.text("Issued To:", 15, y); doc.text("Transaction Details:", 130, y);
            
            y += 7;
            doc.setFontSize(11); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(completedTxn.guestName, 15, y);
            doc.text(`ID: TXN-${bookingIdShort}`, 130, y);
            
            y += 6;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            doc.text("Counter Sale / Walk-in", 15, y);
            doc.text(`Date: ${completedTxn.date.toLocaleDateString()}`, 130, y);

            // Movie Block
            if (completedTxn.show) {
                y += 20;
                doc.setDrawColor(230); doc.setFillColor(250, 250, 250); doc.roundedRect(15, y, 180, 50, 3, 3, 'FD');
                doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
                doc.text(completedTxn.show.movie?.title || 'Unknown Feature', 25, y+16);
                doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
                doc.text(`${showDate} | ${showTime}`, 25, y+28);
                const movieFormat = completedTxn.show.format || '2D';
                doc.text(`Format: ${movieFormat.toUpperCase()}`, 25, y+36);
                
                doc.setFillColor(234, 88, 12); doc.roundedRect(140, y+15, 45, 14, 2, 2, 'F');
                doc.setTextColor(255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
                doc.text(`Seats: ${completedTxn.seats.join(', ')}`, 162.5, y+24, {align: 'center'});
                y += 60;
            } else {
                y += 20;
            }

            // Itemized Billing Block
            doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text("Itemized Receipt:", 15, y);
            y += 8;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);

            if (completedTxn.seats.length > 0) {
                doc.text(`${completedTxn.seats.length}x Feature Ticket (@ Rs. ${txnTicketPrice})`, 15, y);
                doc.text(`Rs. ${txnTicketsTotal}.00`, 180, y, {align: 'right'});
                y += 6;
            }

            if (completedTxn.snacks?.length > 0) {
                completedTxn.snacks.forEach(snack => {
                    doc.text(`${snack.qty}x ${snack.name} (@ Rs. ${snack.price})`, 15, y);
                    doc.text(`Rs. ${snack.qty * snack.price}.00`, 180, y, {align: 'right'});
                    y += 6;
                });
            }

            y += 4;
            doc.setDrawColor(200); doc.line(15, y, 195, y);
            y += 8;

            // Final Total
            doc.setFontSize(10); doc.setTextColor(0);
            doc.text("Payment Method:", 15, y); 
            doc.text(completedTxn.method === 'VENUE' ? 'Cash at Counter' : 'Card Terminal', 15, y+6);
            
            doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12);
            doc.text(`Total Paid: Rs. ${completedTxn.amount}.00`, 180, y+4, {align: 'right'});

            // QR Code
            y += 25; doc.addImage(qrCodeDataUrl, 'PNG', 85, y, 40, 40);
            y += 45; doc.setTextColor(100); doc.setFontSize(9); doc.setFont("helvetica", "normal");
            doc.text("Present this QR code to the gate staff for entry.", 105, y, {align: 'center'});

            doc.save(`Ticket_Receipt_${bookingIdShort}.pdf`);
            toast.success("Detailed Receipt generated!");
        } catch (error) { 
            console.error("PDF Generation Error:", error); 
            toast.error("Failed to generate PDF."); 
        } finally {
            setIsPrinting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="pb-20 font-outfit text-white animate-fadeIn min-h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] flex flex-col relative px-4 sm:px-6 lg:px-8 pt-6 max-w-[1600px] mx-auto">
            
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 shrink-0 gap-4">
                <div>
                    <Title text1="POS" text2="Terminal" />
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium">Unified walk-in ticketing & concessions register.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-gray-800 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 sm:gap-3 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-300">Register Active</span>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
                
                {/* LEFT: Show Selection */}
                <div className="lg:col-span-3 bg-[#0a0a0a] border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-lg h-[300px] lg:h-full">
                    <div className="p-3 sm:p-4 border-b border-gray-800 bg-[#121212] shrink-0">
                        <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <MonitorPlay size={14}/> Today's Shows
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 custom-scrollbar">
                        {shows.length === 0 ? (
                            <p className="text-gray-500 text-xs text-center mt-10">No active shows.</p>
                        ) : (
                            shows.map(show => (
                                <button 
                                    key={show._id}
                                    onClick={() => { setSelectedShow(show); setSelectedSeats([]); setActiveTab('SEATS'); }}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selectedShow?._id === show._id 
                                        ? 'bg-orange-500/10 border-orange-500/50 text-white shadow-inner' 
                                        : 'bg-[#121212] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                                    }`}
                                >
                                    <p className="font-bold text-xs sm:text-sm truncate mb-1.5">{show.movie?.title || "Unknown Feature"}</p>
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                        <span className="flex items-center gap-1 font-mono text-emerald-400"><Clock size={12}/> {new Date(show.showDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className="border border-gray-700 px-1.5 py-0.5 rounded uppercase">{show.format}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* MIDDLE: Seat Map OR Snacks Toggle */}
                <div className="lg:col-span-6 bg-[#0a0a0a] border border-gray-800 rounded-xl flex flex-col overflow-hidden relative shadow-lg min-h-[400px] lg:min-h-0 lg:h-full">
                    {!selectedShow && cartSnacks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50 p-6 text-center">
                            <Film size={48} className="mb-4" />
                            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest">Select a feature to begin transaction</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex border-b border-gray-800 bg-[#121212] shrink-0">
                                <button 
                                    onClick={() => setActiveTab('SEATS')} 
                                    className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 ${activeTab === 'SEATS' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <TicketIcon size={16}/> Select Seats
                                </button>
                                <button 
                                    onClick={() => setActiveTab('SNACKS')} 
                                    className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 ${activeTab === 'SNACKS' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <Popcorn size={16}/> Concessions (F&B)
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto bg-[#050505] custom-scrollbar relative">
                                {/* TAB 1: SEAT MAP */}
                                {activeTab === 'SEATS' && (
                                    <div className="p-4 sm:p-6 flex flex-col items-center">
                                        <div className="w-full flex justify-between items-center mb-6 sm:mb-8 bg-[#121212] p-3 sm:p-4 rounded-lg border border-gray-800">
                                            <div className="min-w-0 pr-3">
                                                <h3 className="text-xs sm:text-sm font-bold text-white truncate">{selectedShow?.movie?.title || "No Feature Selected"}</h3>
                                                <p className="text-[10px] sm:text-xs text-gray-400 font-mono truncate">{selectedShow ? new Date(selectedShow.showDateTime).toLocaleString() : ""}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ticket Price</p>
                                                <p className="text-base sm:text-lg font-mono text-emerald-400">₹{ticketPrice}</p>
                                            </div>
                                        </div>

                                        {/* SCROLLABLE SEAT MAP CONTAINER FOR MOBILE */}
                                        <div className="w-full overflow-x-auto custom-scrollbar pb-6">
                                            <div className="min-w-[450px] flex flex-col items-center mx-auto px-2">
                                                <div className="w-full max-w-md mb-8 sm:mb-12 relative">
                                                    <div className="h-1 bg-gray-600 w-full rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.1)]"></div>
                                                    <p className="text-center text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[10px] mt-4 font-bold">Screen</p>
                                                </div>

                                                <div className="flex flex-col gap-2 sm:gap-3">
                                                    {rows.map(row => (
                                                        <div key={row} className="flex justify-center items-center gap-1.5 sm:gap-3">
                                                            <span className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-600 font-mono">{row}</span>
                                                            {cols.map(col => {
                                                                const seatId = `${row}${col}`;
                                                                const isOccupied = isSeatOccupied(seatId);
                                                                const isSelected = selectedSeats.includes(seatId);

                                                                return (
                                                                    <button
                                                                        key={seatId}
                                                                        onClick={() => handleSeatClick(seatId)}
                                                                        disabled={isOccupied}
                                                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm border transition-all text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0
                                                                            ${isOccupied 
                                                                                ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed' 
                                                                                : isSelected 
                                                                                    ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)] scale-110' 
                                                                                    : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800'}
                                                                        `}
                                                                    >
                                                                        {col}
                                                                    </button>
                                                                );
                                                            })}
                                                            <span className="w-4 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-600 font-mono">{row}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: SNACKS MENU */}
                                {activeTab === 'SNACKS' && (
                                    <div className="p-4 sm:p-6">
                                        {availableSnacks.length === 0 ? (
                                            <div className="text-center text-gray-500 py-10 text-xs sm:text-sm">No snacks available in database.</div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                                                {availableSnacks.map(snack => {
                                                    const qty = getSnackQty(snack._id);
                                                    return (
                                                        <div key={snack._id} className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${qty > 0 ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-800 bg-[#1a1a1a]'}`}>
                                                            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-gray-900">
                                                                <img src={snack.image || "https://via.placeholder.com/150?text=Snack"} alt={snack.name} className="w-full h-full object-cover opacity-80" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs sm:text-sm font-bold text-gray-200 truncate">{snack.name}</p>
                                                                <p className="text-[10px] sm:text-xs text-emerald-400 font-mono font-medium mb-1.5 sm:mb-0">₹{snack.price}</p>
                                                                
                                                                {/* Add/Remove Controls */}
                                                                {qty === 0 ? (
                                                                    <button 
                                                                        onClick={() => addSnack(snack)}
                                                                        className="w-full mt-auto py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 border border-gray-700 text-white rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                                                                    >
                                                                        <Plus size={14}/> Add
                                                                    </button>
                                                                ) : (
                                                                    <div className="w-full mt-auto flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-lg overflow-hidden">
                                                                        <button onClick={() => removeSnack(snack._id)} className="p-1.5 sm:p-2 text-orange-500 hover:bg-orange-500/20 transition-colors"><Minus size={14}/></button>
                                                                        <span className="font-bold text-xs sm:text-sm px-2 text-white">{qty}</span>
                                                                        <button onClick={() => addSnack(snack)} className="p-1.5 sm:p-2 text-orange-500 hover:bg-orange-500/20 transition-colors"><Plus size={14}/></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT: Register Cart */}
                <div className="lg:col-span-3 bg-[#0a0a0a] border border-gray-800 rounded-xl flex flex-col overflow-hidden shadow-lg lg:h-full">
                    <div className="p-3 sm:p-4 border-b border-gray-800 bg-[#121212] shrink-0">
                        <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Banknote size={14}/> Transaction Cart
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col custom-scrollbar">
                        <div className="space-y-5 sm:space-y-6 flex-1">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-500">Guest Name (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Walk-in Guest"
                                        className="w-full bg-transparent border-b border-gray-700 text-white py-1.5 sm:py-2 text-xs sm:text-sm outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-500">Email (Optional)</label>
                                    <input 
                                        type="email" 
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="guest@mail.com"
                                        className="w-full bg-transparent border-b border-gray-700 text-white py-1.5 sm:py-2 text-xs sm:text-sm outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-500">Phone (Optional)</label>
                                    <input 
                                        type="tel" 
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="+91..."
                                        className="w-full bg-transparent border-b border-gray-700 text-white py-1.5 sm:py-2 text-xs sm:text-sm outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4 bg-[#121212] p-3 sm:p-4 rounded-lg border border-gray-800 shadow-inner">
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1.5 sm:pb-2 mb-2 flex justify-between">
                                        <span>Tickets ({selectedSeats.length})</span>
                                        <span className="text-gray-300">₹{ticketsTotal}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedSeats.length === 0 ? <span className="text-[10px] sm:text-xs text-gray-600">None selected</span> : 
                                            selectedSeats.map(seat => <span key={seat} className="bg-white/10 text-white px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono">{seat}</span>)
                                        }
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1.5 sm:pb-2 mb-2 mt-3 sm:mt-4 flex justify-between">
                                        <span>Concessions ({totalItemsCount})</span>
                                        <span className="text-gray-300">₹{snacksTotal}</span>
                                    </p>
                                    <div className="space-y-1.5 max-h-24 sm:max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                        {cartSnacks.length === 0 ? <span className="text-[10px] sm:text-xs text-gray-600">None added</span> : 
                                            cartSnacks.map(item => (
                                                <div key={item._id} className="flex justify-between text-[10px] sm:text-xs text-gray-300">
                                                    <span className="truncate pr-2">{item.qty}x {item.name}</span>
                                                    <span className="font-mono text-gray-500 shrink-0">₹{item.price * item.qty}</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-3 sm:pt-4 mt-5 sm:mt-6 shrink-0">
                            <div className="flex justify-between items-end mb-4 sm:mb-6">
                                <span className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-widest">Total Due</span>
                                <span className="text-2xl sm:text-3xl font-mono font-bold text-white">₹{grandTotal}</span>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                <button 
                                    onClick={() => handleCheckout('VENUE')}
                                    disabled={(selectedSeats.length === 0 && cartSnacks.length === 0) || isProcessing}
                                    className="w-full py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Banknote size={16} className="sm:w-[18px] sm:h-[18px]"/>} 
                                    {isProcessing ? 'Processing...' : 'Pay Cash'}
                                </button>
                                <button 
                                    onClick={() => handleCheckout('CARD_TERMINAL')} 
                                    disabled={(selectedSeats.length === 0 && cartSnacks.length === 0) || isProcessing}
                                    className="w-full py-3 sm:py-3.5 bg-transparent border border-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]"/>}
                                    {isProcessing ? 'Processing...' : 'Card Terminal'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SUCCESS RECEIPT MODAL */}
            {completedTxn && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-slideUp">
                        
                        <div className="p-6 sm:p-8 text-center bg-emerald-500/10 border-b border-gray-800">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 size={28} className="text-emerald-500 sm:w-8 sm:h-8" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Payment Complete</h2>
                            <p className="text-gray-400 text-xs sm:text-sm font-mono mt-1">TXN-{completedTxn.bookingId?.slice(-6).toUpperCase() || 'POS-SALE'}</p>
                        </div>

                        {/* DETAILED ITEMIZED BILLING SECTION */}
                        <div className="p-5 sm:p-6 max-h-[50vh] sm:max-h-[45vh] overflow-y-auto custom-scrollbar bg-[#050505]">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-800/50 mb-3 sm:mb-4">
                                <span className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Guest Info</span>
                                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[60%] text-right">{completedTxn.guestName}</span>
                            </div>

                            <span className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2 sm:mb-3 block">Itemized Bill</span>
                            
                            {/* Tickets Breakdown */}
                            {completedTxn.seats.length > 0 && (
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex justify-between items-start mb-1 text-xs sm:text-sm">
                                        <span className="text-gray-300">{completedTxn.seats.length}x Feature Ticket <span className="text-gray-500 text-[10px] sm:text-xs">(@ ₹{completedTxn.show?.ticketPrice?.premium || 200})</span></span>
                                        <span className="font-mono text-white">₹{completedTxn.seats.length * (completedTxn.show?.ticketPrice?.premium || 200)}</span>
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-orange-400 font-mono break-words">Seats: {completedTxn.seats.join(', ')}</div>
                                </div>
                            )}

                            {/* Snacks Breakdown */}
                            {completedTxn.snacks.length > 0 && (
                                <div className="space-y-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-800/30">
                                    {completedTxn.snacks.map((snack, index) => (
                                        <div key={index} className="flex justify-between items-start text-xs sm:text-sm">
                                            <span className="text-gray-300 pr-2">{snack.qty}x {snack.name} <span className="text-gray-500 text-[10px] sm:text-xs">(@ ₹{snack.price})</span></span>
                                            <span className="font-mono text-white shrink-0">₹{snack.qty * snack.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Grand Total Row */}
                            <div className="flex justify-between items-center mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-700">
                                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">Grand Total</span>
                                <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">₹{completedTxn.amount}</span>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 bg-[#121212] flex flex-col gap-2 sm:gap-3 border-t border-gray-800">
                            <button 
                                onClick={generateAndPrintTicket}
                                disabled={isPrinting}
                                className="w-full py-3 sm:py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} className="sm:w-[18px] sm:h-[18px]"/>}
                                {isPrinting ? 'Generating...' : 'Print Detailed Receipt'}
                            </button>
                            <button 
                                onClick={resetTerminal}
                                className="w-full py-3 sm:py-3.5 bg-transparent border border-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                Next Customer <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default BoxOffice;