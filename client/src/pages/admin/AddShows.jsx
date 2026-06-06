import React, { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { CheckIcon, Clock, Calendar, Trash2, Plus, CalendarRange, IndianRupee, Search, MapPin, Armchair, Languages, Layers, RefreshCw, Edit2, X, Wand2, Film, ChevronDown, Ticket, CheckSquare, Square } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import CustomCalendar from '../../components/admin/CustomCalendar'

const AddShows = () => {

    const { axios, getToken, user } = useAppContext()

    const [allMovies, setAllMovies] = useState([]);
    const [theaters, setTheaters] = useState([]); 
    const [movieSearch, setMovieSearch] = useState(""); 
    
    const [selectedMovie, setSelectedMovie] = useState(null);
    // --- UPGRADE: Multi-Theater Selection State ---
    const [selectedTheaters, setSelectedTheaters] = useState([]); 
    
    const [schedule, setSchedule] = useState({}); 
    const [existingShows, setExistingShows] = useState({});
    const [loadingExisting, setLoadingExisting] = useState(false);

    const [showLanguage, setShowLanguage] = useState("");
    const [showFormat, setShowFormat] = useState("");
    const [prices, setPrices] = useState({ royal: '', premium: '', plaza: '' });

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTimes, setSelectedTimes] = useState([]); 
    const [frequency, setFrequency] = useState('ALL'); 
    const [manualTime, setManualTime] = useState("");
    
    const [addingShow, setAddingShow] = useState(false)
    const [loadingData, setLoadingData] = useState(true)

    const [editingShow, setEditingShow] = useState(null);
    const [editForm, setEditForm] = useState({
        time: '',
        format: '',
        prices: { royal: '', premium: '', plaza: '' }
    });

    const PRESET_SLOTS = ["09:00", "12:00", "15:00", "18:00", "21:00"];

    useEffect(() => { if (user) fetchData(); }, [user]);

    useEffect(() => {
        if (selectedMovie) {
            setShowLanguage(selectedMovie.languages?.[0] || "");
            setShowFormat(selectedMovie.formats?.[0] || "");
        }
        if (selectedMovie && selectedTheaters.length > 0) {
            fetchExistingSchedule();
        } else {
            setExistingShows({});
        }
    }, [selectedMovie, selectedTheaters]);

    const fetchData = async () => {
        try {
            const token = await getToken();
            const [movieRes, theaterRes] = await Promise.all([
                axios.get('/api/admin/all-movies', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/all-theaters', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (movieRes.data.success) setAllMovies(movieRes.data.movies);
            if (theaterRes.data.success) setTheaters(theaterRes.data.theaters);
        } catch (error) {
            toast.error("Failed to load initial data");
        } finally {
            setLoadingData(false);
        }
    };

    // --- UPGRADE: Fetch shows for ALL selected theaters ---
    const fetchExistingSchedule = async () => {
        setLoadingExisting(true);
        try {
            const { data } = await axios.get('/api/admin/all-shows', { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (data.success) {
                const relevant = data.shows.filter(s => 
                    (s.movie._id === selectedMovie._id || s.movie === selectedMovie._id) && 
                    selectedTheaters.includes(s.theater._id || s.theater)
                );

                const grouped = {};
                relevant.forEach(show => {
                    const dateKey = new Date(show.showDateTime).toISOString().split('T')[0];
                    const time = new Date(show.showDateTime).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false});
                    if (!grouped[dateKey]) grouped[dateKey] = [];
                    grouped[dateKey].push({ 
                        id: show._id, 
                        time, 
                        theaterName: show.theater.name, // Track which theater this show belongs to
                        fullData: show 
                    });
                });
                
                // Sort times within each date
                Object.keys(grouped).forEach(date => {
                    grouped[date].sort((a, b) => a.time.localeCompare(b.time));
                });
                
                setExistingShows(grouped);
            }
        } catch (error) { console.error(error); } 
        finally { setLoadingExisting(false); }
    }

    const handleDeleteExistingShow = async (showId) => {
        if(!window.confirm("Delete this specific show time?")) return;
        try {
            const { data } = await axios.post('/api/admin/delete-show', { id: showId }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if(data.success) {
                toast.success("Show Removed");
                fetchExistingSchedule(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) { toast.error("Delete failed"); }
    }

    const handleEditClick = (showData) => {
        setEditingShow(showData);
        setEditForm({
            time: showData.time,
            format: showData.fullData.format,
            prices: {
                royal: showData.fullData.ticketPrice.royal,
                premium: showData.fullData.ticketPrice.premium,
                plaza: showData.fullData.ticketPrice.plaza
            }
        });
    };

    const handleUpdateShow = async () => {
        try {
            const token = await getToken();
            const datePart = new Date(editingShow.fullData.showDateTime).toISOString().split('T')[0];
            const newDateTime = `${datePart}T${editForm.time}`;

            const payload = {
                id: editingShow.id,
                showDateTime: new Date(newDateTime),
                format: editForm.format,
                ticketPrice: editForm.prices
            };

            const { data } = await axios.post('/api/admin/update-show', payload, { headers: { Authorization: `Bearer ${token}` } });
            
            if(data.success) {
                toast.success("Show Updated");
                setEditingShow(null);
                fetchExistingSchedule();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Update Failed");
        }
    };

    // --- UPGRADE: Multi-Theater Selection Handlers ---
    const toggleTheater = (id) => {
        setSelectedTheaters(prev => 
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    }

    const toggleAllTheaters = () => {
        if (selectedTheaters.length === theaters.length) {
            setSelectedTheaters([]); // Deselect all
        } else {
            setSelectedTheaters(theaters.map(t => t._id)); // Select all
        }
    }

    // --- Schedule Generation ---
    const handleGenerateSchedule = () => {
        if (!startDate || !endDate) return toast.error("Select dates");
        if (selectedTimes.length === 0) return toast.error("Select times");
        if (new Date(startDate) > new Date(endDate)) return toast.error("Invalid date range");

        const newSchedule = { ...schedule };
        let currentDate = new Date(startDate);
        const lastDate = new Date(endDate);

        while (currentDate <= lastDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); 
            let shouldAdd = frequency === 'ALL' || (dayOfWeek === 0 || dayOfWeek === 6);

            if (shouldAdd) {
                const existing = newSchedule[dateStr] || [];
                newSchedule[dateStr] = [...new Set([...existing, ...selectedTimes])].sort();
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        setSchedule(newSchedule);
        toast.success("Schedule Generated");
    };

    const toggleTimeSlot = (time) => {
        setSelectedTimes(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort());
    };

    const addManualTime = () => {
        if (!manualTime) return;
        if (!selectedTimes.includes(manualTime)) setSelectedTimes(prev => [...prev, manualTime].sort());
        setManualTime("");
    }

    const handleRemoveSlot = (date, time) => {
        setSchedule(prev => {
            const updated = prev[date].filter(t => t !== time);
            if (updated.length === 0) { const { [date]: _, ...rest } = prev; return rest; }
            return { ...prev, [date]: updated };
        });
    };

    const handleQuickFillPrices = () => {
        setPrices({ royal: 450, premium: 300, plaza: 180 });
        toast.success("Standard Pricing Applied!", { icon: "🪄" });
    }

    // --- UPGRADE: Multi-Theater Submission ---
    const handleSubmit = async () => {
        if (!selectedMovie || selectedTheaters.length === 0 || !Object.keys(schedule).length) return toast.error('Incomplete Selection');
        if (!showLanguage || !showFormat) return toast.error('Set Language & Format');
        if(!prices.royal || !prices.premium || !prices.plaza) return toast.error('Set Prices');

        setAddingShow(true);
        try {
            const token = await getToken();
            const showsInput = Object.entries(schedule).map(([date, time]) => ({ date, time }));
            
            // Map over every selected theater and create a promise to add the shows
            const promises = selectedTheaters.map(theaterId => {
                const payload = {
                    movieId: selectedMovie._id,
                    theaterId: theaterId,
                    showsInput: showsInput,
                    priceConfig: prices,
                    language: showLanguage,
                    format: showFormat
                };
                return axios.post('/api/admin/add-show', payload, { headers: { Authorization: `Bearer ${token}` } });
            });

            // Wait for all theaters to be scheduled
            await Promise.all(promises);

            toast.success(`Successfully pushed to ${selectedTheaters.length} cinemas!`);
            setSchedule({});
            setPrices({ royal: '', premium: '', plaza: '' });
            fetchExistingSchedule(); 
        } catch (error) { 
            toast.error('Server Error while adding to one or more theaters'); 
        } finally { 
            setAddingShow(false); 
        }
    }

    if (loadingData) return <Loading />

    const filteredMovies = allMovies.filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase()));

    return (
        <div className="w-full max-w-[1600px] mx-auto pb-20 text-white animate-fadeIn">
            
            {/* Edit Modal */}
            {editingShow && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#121212] border border-gray-800 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                        <button onClick={()=>setEditingShow(null)} className="absolute top-5 right-5 text-gray-500 hover:text-white bg-gray-900 hover:bg-red-500 p-2 rounded-full transition-all"><X size={18}/></button>
                        
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Edit2 size={24}/></div>
                            <div>
                                <h3 className="text-xl font-bold">Edit Show Details</h3>
                                <p className="text-xs text-gray-500">{new Date(editingShow.fullData.showDateTime).toDateString()} • <span className="text-primary">{editingShow.theaterName}</span></p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                    <input type="time" value={editForm.time} onChange={(e)=>setEditForm({...editForm, time: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-primary transition-colors [color-scheme:dark]"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Format</label>
                                <div className="relative">
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                    <select value={editForm.format} onChange={(e)=>setEditForm({...editForm, format: e.target.value})} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-primary appearance-none transition-colors">
                                        {selectedMovie?.formats?.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16}/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Ticket Prices (₹)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-2 focus-within:border-yellow-500 transition-colors">
                                        <span className="text-[10px] text-yellow-500 font-bold block text-center mb-1">ROYAL</span>
                                        <input type="number" placeholder="0" value={editForm.prices.royal} onChange={(e)=>setEditForm({...editForm, prices: {...editForm.prices, royal: e.target.value}})} className="w-full bg-transparent text-center text-sm font-mono text-white outline-none"/>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-2 focus-within:border-purple-500 transition-colors">
                                        <span className="text-[10px] text-purple-400 font-bold block text-center mb-1">PREMIUM</span>
                                        <input type="number" placeholder="0" value={editForm.prices.premium} onChange={(e)=>setEditForm({...editForm, prices: {...editForm.prices, premium: e.target.value}})} className="w-full bg-transparent text-center text-sm font-mono text-white outline-none"/>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-2 focus-within:border-blue-500 transition-colors">
                                        <span className="text-[10px] text-blue-400 font-bold block text-center mb-1">PLAZA</span>
                                        <input type="number" placeholder="0" value={editForm.prices.plaza} onChange={(e)=>setEditForm({...editForm, prices: {...editForm.prices, plaza: e.target.value}})} className="w-full bg-transparent text-center text-sm font-mono text-white outline-none"/>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleUpdateShow} className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 rounded-xl mt-6 shadow-lg shadow-primary/20 transition-all active:scale-95 flex justify-center items-center gap-2">
                                <CheckIcon size={18}/> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <Title text1="Schedule" text2="Manager" />
                    <p className="text-gray-400 text-sm mt-1">Assign movies to theaters and set timings.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input type="text" placeholder="Search movie database..." value={movieSearch} onChange={(e)=>setMovieSearch(e.target.value)} className="bg-[#121212] border border-gray-800 text-white pl-11 pr-4 py-3 rounded-full text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all w-full md:w-72 shadow-inner"/>
                </div>
            </div>
            
            {/* Step 1: Select Movie */}
            <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                    Select Movie
                </h3>
                {allMovies.length === 0 ? <div className="p-8 bg-[#121212] rounded-2xl border border-dashed border-gray-800 text-center text-gray-500 flex flex-col items-center"><Film size={32} className="mb-2 opacity-50"/> No movies found. Add movies first.</div> : (
                    <div className="flex gap-5 overflow-x-auto pb-6 snap-x scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent pt-2 px-2">
                        {filteredMovies.map((movie) => (
                            <div key={movie._id} onClick={() => setSelectedMovie(movie)} className={`snap-start min-w-[150px] w-[150px] cursor-pointer transition-all duration-300 relative rounded-2xl overflow-hidden group ${selectedMovie?._id === movie._id ? 'ring-2 ring-primary ring-offset-4 ring-offset-gray-950 scale-105 shadow-xl shadow-primary/20' : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'}`}>
                                <div className="aspect-[2/3] bg-gray-900 relative border border-gray-800 rounded-t-2xl overflow-hidden">
                                    {movie.poster_path ? (
                                        <img src={movie.poster_path} alt={movie.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Film size={32} className="text-gray-700"/></div>
                                    )}
                                    {selectedMovie?._id === movie._id && <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-[2px]"><div className="bg-white text-primary p-2.5 rounded-full shadow-xl animate-bounce"><CheckIcon size={24} strokeWidth={4}/></div></div>}
                                </div>
                                <div className="p-3 bg-[#1a1a1a] border border-t-0 border-gray-800 rounded-b-2xl">
                                    <p className="font-bold text-sm truncate text-white">{movie.title}</p>
                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5"><Clock size={10} className="inline mr-1"/>{movie.runtime} mins</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Configurations */}
                <div className="xl:col-span-1 space-y-6">
                    
                    {/* Step 2: Multi-Theater Selection & Format */}
                    <div className={`bg-white/[0.02] backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300 ${!selectedMovie ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-gray-300 text-sm font-bold uppercase tracking-wider mb-5 flex justify-between items-center">
                            <span className="flex items-center gap-2"><span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Configuration</span>
                        </label>
                        
                        <div className="space-y-5">
                            {/* UPGRADE: Multi-Select Theater List */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider ml-1">Select Cinemas</span>
                                    <button onClick={toggleAllTheaters} className="text-[10px] text-primary hover:text-white transition-colors flex items-center gap-1 font-bold">
                                        {selectedTheaters.length === theaters.length ? <CheckSquare size={12}/> : <Square size={12}/>} 
                                        {selectedTheaters.length === theaters.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                
                                <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                    {theaters.map(t => (
                                        <div 
                                            key={t._id} 
                                            onClick={() => toggleTheater(t._id)}
                                            className={`flex items-center gap-3 p-3 border-b border-gray-800/50 last:border-0 cursor-pointer transition-colors hover:bg-gray-800 ${selectedTheaters.includes(t._id) ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${selectedTheaters.includes(t._id) ? 'bg-primary border-primary text-white' : 'border-gray-500'}`}>
                                                {selectedTheaters.includes(t._id) && <CheckIcon size={12}/>}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${selectedTheaters.includes(t._id) ? 'text-white' : 'text-gray-400'}`}>{t.name}</p>
                                                <p className="text-[9px] text-gray-600">{t.city}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedTheaters.length > 0 && (
                                    <p className="text-[10px] text-green-500 mt-2 text-right">Targeting {selectedTheaters.length} cinemas</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group">
                                    <Languages size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors"/>
                                    <select value={showLanguage} onChange={(e) => setShowLanguage(e.target.value)} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 pl-10 pr-8 text-white outline-none focus:border-primary appearance-none transition-colors text-xs cursor-pointer shadow-inner">
                                        <option value="">Language</option>
                                        {selectedMovie?.languages?.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                                </div>
                                <div className="relative group">
                                    <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors"/>
                                    <select value={showFormat} onChange={(e) => setShowFormat(e.target.value)} className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 pl-10 pr-8 text-white outline-none focus:border-primary appearance-none transition-colors text-xs cursor-pointer shadow-inner">
                                        <option value="">Format</option>
                                        {selectedMovie?.formats?.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Prices */}
                    <div className={`bg-white/[0.02] backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300 ${!selectedMovie ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center mb-5">
                            <label className="text-gray-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> Set Prices
                            </label>
                            <button type="button" onClick={handleQuickFillPrices} className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all font-bold">
                                <Wand2 size={12}/> Quick Fill
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {['Royal', 'Premium', 'Plaza'].map(type => (
                                <div key={type} className={`flex items-center bg-[#1a1a1a] rounded-xl border focus-within:ring-1 transition-all px-4 py-3 shadow-inner
                                    ${type==='Royal' ? 'border-yellow-500/20 focus-within:border-yellow-500 focus-within:ring-yellow-500/30' : 
                                      type==='Premium' ? 'border-purple-500/20 focus-within:border-purple-500 focus-within:ring-purple-500/30' : 
                                      'border-teal-500/20 focus-within:border-teal-500 focus-within:ring-teal-500/30'}`}
                                >
                                    <Armchair size={16} className={`mr-3 ${type==='Royal'?'text-yellow-500':type==='Premium'?'text-purple-400':'text-teal-400'}`}/>
                                    <span className={`text-xs font-bold w-24 tracking-wide ${type==='Royal'?'text-yellow-500':type==='Premium'?'text-purple-400':'text-teal-400'}`}>{type.toUpperCase()}</span>
                                    <div className="flex-1 flex items-center gap-1 border-l border-gray-700 pl-4">
                                        <IndianRupee size={14} className="text-gray-500"/>
                                        <input type="number" value={prices[type.toLowerCase()]} onChange={(e) => setPrices({...prices, [type.toLowerCase()]: e.target.value})} placeholder="0.00" className="bg-transparent outline-none w-full text-white text-sm font-mono font-medium placeholder-gray-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 4: Schedule Builder */}
                    <div className={`bg-white/[0.02] backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-2xl transition-all duration-300 ${(!selectedMovie || selectedTheaters.length === 0) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-gray-300 text-sm font-bold uppercase tracking-wider mb-5 flex justify-between items-center">
                            <span className="flex items-center gap-2"><span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span> Build Schedule</span>
                        </label>
                        
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5 ml-1">Start Date</span>
                                <CustomCalendar value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1.5 ml-1">End Date</span>
                                <CustomCalendar value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        
                        <div className="flex bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800 mb-5 shadow-inner">
                            <button onClick={()=>setFrequency('ALL')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${frequency === 'ALL' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Every Day</button>
                            <button onClick={()=>setFrequency('WEEKEND')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${frequency === 'WEEKEND' ? 'bg-primary text-white shadow-[0_0_10px_rgba(248,69,101,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}>Weekends Only</button>
                        </div>

                        <div className="mb-6 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 shadow-inner">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-3">Time Slots</span>
                            <div className="flex flex-wrap gap-2.5 mb-4">
                                {PRESET_SLOTS.map(time => (
                                    <button key={time} onClick={() => toggleTimeSlot(time)} className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${selectedTimes.includes(time) ? 'bg-primary/20 border-primary text-primary font-bold shadow-[0_0_10px_rgba(248,69,101,0.2)]' : 'bg-[#121212] border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                                        {time}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                                    <input type="time" value={manualTime} onChange={(e)=>setManualTime(e.target.value)} className="w-full bg-[#121212] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-primary transition-colors [color-scheme:dark]"/>
                                </div>
                                <button onClick={addManualTime} className="bg-gray-800 hover:bg-white hover:text-black text-white px-4 rounded-lg transition-colors flex items-center justify-center"><Plus size={16}/></button>
                            </div>
                        </div>

                        <button onClick={handleGenerateSchedule} className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                            <CalendarRange size={18} /> Generate Draft
                        </button>
                    </div>
                </div>

                {/* Right Column: Previews & Existing */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    
                    {/* Database Existing View (Now Supports Multi-Theater viewing) */}
                    {selectedMovie && selectedTheaters.length > 0 && (
                        <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <RefreshCw size={20} className={`text-blue-500 ${loadingExisting ? 'animate-spin' : ''}`}/> Live Schedules
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Existing shows for this movie across selected cinemas.</p>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">Live System</span>
                            </div>
                            
                            {loadingExisting ? (
                                <div className="text-center py-12 text-gray-500 flex flex-col items-center"><RefreshCw size={24} className="animate-spin mb-3 opacity-50"/> Syncing with database...</div>
                            ) : Object.keys(existingShows).length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-700 flex flex-col items-center">
                                    <Ticket size={32} className="mb-3 opacity-30"/>
                                    No shows scheduled here yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.entries(existingShows).sort().map(([date, shows]) => (
                                        <div key={date} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden shadow-sm group">
                                            <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                                                <p className="text-xs font-bold text-gray-300 flex items-center gap-2">
                                                    <Calendar size={14} className="text-blue-400"/> {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' })}
                                                </p>
                                            </div>
                                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {shows.map(show => (
                                                    <div key={show.id} className="flex items-center justify-between bg-[#121212] border border-gray-800 rounded-lg px-3 py-2 group/time hover:border-gray-600 transition-colors">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={12} className="text-gray-500"/>
                                                                <span className="text-sm font-bold text-white font-mono">{show.time}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{show.theaterName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover/time:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEditClick(show)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Edit"><Edit2 size={12}/></button>
                                                            <button onClick={() => handleDeleteExistingShow(show.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete"><Trash2 size={12}/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Draft Review */}
                    <div className="flex-1 bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-white/5 p-8 shadow-2xl min-h-[350px] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span> 
                                    Review Draft Schedule
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 ml-9">Verify your generated schedule before pushing to the database.</p>
                            </div>
                            {Object.keys(schedule).length > 0 && (
                                <button onClick={()=>setSchedule({})} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 transition hover:bg-red-500/20 font-bold"><Trash2 size={14}/> Clear Draft</button>
                            )}
                        </div>

                        {Object.keys(schedule).length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3 bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-800">
                                <div className="bg-gray-800 p-4 rounded-full mb-2"><Clock size={32} className="opacity-50"/></div>
                                <p className="font-medium text-sm">Use the builder on the left to generate a schedule.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(schedule).sort().map(([date, times]) => (
                                    <div key={date} className="bg-[#1a1a1a] rounded-2xl border border-green-900/40 overflow-hidden shadow-sm">
                                        <div className="bg-green-900/10 px-4 py-3 flex justify-between items-center border-b border-green-900/20">
                                            <span className="font-bold text-green-400 text-xs flex items-center gap-2"><Calendar size={14}/> {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Pending Save</span>
                                        </div>
                                        <div className="p-4 flex flex-wrap gap-2.5">
                                            {times.map((time) => (
                                                <div key={time} className="group relative bg-[#121212] border border-gray-700 hover:border-green-500 text-white text-xs font-mono font-bold px-3 py-2 rounded-lg transition-colors cursor-default shadow-inner">
                                                    {time}
                                                    <button onClick={() => handleRemoveSlot(date, time)} className="absolute -top-2 -right-2 bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all border border-gray-700 hover:border-red-500 shadow-lg"><X size={10} strokeWidth={3}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-auto pt-6 border-t border-gray-800 flex justify-end">
                            <button onClick={handleSubmit} disabled={addingShow || Object.keys(schedule).length === 0} className="bg-gradient-to-r from-primary to-rose-600 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(248,69,101,0.3)] transition-all active:scale-95 w-full md:w-auto flex items-center justify-center gap-2">
                                {addingShow ? <><RefreshCw size={20} className="animate-spin"/> Saving to Server...</> : <><CheckIcon size={20} strokeWidth={3}/> Push to Live System</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddShows