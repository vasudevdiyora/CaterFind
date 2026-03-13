import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, MessageCircle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { meetingRequestAPI, profileAPI } from '../services/api';

/**
 * Client Requests Page - Caterer Side
 * Shows all meeting/event requests from clients with ability to accept/reject
 */
const ClientRequests = ({ user }) => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
    const [error, setError] = useState('');
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [meetingAddressPreference, setMeetingAddressPreference] = useState('');
    const [meetingForm, setMeetingForm] = useState({
        meetingDate: '',
        meetingTime: '',
        meetingPlace: '',
        meetingNotes: '',
    });

    useEffect(() => {
        loadRequests();
    }, [user, filter]);

    useEffect(() => {
        const loadMeetingAddressPreference = async () => {
            if (!user?.userId) return;

            try {
                const profile = await profileAPI.get(user.userId);
                if (!profile) return;

                const businessAddress = [profile.streetAddress, profile.area, profile.city, profile.landmark]
                    .map(value => (value || '').trim())
                    .filter(Boolean)
                    .join(', ');

                const preferredMeetingAddress = profile.meetingSameAsBusinessAddress
                    ? businessAddress
                    : (profile.meetingAddress || '').trim();

                setMeetingAddressPreference(preferredMeetingAddress || businessAddress || '');
            } catch (profileError) {
                console.error('Error loading meeting address preference:', profileError);
            }
        };

        loadMeetingAddressPreference();
    }, [user]);

    const loadRequests =async () => {
        try {
            setLoading(true);
            setError('');
            
            // Fetch requests from API (pass user ID)
            if (!user || !user.userId) {
                throw new Error('User not authenticated');
            }
            
            const data = await meetingRequestAPI.getCatererRequests(user.userId, filter);
            
            // Transform API response to match UI format
            const transformedRequests = data.map(req => ({
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
                meetingDate: req.meetingDate,
                meetingTime: req.meetingTime,
                meetingPlace: req.meetingPlace,
                meetingNotes: req.meetingNotes,
            }));
            
            setRequests(transformedRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
            setError('Failed to load requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openAcceptModal = (request) => {
        setSelectedRequest(request);
        setMeetingForm({
            meetingDate: request.date || '',
            meetingTime: '',
            meetingPlace: meetingAddressPreference || request.location || '',
            meetingNotes: '',
        });
        setShowMeetingModal(true);
    };

    const handleAccept = async () => {
        try {
            if (!user || !user.userId) {
                throw new Error('User not authenticated');
            }

            if (!selectedRequest) {
                throw new Error('No request selected');
            }

            if (!meetingForm.meetingDate || !meetingForm.meetingTime || !meetingForm.meetingPlace.trim()) {
                throw new Error('Please fill meeting date, time and place');
            }

            const response = await meetingRequestAPI.accept(selectedRequest.id, user.userId, meetingForm);

            setRequests(prev =>
                prev.map(req =>
                    req.id === selectedRequest.id
                        ? {
                            ...req,
                            status: 'accepted',
                            meetingDate: response.meetingDate,
                            meetingTime: response.meetingTime,
                            meetingPlace: response.meetingPlace,
                            meetingNotes: response.meetingNotes,
                        }
                        : req
                )
            );

            setShowMeetingModal(false);
            setSelectedRequest(null);
            setMeetingForm({ meetingDate: '', meetingTime: '', meetingPlace: '', meetingNotes: '' });
            alert(response.notificationMessage || 'Request accepted and meeting scheduled successfully!');
        } catch (error) {
            console.error('Error accepting request:', error);
            alert(error.message || 'Failed to accept request. Please try again.');
        }
    };

    const handleReject = async (requestId) => {
        try {
            if (!user || !user.userId) {
                throw new Error('User not authenticated');
            }
            
            await meetingRequestAPI.reject(requestId, user.userId);
            
            // Update local state
            setRequests(prev =>
                prev.map(req =>
                    req.id === requestId ? { ...req, status: 'rejected' } : req
                )
            );
            
            // Show success message
            alert('Request rejected.');
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert(error.message || 'Failed to reject request. Please try again.');
        }
    };

    const handleMessage = (request) => {
        // Navigate to messages page
        // The Chat component will handle opening the conversation
        navigate('/owner/messages', { 
            state: { 
                openConversationWith: request.clientId,
                clientName: request.clientName,
                eventName: request.eventType,
                eventPlace: request.location,
            } 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-primary text-primary-foreground';
            case 'accepted':
                return 'bg-secondary text-secondary-foreground';
            case 'rejected':
                return 'bg-destructive/20 text-destructive border border-destructive/50';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status === filter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Users className="text-primary" size={32} />
                        Client Requests
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage event requests from potential clients
                    </p>
                </div>
                
                {/* All Messages Button */}
                <button
                    onClick={() => navigate('/owner/messages')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary/20"
                >
                    <MessageCircle size={20} />
                    <span>All Messages</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={loadRequests}
                        className="mt-2 text-sm text-red-500 underline hover:text-red-600"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3">
                {['all', 'pending', 'accepted', 'rejected'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                            filter === f
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Requests Found
                    </h3>
                    <p className="text-muted-foreground">
                        {filter === 'all'
                            ? 'You have no client requests yet'
                            : `No ${filter} requests`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-card rounded-lg border border-border p-6 hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        {request.clientName}
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                                                request.status
                                            )}`}
                                        >
                                            {request.status}
                                        </span>
                                    </h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar size={16} />
                                    <span>
                                        {new Date(request.date).toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users size={16} />
                                    <span>{request.guests} guests</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin size={16} />
                                    <span>{request.location}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">{request.eventType}</span>
                                </div>
                            </div>

                            {request.message && (
                                <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-foreground">{request.message}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {request.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => openAcceptModal(request)}
                                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            <X size={18} />
                                            Reject
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleMessage(request)}
                                    className="px-4 py-2 bg-card border border-border hover:bg-secondary text-foreground rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={18} />
                                    Message
                                </button>
                            </div>

                            {request.status === 'accepted' && (request.meetingDate || request.meetingTime || request.meetingPlace) && (
                                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                                    <p className="font-semibold text-primary mb-1">Scheduled Meeting</p>
                                    <p>
                                        {request.meetingDate || 'Date TBD'}
                                        {request.meetingTime ? ` at ${request.meetingTime}` : ''}
                                    </p>
                                    {request.meetingPlace && <p>{request.meetingPlace}</p>}
                                    {request.meetingNotes && (
                                        <p className="text-muted-foreground mt-1">{request.meetingNotes}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showMeetingModal && selectedRequest && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-foreground">Schedule Meeting</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            {selectedRequest.clientName} - {selectedRequest.eventType}
                        </p>

                        <div className="space-y-3">
                            <input
                                type="date"
                                value={meetingForm.meetingDate}
                                onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground"
                            />
                            <input
                                type="time"
                                value={meetingForm.meetingTime}
                                onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingTime: e.target.value }))}
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground"
                            />
                            <input
                                type="text"
                                value={meetingForm.meetingPlace}
                                onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingPlace: e.target.value }))}
                                placeholder="Meeting place"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground"
                            />
                            <textarea
                                value={meetingForm.meetingNotes}
                                onChange={(e) => setMeetingForm(prev => ({ ...prev, meetingNotes: e.target.value }))}
                                placeholder="Notes (optional)"
                                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground min-h-[96px]"
                            />
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => {
                                    setShowMeetingModal(false);
                                    setSelectedRequest(null);
                                }}
                                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                            >
                                Save and Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientRequests;
