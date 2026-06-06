import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Calendar, Clock, MapPin, CreditCard, Ticket, Sparkles, CupSoda, Tag, 
    ArrowRight, CheckCircle2, AlertCircle, Loader2, X, Plus, Minus, Popcorn, Receipt
} from 'lucide-react';
import Title from '../components/admin/Title';

import MockPaymentModal from '../components/MockPaymentModal'; 

// --- PREMIUM REWARD POPUP FUNCTION ---
const showCoinRewardToast = (coinsEarned) => {
    toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-[90vw] sm:max-w-sm w-full mx-auto sm:mx-0 bg-gradient-to-br from-gray-900 via-[#121212] to-black shadow-[0_20px_50px_rgba(234,179,8,0.2)] rounded-2xl pointer-events-auto flex ring-1 ring-yellow-500/50 overflow-hidden relative group mt-4 sm:mt-0`}>
            <div className="absolute inset-0 bg-yellow-500/10 blur-2xl group-hover:bg-yellow-500/20 transition-colors duration-500"></div>
            <div className="flex-1 w-0 p-4 sm:p-5 relative z-10">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-bounce">
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-950" />
                        </div>
                    </div>
                    <div className="ml-3 sm:ml-4 flex-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5 sm:mb-1">Reward Unlocked</p>
                        <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-black text-white leading-tight">
                            You earned <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">{coinsEarned} Coins</span>
                        </p>
                        <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-gray-400 font-medium">Added directly to your wallet.</p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-800 relative z-10 bg-black/20">
                <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-2xl p-3 sm:p-4 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors focus:outline-none">
                    <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
            </div>
        </div>
    ), { duration: 5000, position: 'top-center' });
};

