import React, { useState, useEffect, useCallback } from 'react';
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Plus, Trash2, Utensils, IndianRupee, Edit2, X, CheckIcon, 
    Image as ImageIcon, Power, AlertCircle 
} from 'lucide-react';
import Loading from '../../components/Loading';

const CinemaSnacks = () => {
    const { axios, getToken } = useAppContext();
    const [snacks, setSnacks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Edit State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ 
        name: '', price: '', image: '', description: '', category: 'Popcorn', isActive: true 
    });

    const categories = ['Popcorn', 'Beverage', 'Candy', 'Combo', 'Hot Food', 'Other'];

    const fetchSnacks = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/snacks/my-menu', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) setSnacks(data.snacks);
        } catch (error) { 
            console.error(error);
            toast.error("Failed to load local menu.");
        } finally {
            setLoading(false);
        }
    }, [axios, getToken]);

    useEffect(() => { fetchSnacks(); }, [fetchSnacks]);

    const handleEditClick = (snack) => {
        setFormData({
            name: snack.name,
            price: snack.price,
            image: snack.image,
            description: snack.description || '',
            category: snack.category || 'Popcorn',
            isActive: snack.isActive !== false
        });
        setEditingId(snack._id);
        setIsEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', image: '', description: '', category: 'Popcorn', isActive: true });
        setEditingId(null);
        setIsEditMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const endpoint = isEditMode ? '/api/snacks/update' : '/api/snacks/create-local';
            const payload = isEditMode ? { id: editingId, ...formData } : formData;

            const { data } = await axios.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if(data.success) {
                toast.success(isEditMode ? "Snack Updated!" : "Added to Menu!");
                resetForm();
                fetchSnacks();
            } else {
                toast.error(data.message);
            }
        } catch (error) { 
            console.error(error);
            toast.error(isEditMode ? "Update failed" : "Creation failed"); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // Quick toggle for "Out of Stock" during busy shifts
    const handleToggleStock = async (snackId, currentStatus) => {
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/snacks/toggle-stock', { id: snackId, isActive: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if(data.success) {
                toast.success(currentStatus ? "Marked Out of Stock" : "Item Restocked!");
                setSnacks(prev => prev.map(s => s._id === snackId ? { ...s, isActive: !currentStatus } : s));
            }
        } catch (error) {
            console.error(error);
            toast.error("Stock update failed");
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to delete this snack from the menu?")) return;
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/snacks/delete', { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) { 
                toast.success("Snack Deleted!"); 
                if (editingId === id) resetForm();
                fetchSnacks(); 
            }
        } catch (error) {
            console.error(error);
            toast.error("Delete failed");
        }
    };

    if (loading) return <Loading />;

    return (
        <div className='pb-20 pt-6 px-4 sm:px-6 lg:px-8 relative font-outfit text-white animate-fadeIn max-w-[1600px] mx-auto'>
            {/* Ambient Background Glows */}
            <div className="fixed top-20 right-10 w-[40%] h-[400px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0 hidden md:block"></div>
            <div className="fixed bottom-0 left-10 w-[30%] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0 hidden md:block"></div>

            {/* Header Sub-Nav Style */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-10 gap-4 sm:gap-6 bg-[#060606]/80 p-5 sm:p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Utensils fill="currentColor" size={12} className="text-orange-500" />
                        <p className="text-orange-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">Concessions Manager</p>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Snacks Menu</h2>
                    <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3 sm:px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner">
                        Manage food and beverage items for your theater
                    </p>
                </div>
                {isEditMode && (
                    <button onClick={resetForm} className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-4 sm:px-5 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-inner mt-2 sm:mt-0">
                        <X size={14} strokeWidth={3}/> Cancel Edit
                    </button>
                )}
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                
                {/* --- LEFT: ADD / EDIT FORM --- */}
                <div className="lg:col-span-5 xl:col-span-4 relative">
                    <div className={`bg-[#060606]/80 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border transition-all duration-300 shadow-2xl relative lg:sticky lg:top-24 overflow-hidden ${isEditMode ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/[0.04]'}`}>
                        <div className={`absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent ${isEditMode ? 'via-blue-500/50' : 'via-orange-500/50'} to-transparent`}></div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 border-b border-white/[0.05] pb-4 sm:pb-5">
                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border shadow-inner ${isEditMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                {isEditMode ? <Edit2 className="w-5 h-5 sm:w-6 sm:h-6"/> : <Utensils className="w-5 h-5 sm:w-6 sm:h-6"/>}
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">{isEditMode ? 'Edit Snack' : 'Add New Snack'}</h3>
                                <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mt-0.5 sm:mt-1">Menu Details</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            {/* Image Preview Box */}
                            <div className="w-full aspect-video bg-[#0a0a0a] rounded-xl sm:rounded-2xl border border-white/[0.05] flex items-center justify-center overflow-hidden relative shadow-inner">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-600">
                                        <ImageIcon size={32} className="mb-2 sm:mb-3 opacity-40"/>
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Image Preview</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-1.5 sm:mb-2 ml-1">Item Name</label>
                                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-white outline-none transition-all shadow-inner placeholder:text-gray-600" placeholder="e.g. Large Caramel Popcorn"/>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div>
                                    <label className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-1.5 sm:mb-2 ml-1">Category</label>
                                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-white outline-none transition-all appearance-none cursor-pointer shadow-inner">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-1.5 sm:mb-2 ml-1">Price</label>
                                    <div className="relative">
                                        <IndianRupee size={14} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                                        <input type="number" required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-3.5 sm:p-4 pl-9 sm:pl-10 text-xs sm:text-sm text-white outline-none transition-all shadow-inner font-mono placeholder:text-gray-600" placeholder="0.00"/>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-1.5 sm:mb-2 ml-1">Image URL</label>
                                <input required value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-white outline-none transition-all shadow-inner placeholder:text-gray-600 font-mono" placeholder="https://..."/>
                            </div>
                            
                            <div>
                                <label className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-1.5 sm:mb-2 ml-1">Description</label>
                                <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-white outline-none transition-all shadow-inner resize-none h-20 sm:h-24 custom-scrollbar placeholder:text-gray-600" placeholder="Add details like size, allergens, or ingredients..."/>
                            </div>
                            
                            <button disabled={isSubmitting} type="submit" className={`w-full text-white font-black uppercase tracking-[0.15em] text-[10px] sm:text-[11px] py-4 sm:py-4.5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-2 mt-6 sm:mt-8 border ${isEditMode ? 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border-blue-400/30' : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 border-orange-400/30'}`}>
                                {isSubmitting ? "Processing..." : isEditMode ? <><CheckIcon size={14} className="sm:w-4 sm:h-4" strokeWidth={3}/> Save Changes</> : <><Plus size={14} className="sm:w-4 sm:h-4" strokeWidth={3}/> Add Snack</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT: LOCAL MENU LIST --- */}
                <div className="lg:col-span-7 xl:col-span-8 relative z-10">
                    <div className="bg-[#060606]/80 backdrop-blur-2xl border border-white/[0.04] rounded-3xl p-5 sm:p-8 shadow-2xl min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[50%] h-[1px] bg-gradient-to-l from-transparent via-white/20 to-transparent"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-white/[0.05] gap-4">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">Current Menu</h3>
                                <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 font-medium">Food and drinks currently available for guests to order.</p>
                            </div>
                            <span className="bg-black/50 text-gray-400 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 shadow-inner">
                                Total Items: {snacks.length}
                            </span>
                        </div>

                        {snacks.length === 0 ? (
                            <div className="bg-white/[0.02] border border-white/[0.05] border-dashed rounded-3xl p-10 sm:p-24 text-center text-gray-500 flex flex-col items-center">
                                <div className="p-4 sm:p-6 bg-white/[0.02] rounded-full mb-4 sm:mb-6 border border-white/[0.05]">
                                    <Utensils className="w-10 h-10 sm:w-12 sm:h-12 opacity-40 text-orange-500"/>
                                </div>
                                <p className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">Menu is Empty</p>
                                <p className="text-xs sm:text-sm mt-2 sm:mt-3 max-w-[250px] sm:max-w-sm mx-auto">Add your first snack to start selling food and drinks.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 auto-rows-max">
                                {snacks.map(snack => (
                                    <div key={snack._id} className={`flex gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative group transition-all duration-300 overflow-hidden shadow-2xl ${editingId === snack._id ? 'bg-[#030303] border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02] z-10' : !snack.isActive ? 'bg-[#060606]/40 border border-red-500/10 opacity-70 grayscale-[30%] hover:grayscale-0' : 'bg-[#060606]/60 border border-white/[0.05] hover:border-white/10 hover:bg-[#0a0a0a]/80'}`}>
                                        
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10 relative">
                                            <img src={snack.image} alt={snack.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                                            {!snack.isActive && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] transform -rotate-12">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between py-0.5 sm:py-1 pr-10 sm:pr-12 min-w-0">
                                            <div>
                                                <h4 className="font-bold text-gray-100 text-sm sm:text-lg leading-tight mb-1.5 sm:mb-2 line-clamp-2 pr-1">{snack.name}</h4>
                                                <span className="text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] bg-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-white/[0.05] shrink-0 shadow-inner inline-block">{snack.category || 'Popcorn'}</span>
                                            </div>
                                            
                                            <div className="flex items-end justify-between mt-2 sm:mt-4">
                                                <p className="text-orange-400 font-bold flex items-center bg-orange-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-orange-500/20 text-xs sm:text-sm font-mono shadow-inner">
                                                    <IndianRupee size={10} className="mr-0.5 sm:mr-1 opacity-70 sm:w-3 sm:h-3"/> {parseFloat(snack.price).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons - Quick Access */}
                                        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex flex-col gap-2 sm:gap-2.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                                            <button 
                                                onClick={() => handleToggleStock(snack._id, snack.isActive)} 
                                                className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg border backdrop-blur-md ${snack.isActive ? 'bg-[#111]/80 hover:bg-black text-gray-400 hover:text-red-500 border-white/10 hover:border-red-500/50' : 'bg-red-500/20 text-red-400 hover:bg-emerald-500/20 hover:text-emerald-400 border-red-500/30 hover:border-emerald-500/30'}`} 
                                                title={snack.isActive ? "Mark Out of Stock" : "Mark In Stock"}
                                            >
                                                {snack.isActive ? <Power size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5}/> : <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5}/>}
                                            </button>
                                            <button onClick={() => handleEditClick(snack)} className="bg-[#111]/80 hover:bg-black text-gray-400 hover:text-blue-400 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg border border-white/10 hover:border-blue-500/50 backdrop-blur-md" title="Edit Item">
                                                <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5}/>
                                            </button>
                                            <button onClick={() => handleDelete(snack._id)} className="bg-[#111]/80 hover:bg-red-500 text-gray-400 hover:text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-lg border border-white/10 hover:border-red-500/50 backdrop-blur-md" title="Delete Item">
                                                <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.5}/>
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

export default CinemaSnacks;