import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { 
    LayoutDashboardIcon, ListCollapseIcon, ListIcon, PlusSquareIcon, 
    FilmIcon, UsersIcon, HomeIcon, MapPin, Utensils,Popcorn,Gift, 
    Headset, Ticket, QrCode, CalendarClock, LogOut
} from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'

const AdminSidebar = () => {
    const { user } = useAppContext() 
    const { signOut } = useClerk()

    const adminUser = {
        firstName: user?.firstName || user?.name || 'Admin',
        lastName: user?.lastName || '',
        imageUrl: user?.imageUrl || user?.image || "https://ui-avatars.com/api/?name=Admin+User&background=121212&color=F84565",
        role: user?.role || 'Administrator'
    }

    // --- SUPER ADMIN LINKS ---
    const superAdminLinks = [
        { name: 'Command Center', path: '/admin', icon: LayoutDashboardIcon },
        { name: 'Add Movies', path: '/admin/add-movie', icon: FilmIcon },
        { name: 'Add Theaters', path: '/admin/add-theater', icon: MapPin },
        { name: 'Schedule Shows', path: '/admin/add-shows', icon: PlusSquareIcon },
        { name: 'List Shows', path: '/admin/list-shows', icon: ListIcon },
        { name: 'Theater Requests', path: '/admin/requests', icon: CalendarClock }, 
        { name: 'Manage Snacks', path: '/admin/snacks', icon: Popcorn }, 
        { name: 'Platform Bookings', path: '/admin/list-bookings', icon: ListCollapseIcon },
        { name: 'User Management', path: '/admin/users', icon: UsersIcon }, 
        { name: 'Loyalty & F&B', path: '/admin/offers', icon: Gift }, 
        { name: 'Support Desk', path: '/admin/support', icon: Headset }, 
    ]

    // --- CINEMA STAFF LINKS (BOX OFFICE) ---
    const cinemaLinks = [
        { name: 'POS Terminal', path: '/cinema/pos', icon: Ticket },
        { name: 'Scan Tickets', path: '/cinema/scan', icon: QrCode },
        { name: 'Daily Manifest', path: '/cinema/manifest', icon: ListIcon },
        { name: 'F&B Counter', path: '/cinema/counter-snacks', icon: Utensils },
    ]

    const isCinemaRole = adminUser.role === 'cinema'
    const activeLinks = isCinemaRole ? cinemaLinks : superAdminLinks

    const handleSignOut = async () => {
        await signOut({ redirectUrl: '/' });
    };

    return (
        <aside className='h-full w-20 lg:w-72 bg-[#050505] border-r border-white/5 flex flex-col overflow-hidden font-outfit select-none transition-all duration-300 z-40 relative shadow-[10px_0_30px_rgba(0,0,0,0.5)]'>
            
            {/* Header / Brand Area */}
            <div className='p-5 lg:p-7 border-b border-gray-800/50 bg-[#0a0a0a]/50'>
                <Link to={isCinemaRole ? "/cinema" : "/admin"} className='flex items-center justify-center lg:justify-start gap-3 group outline-none'>
                    <div className='w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(248,69,101,0.3)] group-hover:scale-110 transition-transform shrink-0'>
                        {isCinemaRole ? <Ticket size={20} className='text-white'/> : <FilmIcon size={20} className='text-white' />}
                    </div>
                    <div className='flex-col hidden lg:flex'>
                        <span className='text-lg font-black leading-none text-white tracking-tighter'>
                        Event<span className='text-primary'>Xpress</span>
                        </span>
                        <span className='text-[10px] text-gray-500 font-bold tracking-[3px] uppercase mt-1'>
                            {isCinemaRole ? 'Box Office' : 'Control'}
                        </span>
                    </div>
                </Link>
            </div>

            {/* Profile Card */}
            <div className='mx-4 my-4 p-4 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hidden lg:block shrink-0'>
                <div className='flex items-center gap-4'>
                    <div className="relative shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-full opacity-20 blur-sm"></div>
                        <img className='relative h-11 w-11 rounded-full object-cover border border-white/10' src={adminUser.imageUrl} alt="Profile" />
                        <div className='absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050505] rounded-full shadow-lg'></div>
                    </div>
                    <div className='overflow-hidden'>
                        <p className='text-white font-bold text-sm truncate'>{adminUser.firstName}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isCinemaRole ? 'text-orange-400' : 'text-primary'}`}>
                            {isCinemaRole ? 'Local Agent' : 'Super Admin'}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Navigation Links - WITH SCROLLBAR HIDDEN */}
            <nav className='flex-1 px-3 mt-4 space-y-1.5 overflow-y-auto sidebar-hide-scroll'>
                <p className='text-[10px] text-gray-600 font-black uppercase tracking-[2px] ml-4 mb-3 hidden lg:block'>Main Menu</p>
                {activeLinks.map((link) => (
                    <NavLink 
                        key={link.name} 
                        to={link.path} 
                        end 
                        className={({ isActive }) => `
                            relative flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-4 py-3.5 lg:py-3 rounded-2xl transition-all duration-300 group overflow-hidden
                            ${isActive 
                                ? 'bg-primary/10 text-white border border-primary/20 shadow-[0_0_20px_rgba(248,69,101,0.1)]' 
                                : 'text-gray-500 hover:bg-white/5 hover:text-gray-200 border border-transparent'}
                        `}
                        title={link.name} 
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon 
                                    className={`w-[22px] h-[22px] lg:w-5 lg:h-5 shrink-0 transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'group-hover:scale-110'}`} 
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`hidden lg:block text-[13px] font-bold tracking-tight truncate transition-all ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                                    {link.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Section */}
            <div className='p-3 lg:p-4 mb-2 mt-auto border-t border-gray-800/50 bg-gradient-to-t from-black to-transparent space-y-2 shrink-0'>
                <Link to="/" className='flex items-center justify-center lg:justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-3 lg:px-4 py-3 rounded-2xl transition-all duration-300 group border border-transparent hover:border-white/10' title="Return to Site">
                    <HomeIcon size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
                    <span className='hidden lg:block font-bold text-xs tracking-wider truncate'>Return to Site</span>
                </Link>
                
                <button onClick={handleSignOut} className='w-full flex items-center justify-center lg:justify-start gap-3 text-rose-500/80 hover:text-white hover:bg-rose-500 px-3 lg:px-4 py-3 rounded-2xl transition-all duration-300 group border border-transparent hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(243,24,64,0.3)]' title="Sign Out">
                    <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                    <span className='hidden lg:block font-bold text-xs tracking-wider truncate'>End Shift</span>
                </button>
            </div>
            
            {/* 🚨 CRITICAL FIX: Custom CSS to permanently kill the ugly scrollbar 🚨 */}
            <style>{`
                /* Hide scrollbar for Chrome, Safari and Opera */
                .sidebar-hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .sidebar-hide-scroll {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </aside>
    )
}

export default AdminSidebar