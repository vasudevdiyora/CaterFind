import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, MessageCircle, Check, X, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { meetingRequestAPI, profileAPI, chatAPI } from '../services/api';
import MeetingAcceptModal from '../components/MeetingAcceptModal';
import { useDialog } from '../components/DialogProvider';

/**
 * Client Requests Page - Caterer Side
 * Shows all meeting/event requests from clients with ability to accept/reject
 */
const ClientRequests = ({ user }) => {
    const { showConfirm } = useDialog();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
    const [error, setError] = useState('');
    const [counts, setCounts] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
    const [acceptModalOpen, setAcceptModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [messagesUnread, setMessagesUnread] = useState(0);

    useEffect(() => {
        if (user?.userId) {
            loadRequests();
        }
    }, [user, filter]);

    // Load unread conversations count for badge
    useEffect(() => {
        let mounted = true;
        const loadUnread = async () => {
            try {
                const convs = await chatAPI.getConversations();
                console.debug('[ClientRequests] loaded conversations', convs);
                if (!mounted) return;
                const total = (convs || []).reduce((acc, c) => acc + (Number(c.unreadCount || c.unread || c.unread_count || 0) || 0), 0);
                setMessagesUnread(total);
            } catch (e) {
                // ignore
            }
        };
        loadUnread();
        const id = setInterval(loadUnread, 10000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await meetingRequestAPI.getCatererRequests(filter);

            // If filter is not 'all', also fetch the full list to compute counts
            const allData = filter === 'all' ? data : await meetingRequestAPI.getCatererRequests('all');

            const transform = (arr) => (arr || []).map(req => ({
                id: req.id,
                clientId: req.clientId,
                clientName: req.clientName,
                status: req.status,
                date: req.eventDate,
                location: req.eventLocation,
                guests: req.numberOfGuests,
                eventType: req.eventType,
                message: req.message,
                createdAt: req.createdAt,
            }));

            const transformedRequests = transform(data || []);
            const transformedAll = transform(allData || []);

            setRequests(transformedRequests);

            // Compute counts from the full list
            const pending = transformedAll.filter(r => r.status?.toUpperCase() === 'PENDING').length;
            const accepted = transformedAll.filter(r => r.status?.toUpperCase() === 'ACCEPTED').length;
            const rejected = transformedAll.filter(r => r.status?.toUpperCase() === 'REJECTED').length;
            setCounts({ total: transformedAll.length, pending, accepted, rejected });
        } catch (error) {
            console.error('Error loading requests:', error);
            setError('Failed to load requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request) => {
        // Open modal to collect date/time/place before accepting
        setSelectedRequest(request);
        setAcceptModalOpen(true);

        // Preload business profile for default place
        try {
            const profile = await profileAPI.get(user?.userId || user?.id);
            setBusinessProfile(profile || null);
        } catch (err) {
            console.warn('Could not load business profile for default address', err);
            setBusinessProfile(null);
        }
    };

    const confirmAccept = async (requestId, payload) => {
        try {
            // If meetingPlace not provided, default to business address if available
            if (!payload.meetingPlace) {
                const addrParts = [];
                if (businessProfile) {
                    if (businessProfile.streetAddress) addrParts.push(businessProfile.streetAddress);
                    if (businessProfile.area) addrParts.push(businessProfile.area);
                    if (businessProfile.city) addrParts.push(businessProfile.city);
                    if (businessProfile.landmark) addrParts.push(businessProfile.landmark);
                }
                const defaultAddr = addrParts.filter(Boolean).join(', ');
                if (defaultAddr) payload.meetingPlace = defaultAddr;
                // If profile has coordinates, include them so backend can produce a coordinate-based maps link
                if ((!payload.meetingLatitude || !payload.meetingLongitude) && businessProfile && businessProfile.latitude && businessProfile.longitude) {
                    const lat = Number(businessProfile.latitude);
                    const lon = Number(businessProfile.longitude);
                    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                        payload.meetingLatitude = lat;
                        payload.meetingLongitude = lon;
                    }
                }
            }

            await meetingRequestAPI.accept(requestId, payload);

            // Optimistic update
            setRequests(prev =>
                prev.map(req =>
                    req.id === requestId ? { ...req, status: 'ACCEPTED', meetingDate: payload.meetingDate, meetingTime: payload.meetingTime, meetingPlace: payload.meetingPlace, meetingLatitude: payload.meetingLatitude, meetingLongitude: payload.meetingLongitude } : req
                )
            );
        } catch (error) {
            console.error('Error accepting request:', error);
            alert(error.message || 'Failed to accept request. Please try again.');
        }
    };

    const handleReject = async (requestId) => {
        const shouldReject = await showConfirm('Are you sure you want to reject this request?', {
            title: 'Reject Request',
            confirmText: 'Reject'
        });

        if (!shouldReject) return;

        try {
            await meetingRequestAPI.reject(requestId);
            
            // Optimistic update
            setRequests(prev =>
                prev.map(req =>
                    req.id === requestId ? { ...req, status: 'REJECTED' } : req
                )
            );
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert(error.message || 'Failed to reject request. Please try again.');
        }
    };

    const handleMessage = (request) => {
        navigate('/owner/messages', { 
            state: { 
                openConversationWith: request.clientId,
                clientName: request.clientName 
            } 
        });
    };

    const getStatusInfo = (status) => {
        if (!status) return { text: 'Unknown', color: 'text-slate-500', bg: 'bg-slate-100', icon: Clock };
        
        switch (status.toUpperCase()) {
            case 'PENDING':
                return { 
                    text: 'Pending Action', 
                    color: 'text-sky-700', 
                    bg: 'bg-sky-50', 
                    border: 'border-sky-200',
                    icon: AlertTriangle 
                };
            case 'ACCEPTED':
                return { 
                    text: 'Accepted', 
                    color: 'text-emerald-700', 
                    bg: 'bg-emerald-50', 
                    border: 'border-emerald-200',
                    icon: CheckCircle 
                };
            case 'REJECTED':
                return { 
                    text: 'Rejected', 
                    color: 'text-red-700', 
                    bg: 'bg-red-50', 
                    border: 'border-red-200',
                    icon: XCircle 
                };
            default:
                return { 
                    text: status, 
                    color: 'text-slate-700', 
                    bg: 'bg-slate-50', 
                    border: 'border-slate-200',
                    icon: Clock 
                };
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status?.toUpperCase() === filter.toUpperCase();
    });

    const pendingCount = counts.pending;
    const acceptedCount = counts.accepted;
    const rejectedCount = counts.rejected;

    const filterOptions = [
        { key: 'all', label: 'All', count: counts.total },
        { key: 'pending', label: 'Pending', count: pendingCount },
        { key: 'accepted', label: 'Accepted', count: acceptedCount },
        { key: 'rejected', label: 'Rejected', count: rejectedCount },
    ];

    if (loading) {
        return (
            <div className="page-shell space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50/40 to-white p-5 md:p-6 shadow-sm">
                    <div className="h-7 w-56 rounded-md bg-slate-200 animate-pulse"></div>
                    <div className="mt-3 h-4 w-80 max-w-full rounded-md bg-slate-100 animate-pulse"></div>
                </div>

                <div className="grid gap-4">
                    {[1, 2, 3].map((skeleton) => (
                        <div key={skeleton} className="surface-card p-5 animate-pulse">
                            <div className="flex flex-col gap-4">
                                <div className="h-5 w-44 rounded bg-slate-200"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="h-10 rounded bg-slate-100"></div>
                                    <div className="h-10 rounded bg-slate-100"></div>
                                    <div className="h-10 rounded bg-slate-100"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-shell space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50/40 to-white p-5 md:p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Client Requests</h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-1">Manage incoming event inquiries and bookings.</p>
                        </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            Pending: {pendingCount}
                        </div>
                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Accepted: {acceptedCount}
                        </div>
                        <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            Rejected: {rejectedCount}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={() => navigate('/owner/messages')}
                            className="py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold flex items-center gap-2 h-10 sm:h-9 w-full sm:w-auto"
                        >
                            <MessageCircle size={16} />
                            Client Messages
                            {messagesUnread > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-rose-600 rounded-full">
                                    {messagesUnread}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                    {filterOptions.map(option => (
                        <button
                            key={option.key}
                            onClick={() => setFilter(option.key)}
                            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filter === option.key
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>{option.label}</span>
                            <span className={`ml-2 text-xs ${filter === option.key ? 'text-white/90' : 'text-slate-400'}`}>
                                {option.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center justify-between">
                    <p>{error}</p>
                    <button onClick={loadRequests} className="text-sm font-semibold hover:underline">Retry</button>
                </div>
            )}

            {/* Content Area */}
            {filteredRequests.length === 0 ? (
                <div className="surface-card flex flex-col items-center justify-center min-h-[400px] text-center p-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Users className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Requests Found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        {filter === 'all' 
                            ? "You haven't received any client requests yet. Make sure your profile is up to date!" 
                            : `There are no ${filter} requests at the moment.`}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRequests.map((request, index) => {
                        const status = getStatusInfo(request.status);
                        const StatusIcon = status.icon;
                        const borderColor = status.color.includes('amber')
                            ? '#d97706'
                            : status.color.includes('emerald')
                            ? '#059669'
                            : status.color.includes('red')
                            ? '#dc2626'
                            : '#94a3b8';

                        return (
                            <div
                                key={`${request.id}-${index}`}
                                className="surface-card group hover:shadow-md transition-all duration-200 border-l-4 p-4 md:p-5"
                                style={{ borderLeftColor: borderColor }}
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left: Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-900">{request.clientName}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${status.bg} ${status.color} border ${status.border}`}>
                                                        <StatusIcon size={12} />
                                                        {status.text}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    Creating a <span className="font-semibold text-slate-700">{request.eventType}</span>
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                                                ID: #{request.id.toString().slice(-6)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                <Calendar size={16} className="text-slate-400" />
                                                <span className="font-medium">
                                                    {new Date(request.date).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                <Users size={16} className="text-slate-400" />
                                                <span className="font-medium">{request.guests} Guests</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                <MapPin size={16} className="text-slate-400" />
                                                <span className="font-medium truncate">{request.location}</span>
                                            </div>
                                        </div>

                                        {request.message && (
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600 italic relative">
                                                <span className="absolute top-2 left-2 text-slate-300 text-xl font-serif">"</span>
                                                <p className="pl-4">{request.message}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex md:flex-col gap-2 md:w-48 md:border-l md:border-slate-200 md:pl-6 justify-center">
                                        {(request.status?.toUpperCase() === 'PENDING') && (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(request)}
                                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <Check size={16} />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request.id)}
                                                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <X size={16} />
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        
                                        <button
                                            onClick={() => handleMessage(request)}
                                            className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-auto"
                                        >
                                            <MessageCircle size={16} />
                                            Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <MeetingAcceptModal
                isOpen={acceptModalOpen}
                onClose={() => { setAcceptModalOpen(false); setSelectedRequest(null); }}
                request={selectedRequest}
                defaultPlace={businessProfile ? `${businessProfile.streetAddress || ''}${businessProfile.area ? ', ' + businessProfile.area : ''}${businessProfile.city ? ', ' + businessProfile.city : ''}` : ''}
                businessProfile={businessProfile}
                onConfirm={async (id, payload) => { await confirmAccept(id, payload); }}
            />
        </div>
    );
};

export default ClientRequests;
