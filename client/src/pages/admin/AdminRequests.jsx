import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { CalendarClock, CheckCircle, XCircle, MapPin, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRequests = () => {
    const { axios, getToken } = useAppContext();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Action State
    const [replyText, setReplyText] = useState({});
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/schedule-requests/all", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) setRequests(data.requests);
        } catch (error) {
            toast.error("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        setProcessingId(id);
        try {
            const token = await getToken();
            const payload = {
                requestId: id,
                status: status,
                adminReply: replyText[id] || (status === 'APPROVED' ? 'Approved and scheduled.' : 'Request declined.')
            };

            const { data } = await axios.put("/api/schedule-requests/update-status", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(`Request ${status.toLowerCase()}!`);
                fetchRequests(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Action failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReplyChange = (id, text) => {
        setReplyText(prev => ({ ...prev, [id]: text }));
    };

    if (loading) return <Loading />;

    return (
        <div className="pb-20 font-outfit text-white animate-fadeIn">
            <div className="mb-8">
                <Title text1="Theater" text2="Requests" />
                <p className="text-gray-500 text-sm mt-1 font-medium">Review and approve movie scheduling requests from local cinema managers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {requests.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-500">No requests pending.</div>
                ) : (
                    requests.map(req => (
                        <div key={req._id} className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                            <div className="p-5 border-b border-gray-800 bg-[#121212]">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white leading-tight">
                                        {req.movie?.title || req.customMovieTitle}
                                    </h3>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border tracking-widest ${
                                        req.status === 'PENDING' ? 'text-orange-400 border-orange-400/30 bg-orange-400/10' :
                                        req.status === 'APPROVED' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' :
                                        'text-red-400 border-red-400/30 bg-red-400/10'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                                <div className="space-y-1 mt-3">
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5"><MapPin size={12}/> {req.theater?.name}, {req.theater?.city}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5"><User size={12}/> {req.requestedBy?.name}</p>
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1 bg-[#050505] flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#121212] p-3 rounded-lg border border-gray-800">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Dates</p>
                                        <p className="text-xs text-white">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-[#121212] p-3 rounded-lg border border-gray-800">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Times</p>
                                        <p className="text-xs text-white">{req.preferredTimes?.join(', ') || 'Any'}</p>
                                    </div>
                                </div>

                                {req.message && (
                                    <div className="bg-[#121212] p-3 rounded-lg border border-gray-800">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Manager's Note</p>
                                        <p className="text-sm text-gray-300 italic">"{req.message}"</p>
                                    </div>
                                )}

                                {req.status === 'PENDING' && (
                                    <div className="mt-auto pt-4 border-t border-gray-800">
                                        <input 
                                            type="text" 
                                            placeholder="Write a reply (optional)..."
                                            value={replyText[req._id] || ''}
                                            onChange={(e) => handleReplyChange(req._id, e.target.value)}
                                            className="w-full bg-[#121212] border border-gray-800 text-white px-3 py-2 rounded-lg text-sm outline-none focus:border-gray-600 mb-3"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleAction(req._id, 'REJECTED')}
                                                disabled={processingId === req._id}
                                                className="flex-1 py-2 bg-transparent border border-red-500/50 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1.5"
                                            >
                                                <XCircle size={14}/> Reject
                                            </button>
                                            <button 
                                                onClick={() => handleAction(req._id, 'APPROVED')}
                                                disabled={processingId === req._id}
                                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1.5"
                                            >
                                                <CheckCircle size={14}/> Approve
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {req.status !== 'PENDING' && (
                                    <div className="mt-auto pt-4 border-t border-gray-800">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><MessageSquare size={12}/> Your Reply:</p>
                                        <p className="text-sm text-gray-300 bg-[#121212] p-3 rounded-lg border border-gray-800">{req.adminReply || 'No reply provided.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminRequests;