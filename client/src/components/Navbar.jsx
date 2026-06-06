import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { Menu, Search, Ticket, X, MapPin, ChevronDown, ShieldCheck, Wallet, Clapperboard, Headset, MonitorPlay, Zap } from 'lucide-react';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { useAppContext } from '../context/AppContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [activeLink, setActiveLink] = useState('/');
  const searchRef = useRef(null);
  const location = useLocation();

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const { dbUser, userLocation, setShowLocationModal, isAdmin } = useAppContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/theaters', label: 'Theaters', icon: <Clapperboard size={13} /> },
    { to: '/support', label: 'Support', icon: <Headset size={13} /> },
  ];

  return (
    <>
      <style>{`
        .qs-nav {
          font-family: 'Outfit', sans-serif;
        }

        /* Animated bottom border */
        .qs-nav-border {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(248,69,101,0.1) 20%,
            rgba(248,69,101,0.5) 50%,
            rgba(248,69,101,0.1) 80%,
            transparent 100%
          );
        }

        /* Nav link hover effect */
        .qs-link {
          position: relative;
          font-weight: 600;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          transition: color 0.3s ease;
          padding: 8px 4px;
        }

        .qs-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #F84565;
          transition: width 0.3s ease, box-shadow 0.3s ease;
          border-radius: 2px;
        }

        .qs-link:hover, .qs-link.active {
          color: #fff;
        }

        .qs-link:hover::after, .qs-link.active::after {
          width: 100%;
          box-shadow: 0 0 10px rgba(248,69,101,0.5);
        }

        /* City pill */
        .qs-city {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px; /* full pill */
          padding: 6px 14px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }

        .qs-city:hover {
          background: rgba(248,69,101,0.1);
          border-color: rgba(248,69,101,0.3);
          color: #fff;
          transform: translateY(-1px);
        }

        .qs-city .ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #F84565;
          box-shadow: 0 0 8px #F84565;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }

        /* Icon buttons */
        .qs-icon-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: all 0.3s ease;
          color: rgba(255,255,255,0.7);
        }

        .qs-icon-btn:hover {
          background: rgba(248,69,101,0.1);
          border-color: rgba(248,69,101,0.2);
          color: #F84565;
          transform: translateY(-2px);
        }

        /* Sign in button */
        .qs-signin {
          font-weight: 700;
          font-size: 0.85rem;
          padding: 8px 24px;
          background: #F84565;
          border-radius: 9999px;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(248,69,101,0.3);
        }

        .qs-signin:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(248,69,101,0.5);
          background: #ff5c77;
        }

        /* Admin badge */
        .qs-admin-badge {
          font-weight: 600;
          font-size: 0.75rem;
          padding: 6px 14px;
          background: rgba(248,69,101,0.1);
          border: 1px solid rgba(248,69,101,0.2);
          border-radius: 9999px;
          color: #F84565;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }
        .qs-admin-badge:hover {
          background: rgba(248,69,101,0.2);
          color: #fff;
          box-shadow: 0 0 15px rgba(248,69,101,0.3);
        }

        .qs-cinema-badge {
          font-weight: 600;
          font-size: 0.75rem;
          padding: 6px 14px;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.2);
          border-radius: 9999px;
          color: #fb923c;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }
        .qs-cinema-badge:hover {
          background: rgba(249,115,22,0.2);
          color: #fff;
          box-shadow: 0 0 15px rgba(249,115,22,0.3);
        }

        /* Search expand */
        .qs-search-bar {
          overflow: hidden;
          transition: width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
          width: 0;
          opacity: 0;
        }
        .qs-search-bar.open {
          width: 180px;
          opacity: 1;
        }
        @media (min-width: 1024px) {
          .qs-search-bar.open { width: 220px; }
        }
        .qs-search-bar input {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 8px 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          color: #fff;
          outline: none;
          transition: border-color 0.3s ease;
        }
        .qs-search-bar input:focus {
          border-color: #F84565;
        }
        .qs-search-bar input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        /* Mobile menu */
        .qs-mobile {
          background: rgba(9, 9, 11, 0.98);
          backdrop-filter: blur(24px);
        }

        .qs-mobile-link {
          font-weight: 600;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.7);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          width: 100%;
          justify-content: center;
        }
        @media (min-width: 380px) {
          .qs-mobile-link { font-size: 1.4rem; }
        }
        .qs-mobile-link:hover {
          color: #fff;
          transform: translateX(4px);
        }

        /* User greeting */
        .qs-greeting {
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
        }
        .qs-greeting span {
          color: #fff;
          font-weight: 700;
        }
      `}</style>

      <nav className={`qs-nav fixed top-0 left-0 z-50 w-full transition-all duration-500 border-b ${
        scrolled
          ? 'py-2 sm:py-3 bg-black/50 backdrop-blur-3xl border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
          : 'py-4 sm:py-5 bg-gradient-to-b from-black/80 to-transparent border-transparent'
      }`} style={{ position: 'fixed' }}>

        <div className="qs-nav-border" />

        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-10 lg:px-20 xl:px-32">

          {/* LEFT: Logo + City */}
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <Link to='/home' className='qs-logo flex-shrink-0 transition-all duration-300'>
              <img src={assets.logo} alt="EventXpress" className='w-24 sm:w-28 md:w-36 h-auto' />
            </Link>

            <div
              onClick={() => setShowLocationModal(true)}
              className="qs-city hidden lg:flex items-center gap-2 shrink-0"
            >
              <div className="ping" />
              <MapPin size={12} className="text-red-500" />
              <span className="truncate max-w-[100px]">{userLocation.city}</span>
              <ChevronDown size={12} className="opacity-60" />
            </div>
          </div>

          {/* CENTER: Nav Links */}
          <div className="hidden md:flex items-center justify-center gap-4 lg:gap-8 flex-1 px-4">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`qs-link flex items-center gap-1.5 ${activeLink === to ? 'active' : ''}`}
              >
                {icon && <span className="opacity-60">{icon}</span>}
                {label}
              </Link>
            ))}

            {isAdmin && (
              <Link to='/admin' className="qs-admin-badge shrink-0">
                <ShieldCheck size={13} />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            {dbUser?.role === 'cinema' && (
              <Link to='/cinema' className="qs-cinema-badge shrink-0">
                <MonitorPlay size={13} />
                <span className="hidden lg:inline">Box Office</span>
              </Link>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">

            {/* Expandable Search */}
            <div className="hidden sm:flex items-center gap-2">
              <div className={`qs-search-bar ${searchOpen ? 'open' : ''}`}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search movies..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                />
              </div>
              <div
                className="qs-icon-btn bracket shrink-0"
                onClick={() => setSearchOpen(v => !v)}
                title="Search"
              >
                {searchOpen ? <X size={15} /> : <Search size={15} />}
              </div>
            </div>

            {user && (
              <div
                onClick={() => navigate('/wallet')}
                className="qs-icon-btn bracket hidden sm:flex shrink-0"
                title="My Wallet"
              >
                <Wallet size={15} />
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block qs-greeting truncate max-w-[120px]">
                  <Zap size={10} className="inline mr-1 text-red-500" />
                  Hey, <span>{user.firstName}</span>
                </div>
                <UserButton afterSignOutUrl="/home">
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="My Bookings"
                      labelIcon={<Ticket size={14} />}
                      onClick={() => navigate('/my-bookings')}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <button onClick={openSignIn} className="qs-signin hidden sm:block shrink-0">
                Sign In
              </button>
            )}

            <Menu
              className='md:hidden w-6 h-6 text-gray-300 cursor-pointer hover:text-white transition shrink-0 ml-1'
              onClick={() => setIsOpen(true)}
            />
          </div>
        </div>
      </nav>

      {/* ── Mobile Overlay ── */}
      <div className={`qs-mobile fixed inset-0 z-[60] transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 md:hidden flex flex-col items-center justify-center gap-4 sm:gap-6 px-6 sm:px-8`}>

        {/* HUD corners on mobile */}
        <div className="hud-corner hud-tl" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
        <div className="hud-corner hud-tr" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
        <div className="hud-corner hud-bl" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
        <div className="hud-corner hud-br" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />

        <button
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-gray-400 hover:text-white hover:border-red-500/40 transition"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>

        {/* Logo in mobile menu */}
        <img src={assets.logo} alt="EventXpress" className='w-28 sm:w-36 mb-2 sm:mb-4 opacity-80' />

        {navLinks.map(({ to, label, icon }) => (
          <Link
            key={to}
            onClick={() => setIsOpen(false)}
            to={to}
            className="qs-mobile-link"
          >
            {icon} {label}
          </Link>
        ))}

        {user && (
          <Link onClick={() => setIsOpen(false)} to='/wallet' className="qs-mobile-link">
            <Wallet size={18} className="sm:w-5 sm:h-5" /> Wallet
          </Link>
        )}

        <div
          onClick={() => { setIsOpen(false); setShowLocationModal(true) }}
          className="qs-mobile-link cursor-pointer"
        >
          <MapPin size={18} className="sm:w-5 sm:h-5 text-red-500" /> <span className="truncate max-w-[200px]">{userLocation.city}</span>
        </div>

        {isAdmin && (
          <Link onClick={() => setIsOpen(false)} to='/admin' className="qs-mobile-link" style={{ color: '#ef4444' }}>
            <ShieldCheck size={18} className="sm:w-5 sm:h-5" /> Admin Dashboard
          </Link>
        )}

        {dbUser?.role === 'cinema' && (
          <Link onClick={() => setIsOpen(false)} to='/cinema' className="qs-mobile-link" style={{ color: '#fb923c' }}>
            <MonitorPlay size={18} className="sm:w-5 sm:h-5" /> Box Office
          </Link>
        )}

        {!user && (
          <button
            onClick={() => { setIsOpen(false); openSignIn() }}
            className="qs-signin mt-4 sm:mt-6 w-full text-center max-w-xs"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </>
  );
};

export default Navbar;