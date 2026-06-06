import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Ticket, QrCode, ClipboardList, LogOut, Search, Popcorn, CalendarClock, Film } from 'lucide-react'; 
import { useClerk } from '@clerk/clerk-react';

const cinemaLinks = [
    { name: 'Dashboard', path: '/cinema', icon: LayoutDashboard, desc: 'Live stats & shows' },
    { name: 'Box Office', path: '/cinema/pos', icon: Ticket, desc: 'Sell tickets & snacks' },
    { name: 'Scan Tickets', path: '/cinema/scan', icon: QrCode, desc: 'Verify guest entry' },
    { name: 'Guest List', path: '/cinema/manifest', icon: ClipboardList, desc: "Today's attendees" },
    { name: 'All Bookings', path: '/cinema/bookings', icon: Search, desc: 'History & reprints' },
    { name: 'Snacks Menu', path: '/cinema/snacks', icon: Popcorn, desc: 'Manage food & drinks' },
    { name: 'Movie Requests', path: '/cinema/requests', icon: CalendarClock, desc: 'Ask for new shows' },
];

const CinemaSidebar = () => {
    const { signOut } = useClerk();

    return (
        <aside className="fixed top-0 left-0 h-screen w-16 md:w-64 bg-[#060606] border-r border-white/[0.04] z-40 flex flex-col font-outfit transition-all duration-300">
            
            {/* Desktop Logo Area */}
            <div className="p-5 hidden md:flex items-center border-b border-white/[0.04]">
                <Link to="/cinema" className="flex items-center gap-3 outline-none group min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.35)] transition-all duration-300">
                        <Film size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-base font-black leading-none text-white tracking-tight truncate">EventXpress</span>
                        <span className="text-[8px] text-orange-400/80 font-bold tracking-[0.2em] uppercase mt-1 truncate">
                            Cinema Partner
                        </span>
                    </div>
                </Link>
            </div>

            {/* Mobile Logo (Icon Only) */}
            <div className="p-3 sm:p-4 flex md:hidden justify-center border-b border-white/[0.04]">
                <Link to="/cinema" className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    <Film size={18} className="text-white" />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 md:px-3 mt-4 md:mt-5 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] ml-3 mb-3 hidden md:block">Operations</p>
                
                {cinemaLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink 
                            key={link.name} 
                            to={link.path} 
                            end 
                            className={({ isActive }) => `
                                flex items-center justify-center md:justify-start gap-3 px-0 md:px-3 py-3 md:py-2.5 rounded-xl transition-all duration-200 group relative
                                ${isActive 
                                    ? 'bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-400 font-bold border border-orange-500/15 shadow-[0_0_15px_rgba(249,115,22,0.08)]' 
                                    : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 font-medium border border-transparent'}
                            `}
                            title={link.name} 
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.5)] hidden md:block"></div>}
                                    <Icon className="w-5 h-5 md:w-[18px] md:h-[18px] shrink-0" />
                                    <div className="hidden md:flex flex-col min-w-0">
                                        <span className="text-[13px] tracking-wide leading-none truncate">{link.name}</span>
                                        <span className={`text-[9px] leading-none mt-1 truncate ${isActive ? 'text-orange-400/50' : 'text-gray-700'}`}>{link.desc}</span>
                                    </div>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Logout */}
            <div className="p-2 md:p-3 mb-1 border-t border-white/[0.04] mt-auto">
                <button 
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center md:justify-start gap-3 text-gray-600 hover:text-red-400 hover:bg-red-500/10 px-0 md:px-3 py-3 md:py-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/15 group"
                    title="End Shift"
                >
                    <LogOut size={20} className="md:w-[17px] md:h-[17px] shrink-0 md:group-hover:-translate-x-0.5 transition-transform" />
                    <span className="hidden md:block font-bold text-[13px] tracking-wide truncate">End Session</span>
                </button>
            </div>
        </aside>
    );
};

export default CinemaSidebar;