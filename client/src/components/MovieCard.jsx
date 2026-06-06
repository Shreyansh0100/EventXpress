import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MonitorPlay } from 'lucide-react'

const MovieCard = ({ movie }) => {
    const navigate = useNavigate()

    // --- SMART IMAGE UPSCALER ---
    // Upgrades TMDB thumbnail URLs to full HD
    const getHighResImage = (url) => {
        if (!url) return '';
        if (url.includes('image.tmdb.org')) {
            return url.replace(/\/w\d+\//, '/original/');
        }
        return url;
    }

    if (!movie) return null;

    const hdPoster = getHighResImage(movie.poster_path);

    return (
        <div 
            onClick={() => navigate(`/movies/${movie._id}`)}
            className="group relative flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-2"
        >
            {/* Poster Image Container */}
            <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-[#121212] border border-gray-800 group-hover:border-primary/50 shadow-lg group-hover:shadow-[0_15px_40px_rgba(248,69,101,0.25)] transition-all duration-500">
                
                <img 
                    src={hdPoster} 
                    alt={movie.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{ imageRendering: 'high-quality' }}
                    loading="lazy"
                />

                {/* Rating Badge (Top Right) */}
                {movie.vote_average > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10 z-10">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    </div>
                )}

                {/* Hover Overlay with "Book Now" styling */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end items-center p-4">
                    <button className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        Book Tickets
                    </button>
                </div>
            </div>

            {/* Movie Info (Below Poster) */}
            <div className="mt-4 px-1">
                <h3 className="text-white font-bold text-base truncate group-hover:text-primary transition-colors">
                    {movie.title}
                </h3>
                
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 font-medium">
                    {/* Certificate Badge */}
                    {movie.censor_rating && (
                        <span className="px-1.5 py-0.5 border border-gray-700 rounded text-[10px] font-bold">
                            {movie.censor_rating}
                        </span>
                    )}
                    
                    {/* Format / Genre */}
                    <span className="truncate flex items-center gap-1">
                        {movie.formats && movie.formats.length > 0 ? (
                            <><MonitorPlay size={12} className="text-gray-400"/> {movie.formats[0]}</>
                        ) : (
                            movie.genres?.map(g => g.name || g).join(', ')
                        )}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default MovieCard