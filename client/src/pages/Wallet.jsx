import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Wallet as WalletIcon, Sparkles, TrendingUp, Gift, Ticket, CupSoda, ArrowRight, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Loading from '../components/Loading';

const Wallet = () => {
    const { user, axios, getToken } = useAppContext();
    const navigate = useNavigate();
    
    const [balance, setBalance] = useState(user?.loyaltyPoints || 0);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const fetchWalletData = async () => {
            try {
                const token = await getToken();
                
                // Fetch Latest Balance
                const profileRes = await axios.get('/api/user/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (profileRes.data.success && profileRes.data.user) {
                    setBalance(profileRes.data.user.loyaltyPoints || 0);
                }

                // Fetch Transaction History
                const historyRes = await axios.get('/api/user/transactions', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (historyRes.data.success) {
                    setTransactions(historyRes.data.transactions);
                }

            } catch (error) {
                console.error("Failed to fetch wallet data:", error);
                setBalance(user.loyaltyPoints || 0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWalletData();
    }, [user, axios, getToken, navigate]);

    if (isLoading) return <Loading />;

    return (
        <div className="min-h-screen bg-[#0b0b0b] pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6 md:px-16 lg:px-36 font-outfit text-white animate-fadeIn max-w-[1600px] mx-auto">
            
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black flex items-center gap-2 sm:gap-3">
                        <WalletIcon className="text-primary" size={28} strokeWidth={2.5}/> My Wallet
                    </h1>
                    <p className="text-gray-400 mt-1.5 sm:mt-2 text-sm sm:text-base">Manage your EventXpress loyalty coins and rewards.</p>
                </div>

                {/* THE BALANCE CARD */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden mb-8 sm:mb-12">
                    {/* Background Glow Effect */}
                    <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-40 sm:h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                        <div className="text-center md:text-left w-full md:w-auto">
                            <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest font-bold mb-1 sm:mb-2">Available Coins</p>
                            <h2 className="text-5xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 flex items-center justify-center md:justify-start gap-2 drop-shadow-lg">
                                {balance} 
                            </h2>
                            <p className="text-yellow-500/80 font-medium flex items-center justify-center md:justify-start gap-1.5 mt-2 text-xs sm:text-sm">
                                <Sparkles size={14} className="sm:w-4 sm:h-4"/> 1 Coin = Real Perks
                            </p>
                        </div>

                        <button 
                            onClick={() => navigate('/Home')}
                            className="w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm sm:text-base shrink-0"
                        >
                            Book a Movie <ArrowRight size={18} className="sm:w-5 sm:h-5"/>
                        </button>
                    </div>
                </div>

                {/* INFO GRID: How it works */}
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-200">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    
                    {/* Earn Card */}
                    <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 sm:p-6 hover:border-gray-700 transition duration-300">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-3 sm:mb-4 border border-green-500/20">
                            <TrendingUp size={20} className="sm:w-6 sm:h-6"/>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Earn 5% Back</h4>
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                            Every time you book a ticket online, you automatically earn 5% of your total order value back as loyalty coins.
                        </p>
                        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500 font-medium">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Book a ₹500 Ticket</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Earn 25 Coins instantly</li>
                        </ul>
                    </div>

                    {/* Spend Card */}
                    <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 sm:p-6 hover:border-gray-700 transition duration-300">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 mb-3 sm:mb-4 border border-yellow-500/20">
                            <Gift size={20} className="sm:w-6 sm:h-6"/>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Unlock Premium Rewards</h4>
                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                            Use your coins at the checkout page to unlock exclusive flat discounts, percentage drops, and free food & beverage combos!
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-gray-900 border border-gray-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-gray-300"><Ticket size={12} className="sm:w-3.5 sm:h-3.5"/> Discounts</span>
                            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-gray-900 border border-gray-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-gray-300"><CupSoda size={12} className="sm:w-3.5 sm:h-3.5"/> Free F&B</span>
                        </div>
                    </div>
                </div>

                {/* THE LEDGER: Transaction History */}
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-200 flex items-center gap-2">
                    <History size={20} className="text-primary sm:w-6 sm:h-6"/> Coin Ledger
                </h3>
                
                <div className="bg-[#121212] border border-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                    {transactions.length === 0 ? (
                        <div className="p-8 sm:p-12 text-center text-gray-500">
                            <History size={40} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-20"/>
                            <p className="text-sm sm:text-base">No transactions yet.</p>
                            <p className="text-xs sm:text-sm mt-1">Book a movie to start earning coins!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800/50 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                            {transactions.map((tx) => {
                                const isEarning = tx.type === 'EARNED';
                                const amountStr = isEarning ? `+${tx.amount}` : tx.amount.toString();
                                const colorClass = isEarning ? 'text-green-400' : 'text-red-400';
                                const bgClass = isEarning ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
                                const Icon = isEarning ? ArrowDownLeft : ArrowUpRight;

                                return (
                                    <div key={tx._id} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 sm:gap-4">
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border ${bgClass} ${colorClass}`}>
                                                <Icon size={16} className="sm:w-5 sm:h-5"/>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-xs sm:text-sm md:text-base truncate">{tx.description}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                                                    {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`font-black text-base sm:text-lg md:text-xl font-mono shrink-0 ${colorClass}`}>
                                            {amountStr}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Wallet;