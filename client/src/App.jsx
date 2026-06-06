import React, { useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { SignIn, useClerk, useUser } from '@clerk/clerk-react'
import { useAppContext } from './context/AppContext'

// --- PUBLIC COMPONENTS ---
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Loading from './components/Loading'
import LocationSelector from './components/LocationSelector' 

// --- PUBLIC PAGES ---
import Landing from './pages/Landing' // 🚨 IMPORTED NEW LANDING PAGE
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import Checkout from './pages/Checkout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import Wallet from './pages/Wallet' 
import Theaters from './pages/Theaters' 
import TheaterDetails from './pages/TheaterDetails' 
import Support from './pages/Support' 

// --- SUPER ADMIN PAGES ---
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddMovie from './pages/admin/AddMovie' 
import AddTheater from './pages/admin/AddTheater' 
import AddShows from './pages/admin/AddShows'
import ManageSnacks from './pages/admin/ManageSnacks'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import UsersList from './pages/admin/Users'
import AdminOffers from './pages/admin/AdminOffers' 
import SupportAdmin from './pages/admin/SupportAdmin'
import BoxOffice from './pages/admin/BoxOffice'
import AdminRequests from './pages/admin/AdminRequests' 

// --- CINEMA PORTAL PAGES ---
import CinemaLayout from './pages/cinema/CinemaLayout'
import CinemaDashboard from './pages/cinema/CinemaDashboard'
import ScanTicket from './pages/cinema/ScanTicket'
import DailyManifest from './pages/cinema/DailyManifest' 
import CinemaBookings from './pages/cinema/CinemaBookings'
import CinemaSnacks from './pages/cinema/CinemaSnacks'
import ScheduleRequests from './pages/cinema/ScheduleRequests'

const App = () => {
  const location = useLocation()
  
  // Hide public Navbar/Footer on BOTH Admin and Cinema routes
  const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/cinema')
  
  // Also hide Navbar/Footer on the Landing page if you want it to be a pure full-screen experience
  // (Change this to `true` if you DO want the navbar on the landing page)
  const isLandingPage = location.pathname === '/';
  
  const { user, axios, getToken, isAdmin, isCheckingAdmin } = useAppContext() 
  const { signOut } = useClerk() 
  const { isLoaded } = useUser()

  // --- AUTOMATIC USER SYNC & BAN CHECK ---
  useEffect(() => {
    let isMounted = true;

    const syncUserData = async () => {
        if (!user) return;

        try {
            const token = await getToken();
            const { data } = await axios.post('/api/user/sync', 
                {
                    name: user.fullName,
                    email: user.primaryEmailAddress?.emailAddress,
                    image: user.imageUrl
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!isMounted) return;

            if (data?.success && data?.user?.isBanned) {
                await signOut();
                toast.error("Access Denied: Your account has been suspended.");
            } else {
                console.log("User Synced to Database");
            }
            
        } catch (error) {
            if (isMounted) {
                console.error("Sync Failed:", error);
            }
        }
    };

    syncUserData();

    return () => {
        isMounted = false;
    };
  }, [user, axios, getToken, signOut]);

  // --- AUTH RENDER HELPERS ---
  const renderAdminAuth = () => {
    if (!isLoaded) {
      return <Loading />;
    }

    if (!user) {
      return (
        <div className='min-h-screen flex justify-center items-center bg-gray-950'>
          <SignIn 
            routing="hash" 
            fallbackRedirectUrl={'/admin'} 
            appearance={{ 
              elements: { 
                formButtonPrimary: 'bg-red-600 hover:bg-red-700', 
                card: 'bg-gray-900 border border-gray-800 text-white' 
              } 
            }}
          />
        </div>
      );
    }

    if (isCheckingAdmin) {
        return <Loading />;
    }

    return isAdmin ? <Layout /> : <Navigate to="/" replace />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-outfit">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <LocationSelector />

      {/* Show Navbar on all public routes (except dashboards and the pure landing page) */}
      {!isDashboardRoute && !isLandingPage && <Navbar />}
      
      <div className="flex-grow">
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          {/* 🚨 Set Landing as the root, moved Home to /home */}
          <Route path='/' element={<Landing />} />
          <Route path='/home' element={<Home />} />
          
          <Route path='/movies' element={<Movies />} />
          <Route path='/movies/:id' element={<MovieDetails />} />
          <Route path='/theaters' element={<Theaters />} /> 
          <Route path='/theater/:id' element={<TheaterDetails />} />
          <Route path='/book-seats/:showId' element={<SeatLayout />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/my-bookings' element={<MyBookings />} />
          <Route path='/favorite' element={<Favorite />} />
          <Route path='/wallet' element={<Wallet />} />
          <Route path='/support' element={<Support />} /> 
          <Route path='/loading/:nextUrl' element={<Loading />} />

          {/* --- CINEMA STAFF PORTAL --- */}
          <Route path='/cinema/*' element={<CinemaLayout />}>
            <Route index element={<CinemaDashboard />} />
            <Route path="pos" element={<BoxOffice />} />
            <Route path="scan" element={<ScanTicket />} /> 
            <Route path="manifest" element={<DailyManifest />} /> 
            <Route path="bookings" element={<CinemaBookings />} />
            <Route path="snacks" element={<CinemaSnacks />} /> 
            <Route path="requests" element={<ScheduleRequests />} /> 
          </Route>

          {/* --- ADMIN ROUTES (SECURED) --- */}
          <Route path='/admin/*' element={renderAdminAuth()}>
            <Route index element={<Dashboard />} />
            <Route path="add-movie" element={<AddMovie />} /> 
            <Route path="add-theater" element={<AddTheater />} /> 
            <Route path="add-shows" element={<AddShows />} />
            <Route path="snacks" element={<ManageSnacks />} />
            <Route path="list-shows" element={<ListShows />} />
            <Route path="list-bookings" element={<ListBookings />} />
            <Route path="users" element={<UsersList />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="support" element={<SupportAdmin />} />
            <Route path="requests" element={<AdminRequests />} />
          </Route>
        </Routes>
      </div>

      {/* Show Footer on all public routes (except dashboards and the pure landing page) */}
      {!isDashboardRoute && !isLandingPage && <Footer />}
    </div>
  )
}

export default App