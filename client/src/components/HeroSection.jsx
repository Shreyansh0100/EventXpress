import React, { useEffect, useState } from 'react'
import { Calendar, Star, Info, Ticket, TrendingUp, MonitorPlay, Languages, CalendarClock } from 'lucide-react' 
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const HeroSection = () => {
  const navigate = useNavigate()
  const { axios } = useAppContext()
  const [heroMovies, setHeroMovies] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Fetch top 5 movies for the slider
  useEffect(() => {
    const fetchHeroMovies = async () => {
        try {
            const { data } = await axios.get('/api/show/now-playing')
            if (data.success) setHeroMovies(data.movies.slice(0, 5))
        } catch (error) { console.error(error) }
    }
    fetchHeroMovies()
  }, [axios])

  // Auto-play Carousel
  useEffect(() => {
    if (heroMovies.length === 0) return
    const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % heroMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroMovies])

  const getHighResImage = (url) => {
      if (!url) return '';
      if (url.includes('image.tmdb.org')) {
          return url.replace(/\/w\d+\//, '/original/');
      }
      return url;
  }

  if (heroMovies.length === 0) return (
      <div className="w-full h-[500px] md:h-[80vh] bg-[#050505] animate-pulse"></div>
  )

  return (
    <div className='relative w-full h-[550px] md:h-[80vh] min-h-[500px] md:min-h-[600px] overflow-hidden bg-[#050505] font-outfit'>
      
      {heroMovies.map((movie, idx) => {
        const isActive = idx === currentIndex;
        
        // --- DATE LOGIC ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const releaseDate = new Date(movie.release_date);
        const isUpcoming = releaseDate > today; 

        const hdBackdrop = getHighResImage(movie.backdrop_path || movie.poster_path);
        const hdPoster = getHighResImage(movie.poster_path);

        return (
          <div 
            key={movie._id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
          >
            {/* 1. AMBIENT BLURRED BACKGROUND */}
            <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms] ease-linear opacity-50 md:opacity-40 blur-xl md:blur-2xl ${isActive ? 'scale-110' : 'scale-100'}`}
                style={{ backgroundImage: `url(${hdBackdrop})` }}
            ></div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50"></div>

            {/* 2. FOREGROUND CONTENT */}
            <div className='relative z-20 h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-16 pt-20 md:pt-16 gap-6 md:gap-8'>
                
                <div className={`w-full md:w-3/5 lg:w-1/2 flex flex-col items-center md:items-start text-center md:text-left ${isActive ? 'animate-slideUp' : ''}`}>
                    
                    {/* Badges / Chips */}
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 mb-4 md:mb-5">
                        {isUpcoming ? (
                             <span className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                <CalendarClock size={12} className="sm:w-3.5 sm:h-3.5"/> Coming Soon
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5"/> Top 5
                            </span>
                        )}

                        {movie.languages && (
                            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md border border-white/20 uppercase tracking-wider">
                                <Languages size={12} className="sm:w-3.5 sm:h-3.5"/> {Array.isArray(movie.languages) ? movie.languages[0] : movie.languages}
                            </span>
                        )}
                    </div>

                    {/* Movie Title */}
                    <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-3 md:mb-4 tracking-tight drop-shadow-2xl line-clamp-2 md:line-clamp-none'>
                        {movie.title}
                    </h1>

                    {/* Movie Stats */}
                    <div className='flex flex-wrap justify-center md:justify-start items-center gap-3 sm:gap-4 md:gap-6 text-gray-300 text-xs sm:text-sm md:text-base mb-4 md:mb-6 font-medium'>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm border border-gray-800 shadow-inner">
                            <Star className="fill-yellow-400 text-yellow-400 w-3 h-3 sm:w-4 sm:h-4"/>
                            <span className="font-bold text-white">{movie.vote_average?.toFixed(1) || "N/A"}/10</span>
                        </div>
                        <div className='flex items-center gap-1.5 sm:gap-2'>
                            <Calendar className='w-3 h-3 sm:w-4 sm:h-4 text-gray-400'/> 
                            {new Date(movie.release_date).getFullYear()}
                        </div>
                    </div>

                    <p className="text-gray-400 text-xs sm:text-sm md:text-base line-clamp-3 md:line-clamp-3 mb-6 md:mb-8 max-w-xl leading-relaxed">
                        {movie.overview || "Experience the biggest blockbuster of the year."}
                    </p>

                    {/* Action Buttons */}
                    <div className='flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 w-full sm:w-auto'>
                        <button 
                            onClick={()=> navigate(`/movies/${movie._id}`)} 
                            className={`group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1 active:scale-95 w-full sm:w-auto text-sm sm:text-base
                                ${isUpcoming 
                                    ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-[0_5px_20px_rgba(37,99,235,0.4)]' 
                                    : 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-[0_5px_20px_rgba(248,69,101,0.4)]'
                                }`}
                        >
                            <Ticket size={18} className="sm:w-5 sm:h-5 group-hover:rotate-[-10deg] transition-transform"/> 
                            {isUpcoming ? "Pre-Book Now" : "Book Tickets"}
                        </button>
                        <button 
                            onClick={()=> navigate(`/movies/${movie._id}`)} 
                            className='group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold backdrop-blur-md transition-all hover:-translate-y-1 active:scale-95 w-full sm:w-auto text-sm sm:text-base'
                        >
                            <Info size={18} className="sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors"/> 
                            More Info
                        </button>
                    </div>
                </div>

                {/* RIGHT: Crisp Vertical Poster */}
                <div className={`hidden md:block w-2/5 lg:w-1/3 p-4 perspective-1000 ${isActive ? 'animate-fadeIn' : ''}`}>
                    <div className="relative w-full max-w-[280px] lg:max-w-[320px] mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 transform rotate-y-[-10deg] hover:rotate-y-0 transition-transform duration-500">
                        <img 
                            src={hdPoster} 
                            alt={movie.title} 
                            className="w-full h-auto object-cover"
                            style={{ imageRendering: 'high-quality' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                </div>

            </div>
          </div>
        )
      })}

      {/* SLIDER INDICATORS */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center md:justify-start md:left-16 gap-2 z-30 pointer-events-auto">
        {heroMovies.map((_, idx) => (
            <button 
                key={idx} 
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer overflow-hidden relative
                    ${idx === currentIndex ? 'w-8 sm:w-10 bg-white/20' : 'w-2 sm:w-3 bg-gray-600 hover:bg-gray-400'}`}
                title={`Go to slide ${idx + 1}`}
            >
                {idx === currentIndex && (
                    <div className="absolute top-0 left-0 h-full bg-primary animate-progress"></div>
                )}
            </button>
        ))}
      </div>

      <style>{`
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        .animate-progress {
            animation: progress 5000ms linear infinite;
        }
        @media (max-width: 768px) {
            .perspective-1000 { perspective: 1000px; }
        }
      `}</style>
      
    </div>
  )
}

export default HeroSection