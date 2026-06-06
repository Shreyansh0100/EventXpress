import React, { useRef, useState, useEffect } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Search, Target, X, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const libraries = ['places'];

// Official BookMyShow Silhouette CDN Images
const POPULAR_CITIES = [
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/mumbai.png" },
    { name: "Delhi-NCR", lat: 28.6139, lng: 77.2090, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/ncr.png" },
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/bang.png" },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/hyd.png" },
    { name: "Chandigarh", lat: 30.7333, lng: 76.7794, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/chd.png" },
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/ahd.png" },
    { name: "Chennai", lat: 13.0827, lng: 80.2707, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/chen.png" },
    { name: "Pune", lat: 18.5204, lng: 73.8567, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/pune.png" },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/kolk.png" },
    { name: "Kochi", lat: 9.9312, lng: 76.2673, iconUrl: "https://in.bmscdn.com/m6/images/common-modules/regions/koch.png" }
];

const LocationSelector = () => {
    const { 
        showLocationModal, 
        setShowLocationModal, 
        setManualCity, 
        setUserLocation
    } = useAppContext();

    const [isDetecting, setIsDetecting] = useState(false);
    const autocompleteRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    // --- NEW: Lock Background Scrolling ---
    useEffect(() => {
        if (showLocationModal) {
            // Prevent scrolling on the background body
            document.body.style.overflow = 'hidden';
        } else {
            // Re-enable scrolling when modal closes
            document.body.style.overflow = '';
        }

        // Cleanup function in case component unmounts unexpectedly
        return () => {
            document.body.style.overflow = '';
        };
    }, [showLocationModal]);

    // --- CORE LOGIC: Save Location & Close ---
    const confirmLocation = (city, lat, lng, area = '', pincode = '') => {
        setManualCity(city);
        setUserLocation({ city, lat, long: lng });

        localStorage.setItem('eventxpress_location', JSON.stringify({
            city, area, lat, lng
        }));

        toast.success(`Location set to ${city}`);
        setShowLocationModal(false);
        window.location.reload(); 
    };

    // --- HANDLER: Autocomplete Selection ---
    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (!place.geometry) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            let city = "";
            let area = "";
            let pincode = "";

            place.address_components?.forEach(comp => {
                if (comp.types.includes("locality")) city = comp.long_name;
                if (comp.types.includes("sublocality") || comp.types.includes("neighborhood")) area = comp.long_name;
                if (comp.types.includes("postal_code")) pincode = comp.long_name;
            });

            if (!city) place.address_components?.forEach(comp => { if (comp.types.includes("administrative_area_level_2")) city = comp.long_name; });
            if (!area) area = city; 

            const finalCity = city || place.name || "Selected Location";
            confirmLocation(finalCity, lat, lng, area, pincode);
        }
    };

    // --- HANDLER: Popular City Click ---
    const handlePopularCityClick = (cityData) => {
        confirmLocation(cityData.name, cityData.lat, cityData.lng, cityData.name, '');
    };

    // --- HANDLER: GPS Auto-Detect ---
    const handleDetectLocation = () => {
        setIsDetecting(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    try {
                        const geocoder = new window.google.maps.Geocoder();
                        const response = await geocoder.geocode({ location: { lat, lng } });
                        
                        if (response.results[0]) {
                            const components = response.results[0].address_components;
                            let city = "";
                            components.forEach(comp => {
                                if (comp.types.includes("locality")) city = comp.long_name;
                            });
                            if (!city) components.forEach(comp => { if (comp.types.includes("administrative_area_level_2")) city = comp.long_name; });

                            confirmLocation(city || "My Location", lat, lng);
                        }
                    } catch (error) {
                        toast.error("Could not determine city name from GPS.");
                    } finally {
                        setIsDetecting(false);
                    }
                },
                (error) => {
                    toast.error("GPS permission denied. Please search manually.");
                    setIsDetecting(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            toast.error("Geolocation is not supported by your browser");
            setIsDetecting(false);
        }
    };

    if (!showLocationModal) return null;

    return (
        // Backdrop Overlay: Clicking the dark area closes the modal
        <div 
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center pt-20 sm:pt-0 px-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans"
            onMouseDown={(e) => {
                // Only close if they clicked the backdrop, not the white modal box itself
                if (e.target === e.currentTarget) setShowLocationModal(false);
            }}
        >
            {/* Main Modal Box */}
            <div className="bg-white w-full max-w-[850px] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-scaleIn text-gray-800 pb-6 sm:pb-8 max-h-[85vh] sm:max-h-[90vh]">
                
                {/* Close Button */}
                <button 
                    onClick={() => setShowLocationModal(false)}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-400 hover:text-gray-800 transition-colors z-50 cursor-pointer bg-white rounded-full p-1"
                >
                    <X size={20} className="sm:w-6 sm:h-6" />
                </button>

                {/* --- HEADER: Search Bar --- */}
                <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-3 sm:pb-4 border-b border-gray-200 flex flex-col shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4 bg-white pr-8 sm:pr-10">
                        <Search className="text-gray-400 w-5 h-5 sm:w-[22px] sm:h-[22px] shrink-0" />
                        {isLoaded ? (
                            <Autocomplete 
                                onLoad={(a) => (autocompleteRef.current = a)} 
                                onPlaceChanged={onPlaceChanged}
                                className="flex-1"
                                options={{ componentRestrictions: { country: "in" } }}
                            >
                                <input 
                                    type="text" 
                                    placeholder="Search for your city" 
                                    className="w-full text-base sm:text-lg outline-none text-gray-800 placeholder-gray-400 bg-transparent py-1"
                                    autoFocus
                                />
                            </Autocomplete>
                        ) : (
                            <div className="flex-1 text-gray-400 text-sm sm:text-lg">Loading Maps API...</div>
                        )}
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="px-4 sm:px-6 py-5 sm:py-6 bg-gray-50 flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* Detect Location Button */}
                    <div className="text-center md:text-left mb-6 sm:mb-8">
                        <button 
                            onClick={handleDetectLocation}
                            disabled={isDetecting}
                            className="inline-flex items-center justify-center gap-2 text-rose-500 font-medium hover:text-rose-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                        >
                            {isDetecting ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Target size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />}
                            Detect my location
                        </button>
                    </div>

                    {/* Popular Cities Grid */}
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-center text-xs sm:text-sm font-medium text-gray-800 mb-6 sm:mb-8">Popular Cities</h3>
                        
                        <div className="flex flex-wrap justify-center md:justify-between gap-y-8 sm:gap-y-10 gap-x-2 sm:gap-x-2 px-0 md:px-8">
                            {POPULAR_CITIES.map((city) => (
                                <div 
                                    key={city.name}
                                    onClick={() => handlePopularCityClick(city)}
                                    className="flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer group w-[22%] sm:w-[60px] md:w-[70px]"
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0">
                                        <img 
                                            src={city.iconUrl} 
                                            alt={city.name} 
                                            className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                                        />
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-900 font-medium text-center transition-colors truncate w-full">
                                        {city.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Link */}
                    <div className="text-center mt-10 sm:mt-12">
                        <button className="text-rose-500 text-xs sm:text-[13px] font-medium hover:text-rose-600 transition-colors tracking-wide p-2">
                            View All Cities
                        </button>
                    </div>

                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: translateY(-10px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
                .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default LocationSelector;