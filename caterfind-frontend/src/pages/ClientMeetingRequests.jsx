import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { meetingRequestAPI } from '../services/api';

/**
 * Client Meeting Requests Page - Client Side
 * Shows all meeting requests sent by the client with their status
 */
const ClientMeetingRequests = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
    const [error, setError] = useState('');

    useEffect(() => {
        loadRequests();

        const refreshInterval = setInterval(() => {
            loadRequests(false);
        }, 30000);

        return () => clearInterval(refreshInterval);
    }, [user]);

    const loadRequests = async (withLoader = true) => {
        try {
            if (withLoader) {
                setLoading(true);
            }
            setError('');
            
            if (!user || !user.userId) {
                throw new Error('User not authenticated');
            }
            
            const data = await meetingRequestAPI.getClientRequests('all');
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading requests:', error);
            setError('Failed to load requests. Please try again.');
        } finally {
            if (withLoader) {
                setLoading(false);
            }
        }
    };

    const getStatusIcon = (status) => {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'PENDING':
                return <AlertCircle className="text-yellow-500" size={24} />;
            case 'ACCEPTED':
                return <CheckCircle className="text-green-500" size={24} />;
            case 'REJECTED':
                return <XCircle className="text-red-500" size={24} />;
            default:
                return <Clock className="text-gray-400" size={24} />;
        }
    };

    const getStatusBadge = (status) => {
        const upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case 'PENDING':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
            case 'ACCEPTED':
                return 'bg-green-500/20 text-green-400 border border-green-500/50';
            case 'REJECTED':
                return 'bg-red-500/20 text-red-400 border border-red-500/50';
            default:
                return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
        }
    };

    const statusCounts = {
        all: requests.length,
        pending: requests.filter(r => r.status?.toUpperCase() === 'PENDING').length,
        accepted: requests.filter(r => r.status?.toUpperCase() === 'ACCEPTED').length,
        rejected: requests.filter(r => r.status?.toUpperCase() === 'REJECTED').length,
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status?.toUpperCase() === filter.toUpperCase();
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-gray-400 text-lg">Loading your requests...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Calendar className="text-orange-400" size={40} />
                        My Meeting Requests
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Track all your meeting requests and their status
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                    {[
                        { key: 'all', label: 'All Requests', count: statusCounts.all },
                        { key: 'pending', label: 'Pending', count: statusCounts.pending },
                        { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
                        { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                filter === tab.key
                                    ? 'bg-orange-500 text-white shadow-lg'
                                    : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333] border border-gray-700'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                filter === tab.key ? 'bg-white/20' : 'bg-gray-700'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {/* Requests List */}
                {filteredRequests.length === 0 ? (
                    <div className="bg-[#2a2a2a] rounded-2xl p-12 text-center border border-gray-700">
                        <Calendar className="mx-auto mb-4 text-gray-600" size={64} />
                        <h3 className="text-xl font-semibold mb-2 text-gray-400">
                            {filter === 'all' ? 'No requests yet' : `No ${filter} requests`}
                        </h3>
                        <p className="text-gray-500">
                            {filter === 'all' 
                                ? 'Browse caterers and send meeting requests to get started!'
                                : 'Your requests will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-[#2a2a2a] rounded-2xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all"
                            >
                                {/* Header with Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(request.status)}
                                        <div>
                                            <h3 className="text-xl font-bold text-white">
                                                {request.catererName}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                Sent on {formatDate(request.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusBadge(request.status)}`}>
                                        {request.status.toLowerCase()}
                                    </span>
                                </div>

                                {/* Event Details */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Calendar className="text-orange-400" size={18} />
                                        <span>{formatDate(request.eventDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Users className="text-orange-400" size={18} />
                                        <span>{request.numberOfGuests} guests</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <MapPin className="text-orange-400" size={18} />
                                        <span>{request.eventLocation}</span>
                                    </div>
                                </div>

                                {/* Event Type */}
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 rounded-lg text-sm">
                                        <span className="text-orange-400">🎉</span>
                                        <span className="text-gray-300">{request.eventType}</span>
                                    </span>
                                </div>

                                {/* Message */}
                                {request.message && (
                                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-700">
                                        <p className="text-sm text-gray-400 mb-1">Your Message:</p>
                                        <p className="text-gray-300">{request.message}</p>
                                    </div>
                                )}

                                {/* Response Time (if accepted/rejected) */}
                                {request.respondedAt && (
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <p className="text-xs text-gray-500">
                                            Responded on {formatDate(request.respondedAt)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientMeetingRequests;
