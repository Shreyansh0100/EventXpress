import React from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { Outlet } from 'react-router-dom'

const Layout = () => {
  // App.jsx has already verified this user is an admin before rendering this component.
  // We no longer trigger fetchIsAdmin() or check isAdmin here to prevent the infinite loading loop.

  return (
    /* FIX: 'h-screen' and 'overflow-hidden' on this wrapper are CRITICAL. wrapper ensures admin dashboard fits monitor */
    <div className='h-screen w-full bg-[#050505] text-gray-100 flex flex-col font-inter selection:bg-primary/30 overflow-hidden'>
      
      {/* 1. Header Navigation (Fixed Height: 64px) */}
      <header className='h-16 flex-shrink-0 z-50 bg-[#050505] border-b border-white/5 shadow-2xl relative'>
        <AdminNavbar />
      </header>

      {/* 2. Main Layout Container */}
      <div className='flex flex-1 overflow-hidden relative'>
        
        {/* SIDEBAR AREA 
           We wrap the sidebar in a flex-shrink-0 container without any fixed widths.
           This allows the smart AdminSidebar component inside to dictate its own 
           responsive width (Icon-only on mobile, full width on desktop).
        */}
        <div className="flex-shrink-0 z-40 h-full relative">
            <AdminSidebar />
        </div>

        {/* 3. DYNAMIC CONTENT AREA (The only scrollable part)
           'overflow-y-auto' here means ONLY this section catches the mouse wheel.
        */}
        <main className='flex-1 overflow-y-auto bg-[#0a0a0a] custom-scrollbar'>
            {/* Background Glow Effect 
               This adds that "Professional" tech look to your dashboard 
            */}
            <div className="relative min-h-full p-4 md:p-6 lg:p-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-[1600px] mx-auto relative animate-fadeIn">
                   <Outlet />
                </div>
            </div>
        </main>

      </div>
    </div>
  )
}

export default Layout