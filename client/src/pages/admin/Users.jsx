import React, { useEffect, useState, useRef } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import { Search, User, Mail, Calendar, Shield, Ticket, Clock, Lock, Unlock, ShieldAlert, CheckCircle2, Clapperboard, MapPin, X, Save, ChevronRight, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersList = () => {
    const { axios, getToken, user } = useAppContext()
    const [users, setUsers] = useState([]);
    const [theaters, setTheaters] = useState([]); 
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);

    // --- ROLE MODAL STATE ---
    const [roleModalUser, setRoleModalUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('user');
    
    // --- CUSTOM DROPDOWN STATE ---
    const [selectedTheater, setSelectedTheater] = useState('');
    const [theaterSearch, setTheaterSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    // Fetch Users & Theaters
    const fetchData = async () => {
        try {
            const token = await getToken();
            const [usersRes, theatersRes] = await Promise.all([
                axios.get("/api/admin/all-users", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/admin/all-theaters", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { theaters: [] } }))
            ]);
            
            if(usersRes.data.success) setUsers(usersRes.data.users);
            if(theatersRes.data?.theaters) setTheaters(theatersRes.data.theaters);
            
        } catch (error) {
            toast.error("Failed to fetch platform data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user) fetchData(); }, [user]);

    // Open Modal
    const openRoleModal = (u) => {
        setRoleModalUser(u);
        setSelectedRole(u.role || 'user');
        setSelectedTheater(u.theaterId || '');
        setTheaterSearch('');
        setIsDropdownOpen(false);
    };

    // Submit Role Change
    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        if (selectedRole === 'cinema' && !selectedTheater) {
            return toast.error("Please search and select a theater for this Cinema Staff.");
        }

        setIsUpdatingRole(true);
        try {
            const payload = { 
                userId: roleModalUser._id, 
                newRole: selectedRole,
                theaterId: selectedRole === 'cinema' ? selectedTheater : null 
            };

            const { data } = await axios.post("/api/admin/change-role", payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if(data.success) {
                toast.success("Access permissions updated!");
                setRoleModalUser(null);
                fetchData(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) { 
            toast.error("Update failed"); 
        } finally {
            setIsUpdatingRole(false);
        }
    }

    // Handle Ban
    const handleBan = async (userId, isBanned) => {
        if(!window.confirm(isBanned ? "Unban this user?" : "Are you sure you want to BAN this user?")) return;
        try {
            const { data } = await axios.post("/api/admin/toggle-ban", { userId }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if(data.success) {
                toast.success(data.message);
                fetchData(); 
            }
        } catch (error) { toast.error("Action failed"); }
    }

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(filter.toLowerCase()) || 
        u.email.toLowerCase().includes(filter.toLowerCase())
    );

    const filteredTheaters = theaters.filter(t => 
        t.name.toLowerCase().includes(theaterSearch.toLowerCase()) || 
        t.city.toLowerCase().includes(theaterSearch.toLowerCase())
    );

    if (loading) return <Loading />

    return (
        <div className='pb-20 min-h-screen font-outfit text-white'>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <Title text1="User" text2="Directory" />
                    <p className="text-gray-400 text-sm mt-1">Manage customers, staff accounts, and system administrators.</p>
                </div>
                
                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-500 group-focus-within:text-white transition-colors"/>
                    </div>
                    <input type="text" placeholder="Search by name or email..." value={filter} onChange={(e)=>setFilter(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-gray-500 text-sm transition-colors"
                    />
                </div>
            </div>

            {/* --- DESKTOP VIEW: DATA TABLE --- */}
            <div className="hidden md:block bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#121212] border-b border-gray-800">
                            <tr>
                                <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Account</th>
                                <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Engagement</th>
                                <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Last Active</th>
                                <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Access Level</th>
                                <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-gray-500 italic">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((u, index) => (
                                    <tr key={index} className={`transition-colors ${u.isBanned ? 'bg-red-950/10' : 'hover:bg-white/[0.02]'}`}>
                                        
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-800 shrink-0">
                                                    {u.image ? <img src={u.image} className="w-full h-full object-cover"/> : <User size={16} className="text-gray-500"/>}
                                                </div>
                                                <div>
                                                    <p className={`font-medium text-sm ${u.isBanned ? 'text-red-400' : 'text-gray-200'}`}>{u.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-200">{u.totalBookings || 0} Tickets</span>
                                                <span className="text-xs text-gray-500 mt-0.5">Lifetime</span>
                                            </div>
                                        </td>

                                        <td className="py-4 px-6">
                                            {u.lastBooking ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-300">{new Date(u.lastBooking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{new Date(u.lastBooking).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600">No activity</span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6">
                                            <button 
                                                onClick={() => openRoleModal(u)}
                                                className="group flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors -ml-3"
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                                        u.role === 'admin' ? 'text-purple-400' : 
                                                        u.role === 'cinema' ? 'text-orange-400' : 'text-blue-400'
                                                    }`}>
                                                        {u.role === 'admin' ? <Shield size={12}/> : u.role === 'cinema' ? <Clapperboard size={12}/> : <User size={12}/>}
                                                        {u.role || "User"}
                                                    </span>
                                                    {u.role === 'cinema' && (
                                                        <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <MapPin size={10}/> Box Office Agent
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronRight size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </td>

                                        <td className="py-4 px-6">
                                            {u.isBanned ? (
                                                <span className="inline-flex items-center gap-1 text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                                                    <ShieldAlert size={12}/> Suspended
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                                                    <CheckCircle2 size={12}/> Active
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => handleBan(u._id, u.isBanned)}
                                                className={`p-2 rounded-md transition-colors ${
                                                    u.isBanned 
                                                    ? 'text-emerald-500 hover:bg-emerald-500/10' 
                                                    : 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
                                                }`}
                                                title={u.isBanned ? "Restore Access" : "Suspend Account"}
                                            >
                                                {u.isBanned ? <Unlock size={16}/> : <Lock size={16}/>}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MOBILE VIEW: CARD STACK --- */}
            <div className="md:hidden space-y-4 mb-6">
                {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic bg-[#121212] rounded-xl border border-gray-800">
                        No users found.
                    </div>
                ) : (
                    filteredUsers.map((u, idx) => (
                        <div key={idx} className={`bg-[#121212] border rounded-2xl p-4 shadow-lg flex flex-col gap-4 transition-all ${u.isBanned ? 'border-red-900/30 opacity-80' : 'border-gray-800'}`}>
                            
                            {/* Top: Avatar, Info, Status */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border ${u.isBanned ? 'border-red-900/50 bg-red-900/20 text-red-500' : 'bg-gray-900 border-gray-700'}`}>
                                        {u.image ? <img src={u.image} className={`w-full h-full object-cover ${u.isBanned ? 'grayscale' : ''}`}/> : <User size={16} className="text-gray-500"/>}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className={`font-bold text-sm truncate ${u.isBanned ? 'text-red-400' : 'text-white'}`}>{u.name}</p>
                                        <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 bg-[#1a1a1a] p-3 rounded-xl border border-gray-800/50">
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Engagement</p>
                                    <p className="text-sm font-bold text-gray-200">{u.totalBookings || 0} Tickets</p>
                                </div>
                                <div className="text-right border-l border-gray-800/50 pl-3">
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Last Active</p>
                                    {u.lastBooking ? (
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-gray-300">{new Date(u.lastBooking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</p>
                                            <p className="text-[9px] text-gray-500">{new Date(u.lastBooking).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    ) : <p className="text-xs text-gray-600 font-medium">No activity</p>}
                                </div>
                            </div>

                            {/* Bottom: Actions & Role */}
                            <div className="flex gap-2 items-center">
                                <button onClick={() => openRoleModal(u)} className="flex-1 bg-[#1a1a1a] hover:bg-gray-800 border border-gray-700 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                    {u.role === 'admin' ? <Shield size={14} className="text-purple-400"/> : u.role === 'cinema' ? <Clapperboard size={14} className="text-orange-400"/> : <User size={14} className="text-blue-400"/>}
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{u.role || "User"}</span>
                                    <ChevronRight size={14} className="text-gray-600"/>
                                </button>
                                <button 
                                    onClick={() => handleBan(u._id, u.isBanned)} 
                                    className={`p-2.5 rounded-lg border transition-colors ${u.isBanned ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white'}`}
                                >
                                    {u.isBanned ? <Unlock size={16}/> : <Lock size={16}/>}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- ENTERPRISE ROLE MANAGEMENT MODAL --- */}
            {roleModalUser && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        
                        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-[#121212]">
                            <div>
                                <h2 className="text-base font-semibold text-white">Manage Access Level</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Editing permissions for <span className="text-gray-200 font-medium">{roleModalUser.name}</span></p>
                            </div>
                            <button onClick={()=>setRoleModalUser(null)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><X size={18}/></button>
                        </div>

                        <form onSubmit={handleRoleSubmit} className="p-6">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Select Role</label>
                            
                            <div className="flex flex-col gap-3 mb-6">
                                
                                {/* Standard User Card */}
                                <div 
                                    onClick={() => { setSelectedRole('user'); setSelectedTheater(''); setIsDropdownOpen(false); }}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedRole === 'user' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#121212] border-gray-800 hover:border-gray-600'}`}
                                >
                                    <div className={`mt-0.5 ${selectedRole === 'user' ? 'text-blue-400' : 'text-gray-500'}`}><User size={18}/></div>
                                    <div>
                                        <p className={`text-sm font-semibold ${selectedRole === 'user' ? 'text-blue-400' : 'text-gray-300'}`}>Standard Customer</p>
                                        <p className="text-xs text-gray-500 mt-1">Can book tickets, earn loyalty points, and view their own history. No dashboard access.</p>
                                    </div>
                                </div>

                                {/* Cinema Staff Card with SEARCHABLE DROPDOWN */}
                                <div 
                                    onClick={() => setSelectedRole('cinema')}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedRole === 'cinema' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-[#121212] border-gray-800 hover:border-gray-600'}`}
                                >
                                    <div className={`mt-0.5 ${selectedRole === 'cinema' ? 'text-orange-400' : 'text-gray-500'}`}><Clapperboard size={18}/></div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${selectedRole === 'cinema' ? 'text-orange-400' : 'text-gray-300'}`}>Cinema Staff (Box Office)</p>
                                        <p className="text-xs text-gray-500 mt-1">Access to local POS, ticket scanning, and daily manifests for a specific theater.</p>
                                        
                                        {selectedRole === 'cinema' && (
                                            <div className="mt-4 pt-4 border-t border-orange-500/20 relative" onClick={(e) => e.stopPropagation()}>
                                                <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2">Assign Facility Location</label>
                                                
                                                {/* CUSTOM SEARCHABLE DROPDOWN TRIGGER */}
                                                <div 
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="w-full bg-[#050505] border border-orange-500/30 hover:border-orange-500/60 rounded-lg px-3 py-2.5 text-sm text-white flex justify-between items-center cursor-pointer transition-colors shadow-inner"
                                                >
                                                    <span className={selectedTheater ? "text-white" : "text-gray-500"}>
                                                        {selectedTheater 
                                                            ? theaters.find(t => t._id === selectedTheater)?.name + " - " + theaters.find(t => t._id === selectedTheater)?.city
                                                            : "Select a facility..."}
                                                    </span>
                                                    <ChevronDown size={16} className={`text-orange-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>

                                                {/* CUSTOM DROPDOWN MENU */}
                                                {isDropdownOpen && (
                                                    <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
                                                        <div className="p-2 border-b border-gray-800 bg-[#121212]">
                                                            <div className="flex items-center bg-[#050505] border border-gray-700 rounded-lg px-3 py-2">
                                                                <Search size={14} className="text-gray-500"/>
                                                                <input 
                                                                    type="text" 
                                                                    autoFocus
                                                                    placeholder="Search by theater or city..." 
                                                                    value={theaterSearch}
                                                                    onChange={(e) => setTheaterSearch(e.target.value)}
                                                                    className="w-full bg-transparent text-white text-xs px-2 outline-none placeholder-gray-600"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto custom-scrollbar bg-[#121212]">
                                                            {filteredTheaters.length === 0 ? (
                                                                <div className="p-4 text-xs text-gray-500 text-center italic">No facilities found.</div>
                                                            ) : (
                                                                filteredTheaters.map(t => (
                                                                    <div 
                                                                        key={t._id}
                                                                        onClick={() => {
                                                                            setSelectedTheater(t._id);
                                                                            setIsDropdownOpen(false);
                                                                            setTheaterSearch('');
                                                                        }}
                                                                        className={`px-4 py-3 text-sm cursor-pointer border-b border-gray-800/50 last:border-0 hover:bg-orange-500/10 transition-colors flex flex-col ${selectedTheater === t._id ? 'bg-orange-500/20' : ''}`}
                                                                    >
                                                                        <span className={`font-semibold ${selectedTheater === t._id ? 'text-orange-400' : 'text-gray-200'}`}>{t.name}</span>
                                                                        <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase mt-0.5">{t.city}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Super Admin Card */}
                                <div 
                                    onClick={() => { setSelectedRole('admin'); setSelectedTheater(''); setIsDropdownOpen(false); }}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedRole === 'admin' ? 'bg-purple-500/10 border-purple-500/50' : 'bg-[#121212] border-gray-800 hover:border-gray-600'}`}
                                >
                                    <div className={`mt-0.5 ${selectedRole === 'admin' ? 'text-purple-400' : 'text-gray-500'}`}><Shield size={18}/></div>
                                    <div>
                                        <p className={`text-sm font-semibold ${selectedRole === 'admin' ? 'text-purple-400' : 'text-gray-300'}`}>Super Administrator</p>
                                        <p className="text-xs text-gray-500 mt-1">Full platform access. Can manage movies, global schedules, and all user accounts.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-800">
                                <button type="button" onClick={()=>setRoleModalUser(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-gray-800">
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isUpdatingRole}
                                    className="flex-1 bg-white text-black hover:bg-gray-200 font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    {isUpdatingRole ? "Saving..." : <><Save size={16}/> Save Permissions</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
                
                /* Custom Scrollbar for the Dropdown */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
            `}</style>
        </div>
    )
}

export default UsersList