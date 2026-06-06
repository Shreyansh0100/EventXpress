import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    // --- State ---
    const [userLocation, setUserLocation] = useState(() => {
        const saved = localStorage.getItem('EventXpress_location');
        return saved ? JSON.parse(saved) : { city: "Select City", lat: null, long: null };
    });

    const [manualCity, setManualCity] = useState(
        userLocation.city !== "Select City" ? userLocation.city : ""
    );

    const [showLocationModal, setShowLocationModal] = useState(false);

    // --- Admin & Role ---
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
    const [dbUser, setDbUser] = useState(null);

    // ✅ UPDATED BACKEND CONFIG (PRODUCTION READY)
    const backendUrl =
        import.meta.env.VITE_BASE_URL || "http://localhost:3000";

    const axiosInstance = axios.create({
        baseURL: backendUrl,
        withCredentials: true,
    });

    // --- Helper ---
    const updateUserLocation = (newLoc) => {
        setUserLocation(newLoc);
        setManualCity(newLoc.city);
        localStorage.setItem('EventXpress_location', JSON.stringify(newLoc));
    };

    // --- Fetch DB User ---
    const fetchDbUser = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const { data } = await axiosInstance.get('/api/user/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) setDbUser(data.user);
        } catch (error) {
            console.error("DB user fetch failed:", error);
        }
    };

    // --- Admin Check ---
    const fetchIsAdmin = async () => {
        try {
            setIsCheckingAdmin(true);

            const token = await getToken();
            if (!token) {
                setIsAdmin(false);
                return;
            }

            const { data } = await axiosInstance.get('/api/admin/is-admin', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsAdmin(data.success && data.isAdmin);
        } catch (error) {
            if (error.response?.status === 403) {
                setIsAdmin(false);
            } else {
                console.error("Admin check failed:", error);
                setIsAdmin(false);
            }
        } finally {
            setIsCheckingAdmin(false);
        }
    };

    // --- On Login ---
    useEffect(() => {
        if (!isLoaded) return; // Wait for Clerk to resolve before making decisions
        
        if (user) {
            fetchIsAdmin();
            fetchDbUser();
        } else {
            setIsAdmin(false);
            setIsCheckingAdmin(false);
            setDbUser(null);
        }
    }, [user, isLoaded]);

    // --- Location Detection ---
    const detectLocation = async () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                toast.error("Geolocation not supported");
                return reject();
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    try {
                        const { data } = await axios.get(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
                        );

                        let city = "Unknown Location";

                        if (data.results.length > 0) {
                            const comp = data.results[0].address_components;
                            const cityObj = comp.find(c => c.types.includes("locality"));
                            if (cityObj) city = cityObj.long_name;
                        }

                        const newLoc = { city, lat: latitude, long: longitude };
                        updateUserLocation(newLoc);

                        toast.success(`Location detected: ${city}`);
                        resolve(newLoc);
                    } catch (err) {
                        toast.error("Failed to fetch city");
                        reject(err);
                    }
                },
                () => {
                    toast.error("Location permission denied");
                    reject();
                }
            );
        });
    };

    const value = {
        user,
        dbUser,
        getToken,
        backendUrl,
        axios: axiosInstance,
        userLocation,
        setUserLocation: updateUserLocation,
        manualCity,
        setManualCity,
        detectLocation,
        showLocationModal,
        setShowLocationModal,
        isAdmin,
        isCheckingAdmin,
        fetchIsAdmin,
        fetchDbUser
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);

export default AppContextProvider;