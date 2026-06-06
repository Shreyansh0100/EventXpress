import React, { useState, useEffect } from 'react';
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Tag, Ticket, CupSoda, Plus, Power, Trash2, Loader2, Sparkles, 
    Edit2, X, Users, Wallet, Search, Gift, History, ArrowUpRight, 
    ArrowDownRight, MessageSquarePlus, Utensils, CheckIcon, 
    CalendarDays, ShieldAlert, IndianRupee, Popcorn, MapPin, Filter, Store
} from 'lucide-react';
import Title from '../../components/admin/Title';

const AdminOffers = () => {
    const { axios, getToken, user } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    
    // --- TABS STATE ---
    const [activeTab, setActiveTab] = useState('OFFERS'); // 'OFFERS' | 'SNACKS' | 'WALLETS'

    // --- OFFERS STATE (Admin manages these globally) ---
    const [offers, setOffers] = useState([]);
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [offerForm, setOfferForm] = useState({
        title: '', cost: '', type: 'DISCOUNT', value: '',
        minOrderValue: '', expiryDate: '', maxUses: '' 
    });

    // --- SNACKS & THEATERS STATE (Admin acts as Moderator here) ---
    const [snacks, setSnacks] = useState([]);
    const [theaters, setTheaters] = useState([]); 
    const [theaterFilter, setTheaterFilter] = useState('ALL'); 

    // --- WALLETS STATE ---
    const [platformUsers, setPlatformUsers] = useState([]);
    const [searchUser, setSearchUser] = useState('');
    const [viewingLedger, setViewingLedger] = useState(null);

    // ==========================================
    // DATA FETCHING (Loads everything for the Hub)
    // ==========================================
    const fetchData = async () => {
        try {
            const token = await getToken();
            const [offersRes, usersRes, snacksRes, theatersRes] = await Promise.all([
                axios.get('/api/offers/all', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/all-users', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/snacks/list?all=true', { headers: { Authorization: `Bearer ${token}` } }), 
                axios.get('/api/admin/all-theaters', { headers: { Authorization: `Bearer ${token}` } }) 
            ]);

            if (offersRes.data.success) setOffers(offersRes.data.offers);
            if (usersRes.data.success) setPlatformUsers(usersRes.data.users);
            if (snacksRes.data.success) setSnacks(snacksRes.data.snacks);
            if (theatersRes.data?.success) setTheaters(theatersRes.data.theaters);

        } catch (error) {
            toast.error("Failed to load Hub data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchData(); }, [user]);

    // ==========================================
    // 1. OFFERS LOGIC (Global Admin Control)
    // ==========================================
    const resetOfferForm = () => {
        setOfferForm({ title: '', cost: '', type: 'DISCOUNT', value: '', minOrderValue: '', expiryDate: '', maxUses: '' });
        setEditingOfferId(null);
    };

    const handleOfferSubmit = async (e) => {
        e.preventDefault();
        const { title, cost, type, value, minOrderValue, expiryDate, maxUses } = offerForm;
        
        if (!title || !cost || (type !== 'F&B' && !value)) return toast.error("Please fill core offer fields");

        setIsSubmittingOffer(true);
        try {
            const payload = { 
                title, cost: Number(cost), type, 
                value: type === 'F&B' ? 0 : Number(value),
                minOrderValue: Number(minOrderValue) || 0,
                expiryDate: expiryDate || null,
                maxUses: Number(maxUses) || null
            };
            
            let url = '/api/offers/create';
            if (editingOfferId) { url = '/api/offers/update'; payload.id = editingOfferId; }

            const { data } = await axios.post(url, payload, { headers: { Authorization: `Bearer ${await getToken()}` } });

            if (data.success) {
                toast.success(editingOfferId ? "Offer Updated!" : "Offer Created!");
                resetOfferForm(); fetchData(); 
            } else toast.error(data.message);
        } catch (error) { toast.error("Failed to save offer"); } 
        finally { setIsSubmittingOffer(false); }
    };

    const editOffer = (offer) => {
        setOfferForm({
            title: offer.title, cost: offer.cost.toString(), type: offer.type,
            value: offer.value ? offer.value.toString() : '',
            minOrderValue: offer.minOrderValue?.toString() || '',
            expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : '',
            maxUses: offer.maxUses?.toString() || ''
        });
        setEditingOfferId(offer._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleOffer = async (id) => {
        try {
            const { data } = await axios.post('/api/offers/toggle', { id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (data.success) { toast.success(data.message); fetchData(); } else toast.error(data.message);
        } catch (error) { toast.error("Status update failed"); }
    };

    const deleteOffer = async (id) => {
        if(!window.confirm("Permanently delete this offer?")) return;
        try {
            const { data } = await axios.post('/api/offers/delete', { id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (data.success) {
                toast.success("Offer Deleted!");
                if(editingOfferId === id) resetOfferForm(); 
                fetchData(); 
            } else toast.error(data.message);
        } catch (error) { toast.error("Delete failed"); }
    };

    // ==========================================
    // 2. SNACKS LOGIC (Moderator View Only)
    // ==========================================
    const deleteSnack = async (id) => {
        if(!window.confirm("Delete this snack uploaded by the cinema?")) return;
        try {
            const { data } = await axios.post('/api/snacks/delete', { id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if(data.success) { toast.success("Snack Deleted from network!"); fetchData(); }
        } catch (error) { toast.error("Delete failed"); }
    };

    const toggleSnackStock = async (id, currentState) => {
        try {
            const { data } = await axios.post('/api/snacks/toggle-stock', { id, isActive: !currentState }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (data.success) { toast.success(data.message); fetchData(); } else toast.error(data.message);
        } catch (error) { toast.error("Failed to update status"); }
    };

    // Extract theater name mapping
    const getTheaterName = (id) => {
        const theater = theaters.find(t => t._id === id || t._id === id?._id);
        return theater ? `${theater.name} (${theater.city})` : "Unknown Cinema";
    };

    const filteredSnacks = theaterFilter === 'ALL' 
        ? snacks 
        : snacks.filter(s => s.theaterId === theaterFilter || s.theaterId?._id === theaterFilter);


    // ==========================================
    // 3. WALLETS LOGIC
    // ==========================================
    const filteredUsers = platformUsers.filter(u => 
        u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase())
    );


    if (isLoading) return <Loading />;

    return (
        <div className="text-white min-h-screen pb-20 font-outfit">
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-6">
                <Title text1="Loyalty & F&B" text2="Hub" />
            </div>

            {/* --- CUSTOM TABS --- */}
            <div className="flex flex-wrap gap-4 md:gap-8 border-b border-gray-800 mb-8">
                <button onClick={() => setActiveTab('OFFERS')} className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${activeTab === 'OFFERS' ? 'border-b-2 border-primary text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Sparkles size={16}/> Reward Offers
                </button>
                <button onClick={() => setActiveTab('SNACKS')} className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${activeTab === 'SNACKS' ? 'border-b-2 border-primary text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Popcorn size={16}/> Cinema F&B Submissions
                </button>
                <button onClick={() => setActiveTab('WALLETS')} className={`pb-3 text-xs md:text-sm font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${activeTab === 'WALLETS' ? 'border-b-2 border-primary text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Wallet size={16}/> User Wallets
                </button>
            </div>

            {/* ===================================================================== */}
            {/* TAB 1: REWARD OFFERS MANAGEMENT (ADVANCED) */}
            {/* ===================================================================== */}
            {activeTab === 'OFFERS' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fadeIn">
                    
                    {/* LEFT: ADVANCED OFFER FORM */}
                    <div className="xl:col-span-5">
                        <div className={`bg-[#121212] border rounded-3xl p-6 shadow-2xl sticky top-24 transition-colors ${editingOfferId ? 'border-primary shadow-[0_0_30px_rgba(248,69,101,0.15)]' : 'border-gray-800'}`}>
                            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                    <div className={`p-2 rounded-xl ${editingOfferId ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'}`}>
                                        {editingOfferId ? <Edit2 size={20}/> : <Tag size={20}/>} 
                                    </div>
                                    {editingOfferId ? "Edit Reward Template" : "Generate New Reward"}
                                </h2>
                                {editingOfferId && (
                                    <button onClick={resetOfferForm} className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1.5 hover:bg-gray-700 hover:text-white transition font-bold">
                                        <X size={14}/> Cancel
                                    </button>
                                )}
                            </div>
                            
                            <form onSubmit={handleOfferSubmit} className="space-y-5">
                                {/* Core Fields */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reward Title</label>
                                    <input type="text" required placeholder="e.g. ₹50 Flat Discount on Next Movie" value={offerForm.title} onChange={(e)=>setOfferForm({...offerForm, title: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors shadow-inner"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Sparkles size={12}/> Cost (Coins)</label>
                                        <input type="number" required min="1" placeholder="e.g. 200" value={offerForm.cost} onChange={(e)=>setOfferForm({...offerForm, cost: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors shadow-inner"/>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Offer Type</label>
                                        <select value={offerForm.type} onChange={(e)=>setOfferForm({...offerForm, type: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-colors appearance-none cursor-pointer shadow-inner">
                                            <option value="DISCOUNT">Flat Discount (₹)</option>
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="F&B">Free Food/Drink</option>
                                        </select>
                                    </div>
                                </div>
                                {offerForm.type !== 'F&B' && (
                                    <div className="animate-fadeIn">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-primary">Discount Value</label>
                                        <input type="number" required min="1" placeholder={offerForm.type === 'DISCOUNT' ? "Amount in ₹ (e.g. 50)" : "Percentage % (e.g. 20)"} value={offerForm.value} onChange={(e)=>setOfferForm({...offerForm, value: e.target.value})} className="w-full bg-primary/5 border border-primary/30 rounded-xl px-4 py-3 text-primary font-bold focus:border-primary outline-none transition-colors shadow-inner"/>
                                    </div>
                                )}

                                {/* Advanced Features Section */}
                                <div className="pt-4 mt-2 border-t border-gray-800">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Advanced Constraints</p>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><IndianRupee size={10}/> Min Order Value</label>
                                            <input type="number" min="0" placeholder="Optional" value={offerForm.minOrderValue} onChange={(e)=>setOfferForm({...offerForm, minOrderValue: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-colors"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Users size={10}/> Global Usage Limit</label>
                                            <input type="number" min="1" placeholder="Optional (e.g. 100)" value={offerForm.maxUses} onChange={(e)=>setOfferForm({...offerForm, maxUses: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-colors"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CalendarDays size={10}/> Expiry Date</label>
                                        <input type="date" value={offerForm.expiryDate} onChange={(e)=>setOfferForm({...offerForm, expiryDate: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:border-primary outline-none transition-colors cursor-pointer [color-scheme:dark]"/>
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmittingOffer} className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 ${editingOfferId ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-gradient-to-r from-primary to-rose-600 hover:to-rose-500 shadow-[0_0_20px_rgba(248,69,101,0.3)]'}`}>
                                    {isSubmittingOffer ? <Loader2 className="animate-spin" size={20}/> : <>{editingOfferId ? <CheckIcon size={18}/> : <Plus size={18} strokeWidth={3}/>} {editingOfferId ? "Update Coupon" : "Generate Coupon"}</>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT: LIST OF OFFERS */}
                    <div className="xl:col-span-7">
                        <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 shadow-2xl min-h-[500px]">
                            <h2 className="text-lg font-bold mb-6 text-white flex justify-between items-center">
                                Active & Past Rewards
                                <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs font-bold border border-gray-700">Total: {offers.length}</span>
                            </h2>
                            
                            {offers.length === 0 ? (
                                <div className="text-center py-24 text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-[#1a1a1a]">
                                    <Tag size={40} className="mx-auto mb-3 opacity-30"/>
                                    <p>No rewards created yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {offers.map((offer) => (
                                        <div key={offer._id} className={`border rounded-2xl p-5 transition-all group relative ${editingOfferId === offer._id ? 'border-blue-500 bg-blue-500/5' : offer.isActive ? 'bg-[#1a1a1a] border-gray-700 hover:border-gray-500' : 'bg-[#0a0a0a] border-gray-900 opacity-60 grayscale'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-[#121212] rounded-xl border border-gray-800 shadow-inner">
                                                        {offer.type === 'PERCENTAGE' ? <Ticket size={20} className="text-emerald-400"/> : offer.type === 'F&B' ? <CupSoda size={20} className="text-orange-400"/> : <Tag size={20} className="text-blue-400"/>}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white leading-tight pr-4">{offer.title}</h3>
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{offer.type}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Actions Dropdown on Hover */}
                                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => editOffer(offer)} className="p-2 rounded-lg bg-gray-800 hover:bg-blue-500 text-gray-400 hover:text-white transition-colors shadow-lg"><Edit2 size={14}/></button>
                                                <button onClick={() => toggleOffer(offer._id)} className={`p-2 rounded-lg shadow-lg transition-colors ${offer.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><Power size={14}/></button>
                                                <button onClick={() => deleteOffer(offer._id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-500/70 hover:bg-rose-500 hover:text-white transition-colors shadow-lg"><Trash2 size={14}/></button>
                                            </div>

                                            {/* Advanced Data Display */}
                                            <div className="flex flex-wrap gap-2 mt-2 mb-4">
                                                {offer.minOrderValue > 0 && <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">Min: ₹{offer.minOrderValue}</span>}
                                                {offer.maxUses > 0 && <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">Limit: {offer.maxUses}</span>}
                                                {offer.expiryDate && <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">Exp: {new Date(offer.expiryDate).toLocaleDateString()}</span>}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Cost</p>
                                                    <p className="text-yellow-400 font-bold text-sm flex items-center gap-1"><Sparkles size={12}/> {offer.cost}</p>
                                                </div>
                                                {offer.type !== 'F&B' && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Value</p>
                                                        <p className="text-white font-bold text-sm font-mono bg-gray-900 px-2 py-0.5 rounded border border-gray-700 shadow-inner">
                                                            {offer.type === 'DISCOUNT' ? `₹${offer.value}` : `${offer.value}%`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 2: SNACKS MODERATION VIEW (Admin View Only) */}
            {/* ===================================================================== */}
            {activeTab === 'SNACKS' && (
                <div className="animate-fadeIn">
                    <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 shadow-2xl min-h-[500px]">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-800 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Store className="text-orange-400" size={20}/> Cinema F&B Submissions
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Viewing {filteredSnacks.length} items uploaded by local cinemas.</p>
                            </div>
                            
                            {/* THEATER FILTER */}
                            <div className="relative w-full sm:w-64 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter size={14} className="text-gray-500 group-focus-within:text-primary transition-colors"/>
                                </div>
                                <select 
                                    value={theaterFilter} 
                                    onChange={(e) => setTheaterFilter(e.target.value)}
                                    className="w-full bg-[#151515] border border-gray-700 text-white pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer"
                                >
                                    <option value="ALL">All Cinema Locations</option>
                                    {theaters.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {filteredSnacks.length === 0 ? (
                            <div className="bg-[#1a1a1a] border border-gray-800 border-dashed rounded-3xl p-16 text-center text-gray-500 flex flex-col items-center">
                                <Utensils size={40} className="mb-4 opacity-20"/>
                                <p className="text-lg font-bold text-gray-400">No items found.</p>
                                <p className="text-sm mt-1">No local cinemas have uploaded F&B items yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-max">
                                {filteredSnacks.map(snack => (
                                    <div key={snack._id} className={`flex gap-4 p-4 bg-[#1a1a1a] border rounded-2xl relative group transition-all duration-300 ${!snack.isActive ? 'border-red-500/20 bg-[#0f0f0f] opacity-75' : 'border-gray-800 hover:border-gray-600 hover:bg-[#1f1f1f]'}`}>
                                        
                                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#121212] shadow-md border border-gray-800 relative">
                                            <img src={snack.image} alt={snack.name} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${!snack.isActive ? 'grayscale' : ''}`}/>
                                            {!snack.isActive && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 shadow-lg">Suspended</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col justify-center pr-8 w-full overflow-hidden">
                                            <h4 className="font-bold text-white leading-tight mb-1 truncate">{snack.name}</h4>
                                            
                                            {/* Cinema Tag */}
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-2 truncate">
                                                <MapPin size={10} className="text-blue-400 shrink-0"/> {getTheaterName(snack.theaterId)}
                                            </p>

                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-black px-1.5 py-0.5 rounded border border-gray-800 shrink-0">{snack.category || 'Popcorn'}</span>
                                                <p className="text-orange-400 font-bold flex items-center bg-orange-500/10 w-fit px-1.5 py-0.5 rounded border border-orange-500/20 text-xs font-mono">
                                                    <IndianRupee size={10} className="mr-0.5"/> {snack.price}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons - Appear on Hover (Toggle & Delete Only) */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => toggleSnackStock(snack._id, snack.isActive)} className={`p-2 rounded-lg transition-colors shadow-lg border ${snack.isActive ? 'bg-gray-800 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 border-gray-700 hover:border-yellow-500/30' : 'bg-red-500/20 text-red-400 hover:bg-emerald-500/20 hover:text-emerald-400 border-red-500/30 hover:border-emerald-500/30'}`} title={snack.isActive ? "Suspend Item" : "Activate Item"}>
                                                {snack.isActive ? <Power size={14}/> : <CheckIcon size={14}/>}
                                            </button>
                                            <button onClick={() => deleteSnack(snack._id)} className="bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white p-2 rounded-lg transition-colors shadow-lg border border-gray-700" title="Delete Item">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 3: USER WALLETS & LEDGER */}
            {/* ===================================================================== */}
            {activeTab === 'WALLETS' && (
                <div className="animate-fadeIn">
                    
                    <div className="relative w-full max-w-md mb-6 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                        </div>
                        <input type="text" placeholder="Search user by name or email..." value={searchUser} onChange={(e)=>setSearchUser(e.target.value)} className="w-full bg-[#121212] border border-gray-800 text-white pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm shadow-inner"/>
                    </div>

                    <div className="bg-[#121212] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#1a1a1a] text-gray-400 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="p-5 pl-6">Platform User</th>
                                        <th className="p-5">Available Coins</th>
                                        <th className="p-5">Account Status</th>
                                        <th className="p-5 text-center">Admin Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="p-10 text-center text-gray-500 italic">No users found.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-5 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 shrink-0">
                                                            {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover"/> : <Users className="m-auto mt-2 text-gray-500"/>}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{u.name}</p>
                                                            <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                                                            <CupSoda size={14} className="text-yellow-500"/>
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-lg text-yellow-400">{u.coins || u.loyaltyPoints || 0}</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Wallet Balance</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {u.isBanned ? (
                                                        <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 uppercase">Banned</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 uppercase">Active</span>
                                                    )}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <button onClick={() => setViewingLedger(u)} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2">
                                                        <History size={14}/> View Ledger & Actions
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* LEDGER MODAL */}
            {viewingLedger && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121212] border border-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col animate-slideInRight">
                        <div className="p-6 bg-[#1a1a1a] border-b border-gray-800 flex justify-between items-start relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-primary"></div>
                            <div className="flex items-center gap-4">
                                <img src={viewingLedger.image || ''} className="w-14 h-14 rounded-full bg-gray-800 object-cover" alt=""/>
                                <div>
                                    <h2 className="text-xl font-bold text-white leading-tight">{viewingLedger.name}'s Ledger</h2>
                                    <p className="text-xs text-gray-400 font-mono">{viewingLedger.email}</p>
                                </div>
                            </div>
                            <button onClick={()=>setViewingLedger(null)} className="p-2 bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white rounded-full transition"><X size={18}/></button>
                        </div>
                        <div className="p-4 border-b border-gray-800 bg-[#0a0a0a] flex gap-3">
                            <button className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black border border-yellow-500/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <Gift size={16}/> Manual Coin Grant
                            </button>
                            <button className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                <MessageSquarePlus size={16}/> Create Support Ticket
                            </button>
                        </div>
                        <div className="p-6 bg-[#121212] h-96 overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <History size={16}/> Recent Activity (Simulated)
                            </h3>
                            <div className="space-y-3">
                                <div className="p-4 bg-[#1a1a1a] border border-gray-800 rounded-2xl flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><ArrowDownRight size={18}/></div>
                                        <div><p className="font-bold text-white text-sm">Redeemed Free Popcorn</p><p className="text-xs text-gray-500">Offer Redemption</p></div>
                                    </div>
                                    <p className="font-mono font-bold text-red-400">-150 Coins</p>
                                </div>
                                <div className="p-4 bg-[#1a1a1a] border border-gray-800 rounded-2xl flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center"><ArrowUpRight size={18}/></div>
                                        <div><p className="font-bold text-white text-sm">Booked: Pushpa 2: The Rule</p><p className="text-xs text-gray-500">Earned via Checkout</p></div>
                                    </div>
                                    <p className="font-mono font-bold text-green-400">+45 Coins</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOffers;