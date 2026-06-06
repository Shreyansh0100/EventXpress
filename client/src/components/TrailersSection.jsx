import React, { useState, useEffect } from 'react'
import ReactPlayer from 'react-player/youtube'
import { PlayCircleIcon, Film, Play } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const TrailersSection = () => {
    const { axios } = useAppContext()
    const [trailers, setTrailers] = useState([])
    
    // NEW: We use an index now to easily go to the "next" video
    const [currentIndex, setCurrentIndex] = useState(0)
    
    // NEW: Track if the user is actively watching so we don't interrupt them
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    
    const [loading, setLoading] = useState(true)

    // Fetch movies
    useEffect(() => {
        const fetchTrailers = async () => {
            try {
                const { data } = await axios.get('/api/movie/latest')
                
                if (data.success && data.movies.length > 0) {
                    const validTrailers = data.movies.filter(m => 
                        m.trailer_url && (m.trailer_url.includes('youtube') || m.trailer_url.includes('youtu.be'))
                    );
                    
                    setTrailers(validTrailers);
                }
            } catch (error) {
                console.error("Failed to load trailers", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrailers()
    }, [axios])

    // --- AUTO-SCROLL LOGIC ---
    useEffect(() => {
        // If there are no trailers, or if the user is currently watching a video, DO NOT scroll.
        if (trailers.length === 0 || isVideoPlaying) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                // We only cycle through the first 4 trailers (since we slice(0,4) in the UI)
                const maxItems = Math.min(trailers.length, 4);
                return (prevIndex + 1) % maxItems;
            });
        }, 5000); // 5000ms = 5 seconds per trailer

        return () => clearInterval(interval); // Cleanup on unmount
    }, [trailers.length, isVideoPlaying]);

    // Whenever the index changes, reset the playing state just in case
    useEffect(() => {
        setIsVideoPlaying(false);
    }, [currentIndex]);


    // --- HD YOUTUBE THUMBNAIL EXTRACTOR ---
    const getHDThumbnail = (movie) => {
        if (!movie?.trailer_url) return movie?.backdrop_path;
        
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = movie.trailer_url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : movie.backdrop_path;
    }

    if (loading || trailers.length === 0) return null;

    const currentTrailer = trailers[currentIndex];

    return (
        <div className='px-4 sm:px-6 md:px-16 lg:px-24 xl:px-36 py-12 sm:py-20 bg-[#050505] font-outfit relative overflow-hidden'>
            
            {/* Background ambient light */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-primary/5 blur-[120px] pointer-events-none rounded-full"></div>
            
            {/* Section Heading */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-start gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-[1000px] mx-auto text-center sm:text-left relative z-10">
                <div className="bg-gradient-to-br from-primary to-rose-600 p-2 sm:p-2.5 rounded-xl text-white shadow-[0_0_15px_rgba(248,69,101,0.3)] shrink-0">
                    <Film size={20} className="sm:w-6 sm:h-6"/>
                </div>
                <h2 className='text-white font-black text-2xl sm:text-3xl md:text-4xl tracking-tight'>Latest Trailers</h2>
            </div>

            {/* Main Video Player Container */}
            <div className='relative w-full max-w-[1000px] mx-auto bg-[#0a0a0a] p-1.5 sm:p-2 md:p-3 rounded-2xl sm:rounded-[2rem] border border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10'>
                
                <div className="relative aspect-video rounded-xl sm:rounded-3xl overflow-hidden bg-black ring-1 ring-white/10 shadow-inner group">
                    {currentTrailer && (
                        <ReactPlayer 
                            key={currentTrailer._id} // Forces player to remount on change
                            url={currentTrailer.trailer_url} 
                            controls={true} 
                            playing={true} 
                            width="100%" 
                            height="100%"
                            light={getHDThumbnail(currentTrailer)} 
                            onPlay={() => setIsVideoPlaying(true)} // Pause the auto-scroll!
                            onPause={() => setIsVideoPlaying(false)} // Resume auto-scroll
                            onEnded={() => setIsVideoPlaying(false)} // Resume auto-scroll
                            playIcon={
                                <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-full border border-white/20 cursor-pointer hover:scale-110 hover:bg-primary/80 hover:border-primary transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center">
                                    <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white fill-white ml-1" />
                                </div>
                            }
                            config={{
                                youtube: {
                                    playerVars: { showinfo: 0, rel: 0, modestbranding: 1 }
                                }
                            }}
                            className="react-player"
                        />
                    )}
                </div>
            </div>

            {/* Horizontal Thumbnail List */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 max-w-[1000px] mx-auto relative z-10'>
                {trailers.slice(0, 4).map((movie, idx) => {
                    const isActive = currentIndex === idx;
                    
                    return (
                        <div 
                            key={movie._id} 
                            className={`relative group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 transform flex flex-col
                                ${isActive 
                                    ? 'border border-primary shadow-[0_0_15px_rgba(248,69,101,0.2)] md:shadow-[0_0_20px_rgba(248,69,101,0.2)] scale-[1.02] z-10' 
                                    : 'border border-gray-800 hover:border-gray-600 opacity-70 hover:opacity-100 bg-[#0f0f0f]'}
                            `}
                            onClick={() => {
                                setCurrentIndex(idx);
                                setIsVideoPlaying(false); // Reset playing state if they click a new thumbnail
                            }}
                        >
                            <div className="aspect-video relative overflow-hidden shrink-0">
                                <img 
                                    src={getHDThumbnail(movie)} 
                                    alt={movie.title} 
                                    className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                                    style={{ imageRendering: 'high-quality' }}
                                    onError={(e) => {
                                        if (e.target.src !== movie.backdrop_path) {
                                            e.target.src = movie.backdrop_path || movie.poster_path || '';
                                        }
                                    }}
                                />
                                
                                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300
                                    ${isActive ? 'bg-black/10' : 'bg-black/50 group-hover:bg-black/30'}`}
                                >
                                    {isActive ? (
                                        <div className="bg-primary text-white text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse whitespace-nowrap">
                                            {isVideoPlaying ? "Playing" : "Up Next"}
                                        </div>
                                    ) : (
                                        <PlayCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80 group-hover:text-white transition-colors" strokeWidth={1.5} />
                                    )}
                                </div>
                            </div>
                            
                            <div className={`p-2 sm:p-3 md:p-4 flex-1 flex flex-col justify-center transition-colors ${isActive ? 'bg-gradient-to-t from-[#1a0508] to-[#121212]' : 'bg-[#121212]'}`}>
                                <p className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                    {movie.title}
                                </p>
                                <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium truncate mt-0.5 sm:mt-1 uppercase tracking-wider">
                                    {movie.genres?.map(g => g.name || g).join(' • ')}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <style>{`
                /* Ensure ReactPlayer wrapper matches aspect ratio exactly */
                .react-player iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    )
}

export default TrailersSection