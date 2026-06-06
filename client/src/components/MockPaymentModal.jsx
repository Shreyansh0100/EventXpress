import React, { useState } from 'react';
// FIXED: Added Loader2 to the imports below!
import { X, CreditCard, QrCode, ShieldCheck, CheckCircle, ArrowRight, Lock, RefreshCw, Loader2, Film } from 'lucide-react';
// IMPORT YOUR IMAGE HERE
import scannerImg from '../assets/scanner.jpeg'; 

const MockPaymentModal = ({ amount, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('UPI'); 
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('INPUT'); // 'INPUT' | 'PROCESSING' | 'SUCCESS'

  const handlePay = () => {
    setStep('PROCESSING');
    setProcessing(true);
    
    // Simulate Gateway Delay
    setTimeout(() => {
        setStep('SUCCESS');
        setProcessing(false);
        setTimeout(() => {
            // Using a realistic transaction ID format
            onSuccess({ transactionId: "TXN_Shreyansh_" + Math.floor(Math.random() * 1000000) });
        }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn font-outfit">
      
      {/* Main Card */}
      <div className="bg-[#0f0f0f] w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-800 relative flex flex-col">
        
        {/* Glow effect in background */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

        {/* Close Button */}
        {step === 'INPUT' && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 z-20 bg-gray-900 p-2 rounded-full transition-all hover:rotate-90">
                <X size={18}/>
            </button>
        )}

        {/* Header Section */}
        <div className="p-8 pb-4 text-center relative z-10 border-b border-gray-800/50">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-500/20">
                <ShieldCheck size={14}/> Secure Checkout
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Payable</p>
            <div className="flex items-center justify-center gap-1">
                <span className="text-2xl text-gray-500">₹</span>
                <span className="text-5xl font-black text-white tracking-tight">{amount}</span>
            </div>
        </div>

        {/* Content Body */}
        <div className="p-6 relative flex-1">
            
            {step === 'INPUT' && (
                <div className="animate-fadeIn">
                    {/* Payment Method Tabs */}
                    <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 mb-6 relative">
                        <button 
                            onClick={()=>setActiveTab('UPI')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'UPI' ? 'bg-gray-800 text-white shadow-md border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <QrCode size={16}/> Scan QR
                        </button>
                        <button 
                            onClick={()=>setActiveTab('CARD')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'CARD' ? 'bg-gray-800 text-white shadow-md border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <CreditCard size={16}/> Saved Card
                        </button>
                    </div>

                    {/* --- UPI SCANNER TAB --- */}
                    {activeTab === 'UPI' && (
                        <div className="flex flex-col items-center animate-fadeIn">
                            <div className="relative group p-4 bg-white rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.05)] border-4 border-gray-800">
                                
                                {/* Scanner Box */}
                                <div className="relative overflow-hidden rounded-xl border border-gray-200">
                                    <img 
                                        src={scannerImg} 
                                        alt="Scan to Pay" 
                                        className="w-48 h-auto object-cover"
                                    />
                                    {/* Scanning Laser Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_#ef4444] animate-scanLine opacity-80 pointer-events-none"></div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-5">
                                <span className="text-xs font-bold text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">GPay</span>
                                <span className="text-xs font-bold text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">PhonePe</span>
                                <span className="text-xs font-bold text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">Paytm</span>
                            </div>

                            {/* Logical Button for UPI */}
                            <button 
                                onClick={handlePay} 
                                className="w-full mt-6 bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18}/> Verify Payment Status
                            </button>
                        </div>
                    )}

                    {/* --- CARD TAB --- */}
                    {activeTab === 'CARD' && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Realistic Saved Card UI */}
                            <div className="p-5 bg-gradient-to-tr from-gray-900 to-gray-800 rounded-2xl border border-gray-700 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                
                                <div className="flex justify-between items-center mb-6">
                                    <div className="w-10 h-7 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-md opacity-90"></div>
                                    <span className="text-[10px] font-bold tracking-widest text-gray-400 bg-black/50 px-2 py-1 rounded-full">HDFC BANK</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="font-mono text-lg tracking-[0.2em] text-white drop-shadow-md">•••• •••• •••• 4242</p>
                                        <p className="text-xs font-medium text-gray-400 mt-1 tracking-wide">Shreyansh Kumar</p>
                                    </div>
                                    <p className="font-mono text-sm text-gray-300">12/28</p>
                                </div>
                            </div>
                            
                            {/* Fake Inputs to make it feel logical */}
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block ml-1">CVV</label>
                                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 flex items-center justify-between">
                                        <span className="text-gray-400 font-mono tracking-widest text-lg leading-none">•••</span>
                                        <ShieldCheck size={14} className="text-gray-600"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block ml-1">Expiry</label>
                                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-3">
                                        <span className="text-gray-400 font-mono text-sm">12 / 28</span>
                                    </div>
                                </div>
                            </div>

                            {/* Logical Button for Card */}
                            <button 
                                onClick={handlePay} 
                                className="w-full mt-6 bg-gradient-to-r from-primary to-rose-600 hover:to-rose-500 text-white font-bold py-3.5 rounded-xl shadow-[0_5px_20px_rgba(248,69,101,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Lock size={16}/> Pay ₹{amount} Securely
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- PROCESSING STATE --- */}
            {step === 'PROCESSING' && (
                <div className="flex flex-col items-center justify-center py-12 animate-fadeIn h-full">
                    
                    {/* EventXpress Logo Header */}
                    <div className="flex items-center gap-2 mb-8 scale-110 drop-shadow-[0_0_15px_rgba(248,69,101,0.4)]">
                        <div className="bg-gradient-to-tr from-primary to-rose-500 p-2.5 rounded-xl shadow-lg border border-white/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            <Film size={22} strokeWidth={2.5} className="text-white relative z-10" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            EventXpress
                        </h2>
                    </div>

                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 border-[6px] border-gray-800 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-[4px] border-transparent border-t-rose-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                        <Lock size={32} className="text-white shadow-primary drop-shadow-[0_0_8px_rgba(248,69,101,0.8)] animate-pulse"/>
                    </div>
                    
                    <h3 className="font-black text-white text-2xl mt-8">Securing Payment...</h3>
                    <p className="text-sm font-medium text-gray-400 mt-2 text-center max-w-[280px]">Please do not close this window or press back button.</p>
                </div>
            )}

            {/* --- SUCCESS STATE --- */}
            {step === 'SUCCESS' && (
                <div className="flex flex-col items-center justify-center py-12 animate-fadeIn h-full">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                        <CheckCircle className="w-12 h-12 text-emerald-500"/>
                    </div>
                    <h3 className="text-2xl font-black text-white">Payment Successful!</h3>
                    <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin"/> Redirecting to tickets...
                    </p>
                </div>
            )}

        </div>
        
        {/* Footer */}
        <div className="bg-[#0a0a0a] p-4 text-center border-t border-gray-800/80">
            <p className="text-[10px] font-bold text-gray-600 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                <Lock size={10}/> 256-bit SSL Encrypted Transaction
            </p>
        </div>

      </div>
      
      {/* CSS Animation for Laser */}
      <style>{`
        @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scanLine {
            animation: scanLine 2s linear infinite;
        }
      `}</style>

    </div>
  );
};

export default MockPaymentModal;