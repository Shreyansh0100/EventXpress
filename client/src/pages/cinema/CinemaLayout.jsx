import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useAppContext } from '../../context/AppContext';

// FIX: Changed from named imports `{}` to default imports to match the components
import CinemaSidebar from '../../components/cinema/CinemaSidebar';
import CinemaNavbar from '../../components/cinema/CinemaNavbar';
import { Loader2 } from 'lucide-react';

const CinemaLayout = () => {
    const { user, dbUser } = useAppContext();
    const { isLoaded } = useUser();

    // 1. Wait for Clerk to resolve session before checking user presence
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    // 2. If no user after load, show SignIn
    if (!user) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#050505] p-4 sm:p-6">
                <div className="w-full max-w-md mx-auto">
                    <SignIn routing="hash" fallbackRedirectUrl={'/cinema'} 
                        appearance={{ 
                            elements: { 
                                rootBox: "w-full mx-auto",
                                card: "w-full shadow-2xl bg-[#0a0a0a] border border-gray-800 rounded-2xl",
                                headerTitle: "text-white",
                                headerSubtitle: "text-gray-400",
                                socialButtonsBlockButtonText: "text-white font-medium",
                                socialButtonsBlockButton: "border-gray-700 hover:bg-white/5",
                                dividerLine: "bg-gray-800",
                                dividerText: "text-gray-500",
                                formFieldLabel: "text-gray-300",
                                formFieldInput: "bg-[#121212] border-gray-700 text-white focus:border-orange-500",
                                formButtonPrimary: "bg-white hover:bg-gray-200 text-black font-bold py-2.5",
                                footerActionText: "text-gray-400",
                                footerActionLink: "text-orange-400 hover:text-orange-300"
                            } 
                        }}
                    />
                </div>
            </div>
        );
    }

    if (user && !dbUser) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
        );
    }

    if (dbUser.role !== 'cinema' && dbUser.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen bg-[#000000] font-outfit text-gray-200 selection:bg-white/20 overflow-hidden w-full">
            <CinemaSidebar />
            
            {/* Adjusted the left margin to account for mobile vs desktop sidebar widths.
                Mobile sidebar is w-16 (4rem / 64px). 
                Desktop sidebar is w-64 (16rem / 256px).
            */}
            <div className="flex-1 ml-16 md:ml-64 flex flex-col h-screen relative w-[calc(100%-4rem)] md:w-[calc(100%-16rem)]">
                <CinemaNavbar />
                
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-full pb-10 custom-scrollbar">
                    <div className="w-full max-w-none xl:max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CinemaLayout;