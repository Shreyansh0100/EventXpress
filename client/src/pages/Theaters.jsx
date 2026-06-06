import React, { useEffect, useState } from 'react'
import { MapPin, Navigation, Info, Loader2, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Theaters = () => {
    const navigate = useNavigate()
    const { axios, manualCity, userLocation } = useAppContext()
    const [theaters, setTheaters] = useState([])
    const [loading, setLoading] = useState(true)

    const currentCity = manualCity || userLocation.city || "Select City";

    useEffect(() => {
        const fetchTheaters = async () => {
            if(currentCity === "Select City") { setLoading(false); return; }
            setLoading(true)
            try {
                const { data } = await axios.get(`/api/theaters/list?city=${currentCity}`)
                if (data.success) setTheaters(data.theaters)
            } catch (error) {
                console.error("Fetch error:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTheaters()
    }, [currentCity, axios])

    // --- GOOGLE MAPS PHOTO INTEGRATION ---
    const getGoogleMapsPhoto = (theater) => {
        // 1. Put your real Google Maps API Key in your .env file as VITE_GOOGLE_MAPS_API_KEY
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 

        // If you haven't added the key yet, safely fallback to the cinematic placeholder
        if (!apiKey || apiKey === "YOUR_API_KEY") {
            return `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80&sig=${theater._id}`;
        }

        // 2. Encode the theater's exact location for Google Maps
        const locationQuery = encodeURIComponent(`${theater.name}, ${theater.address}, ${theater.city}`);
        
        // 3. Fetch the real Street View / Exterior photo
        return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${locationQuery}&fov=90&heading=235&pitch=10&key=${apiKey}`;
    }

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary w-10 h-10 sm:w-12 sm:h-12" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#050505] px-4 sm:px-6 md:px-12 lg:px-24 py-20 sm:py-28 font-outfit animate-fadeIn">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 sm:mb-12 text-center md:text-left">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-3 tracking-tight">Theaters in {currentCity}</h1>
                    <p className="text-gray-400 text-sm sm:text-base font-medium">Find your favorite cinema and browse scheduled shows.</p>
                </div>

                {theaters.length === 0 ? (
                    <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl sm:rounded-[2rem] bg-[#0a0a0a] px-4 text-center">
                        <Building2 size={40} className="sm:w-12 sm:h-12 text-gray-700 mb-3 sm:mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base font-bold max-w-[250px] sm:max-w-none">No theaters found in {currentCity}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {theaters.map((theater) => (
                            <div 
                                key={theater._id}
                                onClick={() => navigate(`/theater/${theater._id}`)}
                                className="group bg-[#0f0f0f] rounded-2xl sm:rounded-[2rem] overflow-hidden border border-gray-800 hover:border-primary transition-all duration-500 cursor-pointer hover:-translate-y-1.5 sm:hover:-translate-y-2 shadow-xl hover:shadow-2xl flex flex-col h-full"
                            >
                                {/* THEATER IMAGE HEADER */}
                                <div className="h-48 sm:h-56 bg-gray-900 relative overflow-hidden shrink-0">
                                    <img 
                                        src={getGoogleMapsPhoto(theater)} 
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-700 group-hover:scale-110"
                                        alt={theater.name}
                                        loading="lazy"
                                        onError={(e) => { 
                                            // Ultimate fallback if Google Maps fails to find the specific address
                                            e.target.src = `https://images.unsplash.com/photo-1517604401870-d372199ede4a?auto=format&fit=crop&w=800&q=80`; 
                                        }}
                                    />
                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                                        <div className="bg-black/60 backdrop-blur-md p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/10 text-white shadow-lg">
                                            <Navigation size={14} className="sm:w-4 sm:h-4 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
                                </div>

                                <div className="p-5 sm:p-6 md:p-8 pt-3 sm:pt-4 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">{theater.name}</h3>
                                        <div className="flex items-start gap-1.5 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-5 sm:mb-6">
                                            <MapPin size={14} className="sm:w-4 sm:h-4 text-primary shrink-0 mt-0.5 sm:mt-0.5" />
                                            <p className="line-clamp-2 sm:line-clamp-3 font-medium leading-relaxed">{theater.address}</p>
                                        </div>
                                    </div>
                                    
                                    <button className="w-full py-3 sm:py-4 bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:border-primary text-gray-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 mt-auto shrink-0">
                                        <Info size={16} className="sm:w-[18px] sm:h-[18px]"/> View Today's Shows
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    )
}

export default Theaters