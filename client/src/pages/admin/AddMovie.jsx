import React, { useState, useEffect } from 'react'
import Title from '../../components/admin/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { Image, Film, Youtube, Globe, Layers, ShieldCheck, Edit3, Plus, X, Search, DownloadCloud, Sparkles, Trash2 } from 'lucide-react'
import CustomCalendar from '../../components/admin/CustomCalendar'

const AddMovie = () => {
  const { axios, getToken } = useAppContext()
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingMovies, setExistingMovies] = useState([])
  const [searchEdit, setSearchEdit] = useState("")
  const [loadingList, setLoadingList] = useState(true)

  // --- OMDb Search & Suggestions State ---
  const [omdbSearch, setOmdbSearch] = useState("")
  const [omdbResults, setOmdbResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [suggestedMovies, setSuggestedMovies] = useState([])
  const [showOmdbDropdown, setShowOmdbDropdown] = useState(false)
  const [showEditDropdown, setShowEditDropdown] = useState(false)

  const [formData, setFormData] = useState({
    _id: '',
    title: '', tagline: '', overview: '', 
    poster_path: '', backdrop_path: '', trailer_url: '',
    release_date: '', genres: '', runtime: '',
    censor_rating: 'U/A', languages: '', formats: '', vote_average: '5.0'
  })

  // 1. Fetch Existing Movies for the "Edit" Dropdown
  useEffect(() => {
    const fetchMovies = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/admin/all-movies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) {
                setExistingMovies(data.movies);
            }
        } catch (error) { 
            console.error(error); 
            toast.error("Failed to load movie list");
        } finally {
            setLoadingList(false);
        }
    }
    fetchMovies();
  }, [axios, getToken]);

  // --- DYNAMIC TRENDING MOVIES ENGINE ---
  useEffect(() => {
      const loadSuggestions = async () => {
          try {
              // 1. Fetch the actual LIVE trending movies from TMDB's public API
              const tmdbRes = await fetch('https://api.themoviedb.org/3/trending/movie/week?api_key=4e44d9029b1270a757cddc766a1bcb63');
              const tmdbData = await tmdbRes.json();
              
              // 2. Extract the top 10 hottest titles globally right now
              const liveTitles = tmdbData.results.slice(0, 10).map(m => m.title);
              
              // 3. Feed those live titles into your existing OMDb system to get the IMDB IDs & Posters
              const requests = liveTitles.map(title => 
                  fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=483b0fdc`).then(r => r.json())
              );
              
              const results = await Promise.all(requests);
              
              // 4. Filter out any misses and update the UI
              setSuggestedMovies(results.filter(m => m.Response === "True"));
          } catch(e) {
              console.log("Failed to load live suggestions, falling back to local list.", e);
              // Fallback just in case the user has no internet
              setSuggestedMovies([]); 
          }
      };
      
      loadSuggestions();
  }, []);

  // 2. OMDb Live Search Logic
  const handleOMDbSearch = async (query) => {
      setOmdbSearch(query);
      if (query.length < 3) {
          setOmdbResults([]);
          setShowOmdbDropdown(false);
          return;
      }
      setIsSearching(true);
      setShowOmdbDropdown(true);
      try {
          const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=483b0fdc`);
          const data = await res.json();
          
          if (data.Search) {
              setOmdbResults(data.Search);
          } else {
              setOmdbResults([]);
          }
      } catch (err) {
          console.error("OMDb fetch error", err);
      } finally {
          setIsSearching(false);
      }
  };

  // 3. OMDb Auto-Fill Logic
  const handleOMDbSelect = async (imdbID) => {
      try {
          const res = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=483b0fdc`);
          const data = await res.json();
          
          const runtimeNumber = parseInt(data.Runtime?.split(" ")[0]) || 120;
          
          setFormData({
              _id: '',
              title: data.Title || '',
              tagline: data.Awards !== "N/A" ? data.Awards : 'Experience it in cinemas now.',
              overview: data.Plot !== "N/A" ? data.Plot : '',
              poster_path: data.Poster !== "N/A" ? data.Poster : '',
              backdrop_path: data.Poster !== "N/A" ? data.Poster : '', 
              trailer_url: '', 
              release_date: data.Released && data.Released !== "N/A" ? new Date(data.Released).toISOString().split('T')[0] : '',
              genres: data.Genre || '',
              runtime: runtimeNumber,
              censor_rating: data.Rated === "R" ? "A" : "U/A",
              languages: data.Language || 'Hindi, English',
              formats: "2D",
              vote_average: data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : '5.0'
          });
          
          setOmdbSearch("");
          setOmdbResults([]);
          setShowOmdbDropdown(false);
          setIsEditMode(false);
          toast.success("Details auto-filled! Please add Trailer URL before saving.");

      } catch (err) {
          toast.error("Failed to fetch full movie details");
      }
  };

  // 4. Select Existing Movie to Edit
  const handleSelectEdit = (movie) => {
      const formatArray = (arr) => Array.isArray(arr) ? arr.join(', ') : arr || '';
      const formatGenres = (genres) => Array.isArray(genres) ? genres.map(g => g.name || g).join(', ') : genres || '';

      setFormData({
          _id: movie._id || '',
          title: movie.title || '',
          tagline: movie.tagline || '',
          overview: movie.overview || '',
          poster_path: movie.poster_path || '',
          backdrop_path: movie.backdrop_path || '',
          trailer_url: movie.trailer_url || '',
          release_date: movie.release_date ? movie.release_date.split('T')[0] : '',
          genres: formatGenres(movie.genres) || '',
          runtime: movie.runtime || '',
          censor_rating: movie.censor_rating || 'U/A',
          languages: formatArray(movie.languages) || '',
          formats: formatArray(movie.formats) || '',
          vote_average: movie.vote_average || '5.0'
      });
      setIsEditMode(true);
      setSearchEdit("");
      setShowEditDropdown(false);
      toast.success(`Editing: ${movie.title}`);
  }

  const resetForm = () => {
      setFormData({ 
        _id: '', title: '', tagline: '', overview: '', poster_path: '', backdrop_path: '', trailer_url: '',
        release_date: '', genres: '', runtime: '', censor_rating: 'U/A', languages: '', formats: '', vote_average: '5.0'
      });
      setIsEditMode(false);
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken();
      const endpoint = isEditMode ? '/api/admin/update-movie' : '/api/admin/add-movie';
      
      const { data } = await axios.post(endpoint, formData, {
         headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        toast.success(isEditMode ? "Movie Updated Successfully!" : "Movie Added Successfully!");
        resetForm();
        const res = await axios.get('/api/admin/all-movies', { headers: { Authorization: `Bearer ${token}` } });
        if(res.data.success) setExistingMovies(res.data.movies);
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error(error);
      toast.error("Operation failed")
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${formData.title}"? This will also delete all associated shows.`)) return;
    try {
        const token = await getToken();
        const { data } = await axios.post('/api/admin/delete-movie', { id: formData._id }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if(data.success) {
            toast.success("Movie deleted successfully!");
            resetForm();
            const res = await axios.get('/api/admin/all-movies', { headers: { Authorization: `Bearer ${token}` } });
            if(res.data.success) setExistingMovies(res.data.movies);
        } else {
            toast.error(data.message);
        }
    } catch(error) {
        console.error(error);
        toast.error("Failed to delete movie");
    }
  }

  const filteredEditList = existingMovies.filter(m => m.title.toLowerCase().includes(searchEdit.toLowerCase()));

  return (
    <div className="w-full flex justify-center pb-20 text-white animate-fadeIn">
      <div className="w-full max-w-5xl space-y-6">
        {/* Form Container */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between">
              <Title text1={isEditMode ? "Edit" : "Add"} text2="Movie" />
              {isEditMode && (
                  <button onClick={resetForm} className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-1 hover:bg-red-500 hover:text-white transition">
                      <X size={14}/> Cancel Edit
                  </button>
              )}
          </div>

          {/* --- OMDb AUTO-FILL & LIVE TRENDING SECTION --- */}
          <div className="relative mt-8 z-30 flex flex-col bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 p-6 rounded-2xl mb-8 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                  <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <DownloadCloud size={18} className="text-blue-400"/> Fast Import via OMDb
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Search a title or click a live trending suggestion below to auto-fill details.</p>
                  </div>
                  
                  <div className="relative w-full md:w-80">
                      <div className="flex items-center bg-[#0b0b0b] border border-gray-700 rounded-xl px-4 py-2.5 focus-within:border-blue-500 transition-colors shadow-inner">
                          <Search size={18} className={isSearching ? "text-blue-400 animate-pulse" : "text-gray-500 mr-2"}/>
                          <input 
                            type="text" 
                            placeholder="Search any movie..."
                            value={omdbSearch}
                            onChange={(e) => handleOMDbSearch(e.target.value)}
                            onFocus={() => { if (omdbSearch.length >= 3) setShowOmdbDropdown(true); }}
                            className="bg-transparent w-full text-white outline-none text-sm placeholder-gray-500 ml-2"
                          />
                          {omdbSearch && (
                            <button onClick={() => { setOmdbSearch(''); setOmdbResults([]); setShowOmdbDropdown(false); }} className="text-gray-500 hover:text-white transition-colors ml-1">
                              <X size={14}/>
                            </button>
                          )}
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {showOmdbDropdown && omdbSearch && (
                          <div className="absolute top-full right-0 w-full bg-[#121212] border border-gray-700 rounded-xl mt-2 max-h-60 overflow-y-auto shadow-2xl z-50 custom-scrollbar">
                              {omdbResults.length > 0 ? omdbResults.map(movie => (
                                  <div 
                                    key={movie.imdbID} 
                                    onClick={() => handleOMDbSelect(movie.imdbID)}
                                    className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-4 border-b border-gray-800 last:border-0 transition-colors"
                                  >
                                      {movie.Poster && movie.Poster !== "N/A" ? (
                                          <img src={movie.Poster} className="w-10 h-14 object-cover rounded bg-gray-800 flex-shrink-0" alt="" onError={(e) => { e.target.style.display='none' }}/>
                                      ) : (
                                          <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                                              <Film size={16} className="text-gray-500" />
                                          </div>
                                      )}
                                      <div>
                                          <p className="text-sm font-bold text-white">{movie.Title}</p>
                                          <p className="text-[10px] text-gray-400">Year: {movie.Year} • Type: {movie.Type}</p>
                                      </div>
                                  </div>
                              )) : (
                                  <div className="p-4 text-center text-sm text-gray-500">
                                      {isSearching ? "Searching..." : "No movies found."}
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>

              {/* Live Trending Suggestions Row - Always Visible */}
              <div className="mt-2 pt-4 border-t border-blue-500/20 w-full animate-fadeIn">
                      <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold flex items-center gap-1">
                              <Sparkles size={12}/> Live Global Trending
                          </p>
                          {suggestedMovies.length === 0 && <span className="text-[10px] text-gray-500 animate-pulse">Syncing live data...</span>}
                      </div>
                      
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          {suggestedMovies.map(movie => (
                              <div 
                                  key={movie.imdbID}
                                  onClick={() => handleOMDbSelect(movie.imdbID)}
                                  className="min-w-[120px] w-[120px] bg-white/[0.02] border border-white/5 rounded-xl p-2 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/10 hover:-translate-y-1 transition-all duration-300 group shadow-lg"
                              >
                                  <div className="w-full h-36 rounded-lg bg-gray-900 mb-2 overflow-hidden shadow-md">
                                       {movie.Poster && movie.Poster !== "N/A" ? (
                                          <img src={movie.Poster} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" onError={(e) => { e.target.style.display='none' }}/>
                                       ) : <Film className="m-auto mt-12 text-gray-600"/>}
                                  </div>
                                  <p className="text-xs font-bold text-white truncate px-1">{movie.Title}</p>
                                  <p className="text-[10px] text-gray-500 px-1">{movie.Year}</p>
                              </div>
                          ))}
                      </div>
                  </div>
          </div>

          {/* --- EXISTING DATABASE EDIT SEARCH BAR --- */}
          <div className="relative mt-4 mb-8 z-20">
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
                  <Edit3 size={18} className="text-gray-400 mr-3"/>
                  <input 
                    type="text" 
                    placeholder={loadingList ? "Loading your database..." : "Search your existing database to edit a movie..."}
                    value={searchEdit}
                    onChange={(e) => { setSearchEdit(e.target.value); setShowEditDropdown(e.target.value.length > 0); }}
                    onFocus={() => { if (searchEdit) setShowEditDropdown(true); }}
                    className="bg-transparent w-full text-white outline-none text-sm placeholder-gray-500"
                    disabled={loadingList}
                  />
                  {searchEdit && (
                    <button onClick={() => { setSearchEdit(''); setShowEditDropdown(false); }} className="text-gray-500 hover:text-white transition-colors ml-2">
                      <X size={14}/>
                    </button>
                  )}
              </div>
              
              {showEditDropdown && searchEdit && (
                  <div className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 rounded-xl mt-2 max-h-60 overflow-y-auto shadow-2xl z-50 custom-scrollbar">
                      {filteredEditList.map(movie => (
                          <div 
                            key={movie._id} 
                            onClick={()=>handleSelectEdit(movie)}
                            className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-4 border-b border-gray-800 last:border-0 transition-colors"
                          >
                              {movie.poster_path ? (
                                  <img src={movie.poster_path} className="w-10 h-14 object-cover rounded bg-gray-800 flex-shrink-0" alt=""/>
                              ) : (
                                  <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                                      <Film size={16} className="text-gray-500" />
                                  </div>
                              )}
                              <div>
                                  <p className="text-sm font-bold text-white">{movie.title}</p>
                                  <p className="text-[10px] text-gray-400">Released: {new Date(movie.release_date).getFullYear()}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className={`space-y-6 bg-gray-800/40 p-8 rounded-2xl border transition-all ${isEditMode ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-gray-700'}`}>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                       <div>
                          <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Movie Title</label>
                          <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Jawan" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary transition" />
                       </div>
                       <div>
                          <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Tagline</label>
                          <input name="tagline" value={formData.tagline} onChange={handleChange} placeholder="e.g. Ready or Not?" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary transition" />
                       </div>
                    </div>

                    <div>
                       <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Overview</label>
                       <textarea required name="overview" value={formData.overview} onChange={handleChange} placeholder="Plot summary..." className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white h-32 outline-none focus:border-primary resize-none" />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                           <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Poster URL (Vertical)</label>
                           <input required name="poster_path" value={formData.poster_path} onChange={handleChange} placeholder="https://..." className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                        </div>
                        <div>
                           <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Backdrop URL (Horizontal)</label>
                           <input required name="backdrop_path" value={formData.backdrop_path} onChange={handleChange} placeholder="https://..." className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                        </div>
                    </div>

                    <div>
                       <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Trailer URL</label>
                       <div className="flex items-center bg-gray-900 border border-gray-600 rounded-lg px-3 focus-within:border-primary">
                            <Youtube size={18} className="text-red-500 mr-2"/>
                            <input name="trailer_url" value={formData.trailer_url} onChange={handleChange} placeholder="https://youtube.com/..." className="w-full p-3 bg-transparent text-white outline-none" />
                       </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                          <div>
                            <label className='text-xs font-bold text-gray-400 mb-1 flex items-center gap-1 uppercase'><ShieldCheck size={14}/> Censor Rating</label>
                            <select name="censor_rating" value={formData.censor_rating} onChange={handleChange} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary cursor-pointer">
                                <option value="U">U</option>
                                <option value="U/A">U/A</option>
                                <option value="A">A (Adults Only)</option>
                                <option value="S">S (Special)</option>
                            </select>
                          </div>
                          <div>
                            <label className='text-xs font-bold text-gray-400 mb-1 flex items-center gap-1 uppercase'><Globe size={14}/> Languages</label>
                            <input required name="languages" value={formData.languages} onChange={handleChange} placeholder="Hindi, Tamil" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                          </div>
                          <div>
                            <label className='text-xs font-bold text-gray-400 mb-1 flex items-center gap-1 uppercase'><Layers size={14}/> Formats</label>
                            <input required name="formats" value={formData.formats} onChange={handleChange} placeholder="2D, IMAX 3D" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                          </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                          <div>
                            <CustomCalendar 
                                label="Release Date"
                                name="release_date"
                                required={true}
                                value={formData.release_date}
                                onChange={handleChange}
                            />
                          </div>
                          <div>
                            <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Genres</label>
                            <input required name="genres" value={formData.genres} onChange={handleChange} placeholder="Action, Drama" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                          </div>
                          <div>
                            <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Runtime (min)</label>
                            <input type="number" required name="runtime" value={formData.runtime} onChange={handleChange} placeholder="150" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                          </div>
                          <div>
                            <label className='text-xs font-bold text-gray-400 mb-1 block uppercase'>Rating (/10)</label>
                            <input type="number" step="0.1" max="10" name="vote_average" value={formData.vote_average} onChange={handleChange} placeholder="8.5" className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary" />
                          </div>
                    </div>

                    {isEditMode ? (
                      <div className="flex gap-4 mt-4">
                          <button type="button" onClick={handleDelete} className="w-1/3 text-white font-bold py-4 rounded-xl shadow-[0_5px_20px_rgba(220,38,38,0.2)] transition-all active:scale-95 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700">
                              <Trash2 size={18}/> Delete
                          </button>
                          <button type="submit" className="w-2/3 text-white font-bold py-4 rounded-xl shadow-[0_5px_20px_rgba(234,88,12,0.2)] transition-all active:scale-95 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700">
                              <Edit3 size={18}/> Update Movie Details
                          </button>
                      </div>
                    ) : (
                      <button type="submit" className="w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-red-600 shadow-primary/20">
                          <Plus size={18}/> Add Movie to Library
                      </button>
                    )}
                </form>
              </div>

              {/* Restore right side preview pane */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 h-full sticky top-6 shadow-inner">
                      <h3 className="text-gray-400 font-medium mb-4 flex items-center gap-2"><Image size={18}/> Preview</h3>
                      
                      <div className="aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 relative flex items-center justify-center group shadow-xl">
                          {formData.poster_path ? (
                              <img src={formData.poster_path} alt="Poster" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} />
                          ) : <Film size={40} className="text-gray-600 opacity-50"/>}
                      </div>

                      <div className="mt-6 space-y-3 text-sm">
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                              <span className="text-gray-500">Rating</span> 
                              <span className="text-white font-bold">{formData.censor_rating || "-"}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                              <span className="text-gray-500">Formats</span> 
                              <span className="text-white text-right max-w-[150px] truncate">{formData.formats || "-"}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                              <span className="text-gray-500">Runtime</span> 
                              <span className="text-white">{formData.runtime ? `${formData.runtime} mins` : "-"}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddMovie