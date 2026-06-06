import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { UserButton } from '@clerk/clerk-react' 
import { useAppContext } from '../../context/AppContext'

const AdminNavbar = () => {
  const { dbUser } = useAppContext();
  const isCinemaRole = dbUser?.role === 'cinema';

  return (
    <div className='flex items-center justify-between px-4 md:px-8 h-16 border-b border-gray-800/60 bg-[#0a0a0a]/90 backdrop-blur-2xl sticky top-0 z-50 w-full'>
      
      {/* Left Side: Brand Logo (Hidden on desktop to prevent double-logo with Sidebar) */}
      <div className="flex items-center">
          <Link to={isCinemaRole ? "/cinema" : "/admin"} className="md:hidden block outline-none group">
            <img 
                src={assets.logo} 
                alt="EventXpress" 
                className="w-24 h-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
          </Link>
      </div>
      
      {/* Right Controls */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto">
          
          {/* Live System Indicator (Hidden on tiny screens) */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-inner">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10B981]"></div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  {isCinemaRole ? 'POS Active' : 'Sys Active'}
              </span>
          </div>
          
          <div className="border-l border-gray-800 h-6 hidden sm:block mx-1"></div>
          
          {/* Role Label */}
          <div className="hidden sm:block text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Logged in as</p>
              <p className="text-xs font-bold text-gray-300 tracking-wide">
                  {isCinemaRole ? 'Box Office Agent' : 'System Admin'}
              </p>
          </div>

          {/* Clerk Profile Button - Premium Dark Mode Styling */}
          <div className="flex items-center justify-center bg-white/5 p-1 rounded-full border border-white/10 hover:border-white/20 transition-colors shadow-sm cursor-pointer">
              <UserButton 
                appearance={{
                    elements: {
                        avatarBox: "w-8 h-8 border-2 border-gray-800 shadow-md",
                        // Forces the Clerk popup to match your dark theme
                        userButtonPopoverCard: "bg-[#121212] border border-gray-800 shadow-2xl",
                        userPreviewMainIdentifier: "text-white font-bold",
                        userPreviewSecondaryIdentifier: "text-gray-400 font-mono text-xs",
                        userButtonPopoverActionButtonText: "text-gray-300 font-medium",
                        userButtonPopoverActionButtonIcon: "text-gray-400",
                        userButtonPopoverFooter: "hidden" // Hides the "Secured by Clerk" footer for a cleaner look
                    }
                }}
              />
          </div>

      </div>
    </div>
  )
}

export default AdminNavbar