const Checkout = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user, axios, getToken } = useAppContext();

    const { show, selectedSeats, isSurgeActive, surgeMultiplier } = state || {};

    const [paymentMethod, setPaymentMethod] = useState('ONLINE');
    const [appliedReward, setAppliedReward] = useState(null); 
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Dynamic Data
    const [offers, setOffers] = useState([]);
    const [availableSnacks, setAvailableSnacks] = useState([]);
    const [userPoints, setUserPoints] = useState(0);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // Snack Cart State: { snackId: quantity }
    const [snackCart, setSnackCart] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        if (!show || !selectedSeats || selectedSeats.length === 0) {
            navigate('/');
            return;
        }

        const fetchCheckoutData = async () => {
            try {
                const token = await getToken();
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // 🚨 SOFTER EXTRACTION 🚨
                // Find the ID, but don't panic if it's missing.
                let theaterId = show?.theater?._id || show?.theater?.id || show?.theaterId;
                if (!theaterId && typeof show?.theater === 'string') {
                    theaterId = show.theater;
                }
                
                const profilePromise = axios.get('/api/user/profile', config).catch(e => ({ data: { success: false } }));
                const offersPromise = axios.get('/api/offers/active', config).catch(e => ({ data: { success: false } }));
                
                // Only fetch snacks if we successfully extracted the theaterId. 
                // If it fails, we gracefully skip snacks instead of breaking the checkout.
                let snacksPromise = Promise.resolve({ data: { success: false } });
                if (theaterId) {
                    snacksPromise = axios.get(`/api/snacks/list?theaterId=${theaterId}`, config).catch(e => ({ data: { success: false } }));
                } else {
                    console.warn("Theater ID missing. Skipping localized F&B menu load.");
                }

                const [profileRes, offersRes, snacksRes] = await Promise.all([profilePromise, offersPromise, snacksPromise]);
                
                if (profileRes.data?.success && profileRes.data.user) {
                    setUserPoints(profileRes.data.user.coins || profileRes.data.user.loyaltyPoints || 0);
                }
                if (offersRes.data?.success) {
                    setOffers(offersRes.data.offers || []);
                }
                if (snacksRes.data?.success) {
                    setAvailableSnacks(snacksRes.data.snacks || []);
                }
            } catch (error) {
                console.error("Failed to load checkout data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user) fetchCheckoutData();
    }, [show, selectedSeats, navigate, user, axios, getToken]);

    if (!show) return null;

    // --- SNACK CART HANDLERS ---
    const addSnack = (snackId) => {
        setSnackCart(prev => ({ ...prev, [snackId]: (prev[snackId] || 0) + 1 }));
    };

    const removeSnack = (snackId) => {
        setSnackCart(prev => {
            const newCart = { ...prev };
            if (newCart[snackId] > 1) {
                newCart[snackId]--;
            } else {
                delete newCart[snackId];
            }
            return newCart;
        });
    };

    // --- MATH & CALCULATIONS ---
    const getSeatPrice = (seat) => {
        const row = seat.charAt(0).toUpperCase();
        
        // Support for dynamic seating config if available
        const config = show.seatingConfig || show.theater?.seatingConfig || null;
        if (config && config.length > 0) {
            const tierConfig = config.find(c => c.rows.includes(row));
            if (tierConfig) return show.ticketPrice[tierConfig.priceKey] || 0;
        }

        // Fallback
        if(['A','B','C'].includes(row)) return show.ticketPrice.plaza || 150; 
        if(['D','E','F','G'].includes(row)) return show.ticketPrice.premium || 200;
        return show.ticketPrice.royal || 300;
    }

    const ticketsTotal = selectedSeats.reduce((sum, seat) => sum + Math.round(getSeatPrice(seat) * (surgeMultiplier || 1.0)), 0);
    
    const snacksTotal = Object.entries(snackCart).reduce((sum, [snackId, qty]) => {
        const snack = availableSnacks.find(s => s._id === snackId);
        return sum + (snack ? snack.price * qty : 0);
    }, 0);

    const rawSubtotal = ticketsTotal + snacksTotal;
    const convenienceFee = paymentMethod === 'VENUE' ? 50 : 0; 

    let discountAmount = 0;
    if (appliedReward) {
        if (appliedReward.type === 'DISCOUNT') {
            discountAmount = appliedReward.value; 
        } else if (appliedReward.type === 'PERCENTAGE') {
            discountAmount = Math.round(rawSubtotal * (appliedReward.value / 100)); 
        }
    }

    const finalTotal = Math.max(0, rawSubtotal + convenienceFee - discountAmount);
    const pointsEarned = Math.floor(finalTotal * 0.05);

    // --- HANDLERS ---
    const handleRewardToggle = (reward) => {
        if (userPoints < reward.cost) return toast.error("Not enough points!");
        if (appliedReward?._id === reward._id) {
            setAppliedReward(null); 
        } else {
            setAppliedReward(reward); 
        }
    };

    const handleInitialCheckout = () => {
        if (!user) return toast.error("Please log in to continue");
        if (paymentMethod === 'ONLINE') {
            setShowPaymentModal(true);
        } else {
            finalizeBooking();
        }
    };

    const finalizeBooking = async (transactionData = null) => {
        setShowPaymentModal(false); 
        setIsProcessing(true);
        
        const formattedSnacks = Object.entries(snackCart).map(([id, quantity]) => {
            const snackDetails = availableSnacks.find(s => s._id === id);
            return {
                snackId: id,
                name: snackDetails?.name || "Snack",
                price: snackDetails?.price || 0,
                quantity
            };
        });

        try {
            const payload = {
                showId: show._id,
                selectedSeats,
                paymentMethod,
                appliedRewardId: appliedReward?._id, 
                transactionId: transactionData?.transactionId,
                snacks: formattedSnacks 
            };

            const { data } = await axios.post('/api/bookings/create', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                toast.success(paymentMethod === 'ONLINE' ? "Payment Successful!" : "Booking Confirmed!");
                if (data.pointsEarned > 0 || pointsEarned > 0) {
                    showCoinRewardToast(data.pointsEarned || pointsEarned);
                }
                navigate('/my-bookings'); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Checkout failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const getOfferIcon = (type) => {
        if (type === 'PERCENTAGE') return Ticket;
        if (type === 'F&B') return CupSoda;
        return Tag; 
    };

    const getOfferStyles = (type) => {
        if (type === 'PERCENTAGE') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        if (type === 'F&B') return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    };

    return (
        <div className="max-w-6xl mx-auto pt-20 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 font-outfit text-white animate-fadeIn">
            <div className="mb-6 sm:mb-8">
                <Title text1="Secure" text2="Checkout" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 sm:mt-8">
                
                {/* LEFT COLUMN - REWARDS, SNACKS & PAYMENT */}
                <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                    
                    {/* --- SNACKS SECTION --- */}
                    <div className="bg-[#121212] rounded-2xl sm:rounded-3xl border border-gray-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-5 sm:mb-6">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
                                    <Popcorn className="text-orange-400 sm:w-5 sm:h-5 w-4 h-4"/> Grab some Snacks
                                </h3>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Pre-book your F&B and skip the queue.</p>
                            </div>
                        </div>

                        {isLoadingData ? (
                            <div className="flex justify-center items-center py-6 sm:py-8"><Loader2 size={24} className="animate-spin text-gray-600"/></div>
                        ) : availableSnacks.length === 0 ? (
                            <div className="bg-[#1a1a1a] border border-gray-800 border-dashed rounded-xl p-6 sm:p-8 text-center">
                                <p className="text-xs sm:text-sm text-gray-500 italic">No snacks available for this cinema location.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {availableSnacks.map((snack) => {
                                    const qty = snackCart[snack._id] || 0;
                                    return (
                                        <div key={snack._id} className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${qty > 0 ? 'border-orange-500/50 bg-orange-500/5 shadow-lg' : 'border-gray-800 bg-[#1a1a1a]'}`}>
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                                                <img src={snack.image} alt={snack.name} className="w-full h-full object-cover" onError={(e)=>e.target.style.display='none'}/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs sm:text-sm truncate pr-1">{snack.name}</p>
                                                <p className="text-[10px] sm:text-xs text-orange-400 font-mono font-bold mt-0.5 mb-1.5 sm:mb-2">₹{snack.price}</p>
                                                <div className="flex items-center gap-2">
                                                    {qty === 0 ? (
                                                        <button onClick={() => addSnack(snack._id)} className="text-[9px] sm:text-[10px] font-bold uppercase bg-white/5 hover:bg-orange-500 text-white px-2.5 sm:px-3 py-1.5 rounded-md transition-colors w-full border border-white/10 hover:border-orange-500">Add +</button>
                                                    ) : (
                                                        <div className="flex items-center justify-between bg-orange-500/20 border border-orange-500/30 rounded-md p-0.5 w-full">
                                                            <button onClick={() => removeSnack(snack._id)} className="p-1 sm:p-1.5 text-orange-400 hover:text-white hover:bg-orange-500 rounded"><Minus size={12} className="sm:w-3.5 sm:h-3.5"/></button>
                                                            <span className="font-bold text-xs sm:text-sm text-white">{qty}</span>
                                                            <button onClick={() => addSnack(snack._id)} className="p-1 sm:p-1.5 text-orange-400 hover:text-white hover:bg-orange-500 rounded"><Plus size={12} className="sm:w-3.5 sm:h-3.5"/></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* REWARDS */}
                    <div className="bg-[#121212] rounded-2xl sm:rounded-3xl border border-gray-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 mb-5 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                                <Sparkles className="text-yellow-400 sm:w-5 sm:h-5 w-4 h-4"/> Loyalty Redemption
                            </h3>
                            <div className="sm:text-right bg-[#1a1a1a] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-gray-800 sm:border-0 flex justify-between sm:block items-center">
                                <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-bold tracking-widest">Wallet Balance</p>
                                <p className="text-lg sm:text-xl font-black text-yellow-400">{userPoints} pts</p>
                            </div>
                        </div>

                        {offers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {offers.map((reward) => {
                                    const isLocked = userPoints < reward.cost;
                                    const isSelected = appliedReward?._id === reward._id;
                                    const styles = getOfferStyles(reward.type);
                                    const Icon = getOfferIcon(reward.type);
                                    return (
                                        <div key={reward._id} onClick={() => !isLocked && handleRewardToggle(reward)} className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${isLocked ? 'opacity-40 grayscale cursor-not-allowed border-gray-800' : isSelected ? `${styles.bg} ${styles.border} scale-[1.02]` : 'bg-[#1a1a1a] border-gray-700 hover:border-gray-500'}`}>
                                            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                                                <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${styles.bg} ${styles.color}`}><Icon size={16} className="sm:w-[18px] sm:h-[18px]"/></div>
                                                <p className="font-bold text-xs sm:text-sm leading-tight pr-1">{reward.title}</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/5">
                                                <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase">{reward.type}</span>
                                                <span className={`text-[10px] sm:text-xs font-bold ${isLocked ? 'text-red-400' : 'text-yellow-400'}`}>{reward.cost} pts</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : <p className="text-center py-3 sm:py-4 text-gray-600 text-xs sm:text-sm italic">No active rewards.</p>}
                    </div>

                    {/* PAYMENT METHOD */}
                    <div className="bg-[#121212] rounded-2xl sm:rounded-3xl border border-gray-800 p-5 sm:p-6 shadow-xl">
                        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-4 sm:mb-6"><CreditCard className="text-blue-400 sm:w-5 sm:h-5 w-4 h-4"/> Payment Method</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <button onClick={() => setPaymentMethod('ONLINE')} className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-row sm:flex-col items-center justify-center sm:gap-2 transition-all gap-3 ${paymentMethod === 'ONLINE' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]' : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                                <CreditCard size={20} className="sm:w-6 sm:h-6 shrink-0"/> <span className="font-bold text-xs sm:text-sm">Online Pay</span>
                            </button>
                            <button onClick={() => setPaymentMethod('VENUE')} className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-row sm:flex-col items-center justify-center sm:gap-2 transition-all gap-3 ${paymentMethod === 'VENUE' ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[inset_0_0_10px_rgba(249,115,22,0.1)]' : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                                <MapPin size={20} className="sm:w-6 sm:h-6 shrink-0"/> <span className="font-bold text-xs sm:text-sm">Pay at Venue</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - BILLING INVOICE */}
                <div className="lg:col-span-5">
                    <div className="bg-[#121212] rounded-2xl sm:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden sticky top-20 sm:top-28">
                        <div className="h-28 sm:h-32 md:h-40 relative bg-gray-900 border-b border-gray-800">
                            <img src={show.movie.backdrop_path || show.movie.poster_path} alt="" className="w-full h-full object-cover opacity-40"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
                            <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 right-4 sm:right-6">
                                <h2 className="text-lg sm:text-xl md:text-2xl font-black truncate text-white drop-shadow-md">{show.movie.title}</h2>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{show.language} • {show.format}</p>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                            <div className="space-y-1.5 sm:space-y-2">
                                <p className="text-xs sm:text-sm flex items-center gap-2 text-gray-300"><MapPin size={14} className="text-primary shrink-0"/> <span className="truncate">{show.theater?.name || "Cinema"}</span></p>
                                <p className="text-xs sm:text-sm flex items-center gap-2 text-gray-300"><Calendar size={14} className="text-blue-400 shrink-0"/> <span className="truncate">{new Date(show.showDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span></p>
                            </div>

                            <div className="bg-[#1a1a1a] p-3 sm:p-4 rounded-xl border border-gray-800">
                                <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase mb-1.5 sm:mb-2">Seats Selected ({selectedSeats.length})</p>
                                <p className="text-base sm:text-lg font-black tracking-widest text-white leading-tight">{selectedSeats.join(', ')}</p>
                            </div>

                            <div className="space-y-2.5 sm:space-y-3 pt-4 border-t border-gray-800">
                                <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2 mb-3 sm:mb-4"><Receipt size={12}/> Invoice Details</p>
                                <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                                    <span>Tickets ({selectedSeats.length}x)</span>
                                    <span className="font-mono">₹{ticketsTotal}</span>
                                </div>
                                {isSurgeActive && <p className="text-[9px] sm:text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> Dynamic Surge Applied</p>}
                                
                                {Object.entries(snackCart).map(([id, qty]) => {
                                    const snack = availableSnacks.find(s => s._id === id);
                                    return snack && <div key={id} className="flex justify-between text-xs sm:text-sm text-gray-400 italic"><span className="truncate pr-2">{qty}x {snack.name}</span><span className="font-mono shrink-0">₹{snack.price * qty}</span></div>
                                })}

                                {convenienceFee > 0 && <div className="flex justify-between text-xs sm:text-sm text-gray-400"><span>Venue Fee</span><span className="font-mono">₹{convenienceFee}</span></div>}
                                
                                {appliedReward && <div className="flex justify-between items-center text-xs sm:text-sm text-emerald-400 font-bold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20 mt-1 sm:mt-2"><span className="truncate pr-2"><Tag size={10} className="inline mr-1 sm:w-3 sm:h-3"/> {appliedReward.title}</span><span className="font-mono shrink-0">-₹{discountAmount}</span></div>}
                            </div>

                            <div className="flex justify-between items-end pt-4 sm:pt-5 border-t border-gray-800">
                                <div>
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase mb-0.5 sm:mb-1">Total Bill</p>
                                    <p className="text-3xl sm:text-4xl font-black text-white font-mono">₹{finalTotal}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase mb-0.5 sm:mb-1">Earn</p>
                                    <p className="text-xs sm:text-sm font-bold text-yellow-400">{pointsEarned} pts</p>
                                </div>
                            </div>

                            <button onClick={handleInitialCheckout} disabled={isProcessing} className="w-full bg-gradient-to-r from-primary to-rose-600 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-50 mt-2 sm:mt-0">
                                {isProcessing ? <Loader2 className="animate-spin sm:w-5 sm:h-5 w-4 h-4"/> : <CheckCircle2 size={18} className="sm:w-5 sm:h-5"/>} <span className="drop-shadow-md">Confirm Order</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showPaymentModal && <MockPaymentModal amount={finalTotal} onClose={() => setShowPaymentModal(false)} onSuccess={finalizeBooking} />}
        </div>
    )
}

export default Checkout;