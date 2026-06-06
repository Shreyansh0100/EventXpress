import React, { useState, useEffect } from 'react';
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Plus, Trash2, Utensils, IndianRupee, Edit2, X, CheckIcon, 
    Image as ImageIcon, MapPin, Store, Filter, Power, AlertCircle
} from 'lucide-react';
import Loading from '../../components/Loading';

const ManageSnacks = () => {
    const { axios, getToken } = useAppContext();
    const [snacks, setSnacks] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Edit State
    const [theaterFilter, setTheaterFilter] = useState('ALL');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ 
        name: '', price: '', image: '', description: '', 
        category: 'Popcorn', isActive: true, theaterId: '' 
    });

    const categories = ['Popcorn', 'Beverage', 'Candy', 'Combo', 'Hot Food', 'Other'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [snacksRes, theatersRes] = await Promise.all([
                axios.get('/api/snacks/list?all=true', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/all-theaters', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (snacksRes.data.success) setSnacks(snacksRes.data.snacks);
            if (theatersRes.data?.success) setTheaters(theatersRes.data.theaters);
        } catch (error) { 
            toast.error("Failed to load F&B data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleEditClick = (snack) => {
        setFormData({
            name: snack.name,
            price: snack.price,
            image: snack.image,
            description: snack.description || '',
            category: snack.category || 'Popcorn',
            isActive: snack.isActive !== false,
            theaterId: snack.theaterId || (typeof snack.theaterId === 'object' ? snack.theaterId._id : '')
        });
        setEditingId(snack._id);
        setIsEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', image: '', description: '', category: 'Popcorn', isActive: true, theaterId: '' });
        setEditingId(null);
        setIsEditMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.theaterId) return toast.error("Please assign this item to a specific Cinema.");

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const endpoint = isEditMode ? '/api/snacks/update' : '/api/snacks/add';
            const payload = isEditMode ? { id: editingId, ...formData } : formData;

            const { data } = await axios.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if(data.success) {
                toast.success(isEditMode ? "Snack Updated!" : "Snack Assigned to Cinema!");
                resetForm();
                fetchData();
            } else {
                toast.error(data.message);
            }
        } catch (error) { 
            toast.error("Operation failed"); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Permanently delete this item across the system?")) return;
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/snacks/delete', { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) { 
                toast.success("Item Deleted!"); 
                if (editingId === id) resetForm();
                fetchData(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) { toast.error("Delete failed"); }
    };

    const getTheaterName = (id) => {
        const theater = theaters.find(t => t._id === id || t._id === id?._id);
        return theater ? `${theater.name} (${theater.city})` : "Global / Unknown";
    };

    // Filter Logic
    const filteredSnacks = theaterFilter === 'ALL' 
        ? snacks 
        : snacks.filter(s => s.theaterId === theaterFilter || s.theaterId?._id === theaterFilter);

    if (loading) return <Loading />;

    return (
        <div className='pb-20 max-w-7xl mx-auto text-white font-outfit animate-fadeIn'>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <Title text1="Master F&B" text2="Control" />
                    <p className="text-gray-500 text-sm mt-1 font-medium">Manage localized concession menus across all cinema branches.</p>
                </div>
                {isEditMode && (
                    <button onClick={resetForm} className="text-xs bg-red-500/10 text-red-500 px-4 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 hover:bg-red-500 hover:text-white transition font-bold shadow-lg w-full md:w-auto justify-center">
                        <X size={14}/> Cancel Edit
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT: ADD / EDIT FORM --- */}
                <div className="lg:col-span-4">
                    <div className={`bg-[#0c0c0c] p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-2xl lg:sticky top-6 ${isEditMode ? 'border-primary/50 shadow-[0_0_20px_rgba(248,69,101,0.15)]' : 'border-gray-800'}`}>
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                            <div className={`p-3 rounded-xl border ${isEditMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {isEditMode ? <Edit2 size={24}/> : <Utensils size={24}/>}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{isEditMode ? 'Edit Local Item' : 'New Local Item'}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Menu Assignment</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* THEATER ASSIGNMENT */}
                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-4">
                                <label className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                                    <Store size={12}/> Assign to Cinema Location
                                </label>
                                <select required value={formData.theaterId} onChange={e=>setFormData({...formData, theaterId: e.target.value})} className="w-full bg-[#151515] border border-gray-700 focus:border-blue-500 rounded-lg p-2.5 text-sm text-white outline-none transition-colors appearance-none cursor-pointer">
                                    <option value="">-- Select Theater --</option>
                                    {theaters.map(t => <option key={t._id} value={t._id}>{t.name}, {t.city}</option>)}
                                </select>
                            </div>

                            {/* Image Preview Box */}
                            <div className="w-full aspect-video bg-[#1a1a1a] rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden mb-4 relative group shadow-inner">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-600"><ImageIcon size={32} className="mb-2 opacity-50"/><span className="text-[10px] font-bold uppercase tracking-wider">Image Preview</span></div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Item Name</label>
                                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-primary rounded-xl p-3 text-sm text-white outline-none transition-colors shadow-inner" placeholder="e.g. Cheese Popcorn"/>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Category</label>
                                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-primary rounded-xl p-3 text-sm text-white outline-none transition-colors appearance-none cursor-pointer">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Price</label>
                                    <div className="relative">
                                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                                        <input type="number" required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-primary rounded-xl p-3 pl-8 text-sm text-white outline-none transition-colors shadow-inner font-mono" placeholder="250"/>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Image URL</label>
                                <input required value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-primary rounded-xl p-3 text-sm text-white outline-none transition-colors shadow-inner" placeholder="https://..."/>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Description (Optional)</label>
                                <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-primary rounded-xl p-3 text-sm text-white outline-none transition-colors shadow-inner resize-none h-20 custom-scrollbar" placeholder="A large tub of freshly popped..."/>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#1a1a1a] border border-gray-700 rounded-xl mt-2">
                                <input type="checkbox" checked={formData.isActive} onChange={e=>setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 accent-emerald-500" />
                                <span className="text-sm font-medium text-gray-300">Item is Active / In Stock</span>
                            </label>
                            
                            <button disabled={isSubmitting} type="submit" className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 ${isEditMode ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-primary hover:bg-red-600 shadow-[0_0_20px_rgba(248,69,101,0.2)]'}`}>
                                {isSubmitting ? "Saving..." : isEditMode ? <><CheckIcon size={18} strokeWidth={3}/> Update Item</> : <><Plus size={18} strokeWidth={3}/> Push to Cinema Menu</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT: SNACKS LIST WITH FILTER --- */}
                <div className="lg:col-span-8">
                    <div className="bg-[#0c0c0c] border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl min-h-[500px]">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-800 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">Global Menu Directory</h3>
                                <p className="text-xs text-gray-500 mt-1">Viewing {filteredSnacks.length} items across the network.</p>
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
                            <div className="bg-[#121212] border border-gray-800 border-dashed rounded-3xl p-10 sm:p-16 text-center text-gray-500 flex flex-col items-center">
                                <Store size={40} className="mb-4 opacity-20"/>
                                <p className="text-lg font-bold text-gray-400">No items found.</p>
                                <p className="text-sm mt-1">Try selecting a different cinema or add a new snack.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                                {filteredSnacks.map(snack => (
                                    <div key={snack._id} className={`flex gap-4 p-3 sm:p-4 bg-[#121212] border rounded-2xl relative group transition-all duration-300 ${editingId === snack._id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-blue-500/5' : !snack.isActive ? 'border-red-500/20 bg-[#0f0f0f] opacity-75' : 'border-gray-800 hover:border-gray-600'}`}>
                                        
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-[#1a1a1a] shadow-md border border-gray-800 relative">
                                            <img src={snack.image} alt={snack.name} className={`w-full h-full object-cover sm:group-hover:scale-110 transition-transform duration-500 ${!snack.isActive ? 'grayscale' : ''}`}/>
                                            {!snack.isActive && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 shadow-lg">Sold Out</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col justify-center pr-6 sm:pr-8 w-full overflow-hidden">
                                            <h4 className="font-bold text-white leading-tight mb-1 truncate text-sm sm:text-base">{snack.name}</h4>
                                            
                                            <p className="text-[9px] sm:text-[10px] text-gray-400 flex items-center gap-1 mb-2 truncate">
                                                <MapPin size={10} className="text-blue-400 shrink-0"/> {getTheaterName(snack.theaterId)}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest bg-black px-1.5 py-0.5 rounded border border-gray-800 shrink-0">{snack.category || 'Popcorn'}</span>
                                                <p className="text-emerald-400 font-bold flex items-center bg-emerald-500/10 w-fit px-1.5 py-0.5 rounded border border-emerald-500/20 text-xs font-mono">
                                                    <IndianRupee size={10} className="mr-0.5"/> {snack.price}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons - Always visible on mobile, Hover on Desktop */}
                                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(snack)} className="bg-gray-800 hover:bg-blue-500 text-gray-400 hover:text-white p-1.5 sm:p-2 rounded-lg transition-colors shadow-lg border border-gray-700" title="Edit Item">
                                                <Edit2 size={14}/>
                                            </button>
                                            <button onClick={() => handleDelete(snack._id)} className="bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white p-1.5 sm:p-2 rounded-lg transition-colors shadow-lg border border-gray-700" title="Delete Item">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageSnacks;