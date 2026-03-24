import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { meetingRequestAPI } from '../services/api';
import '../styles/Table.css';
import '../styles/Contacts.css'; // For filter pills

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
            if (withLoader) setLoading(true);
            setError('');
            if (!user?.userId) throw new Error('User not authenticated');
            
            const data = await meetingRequestAPI.getClientRequests('all');
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading requests:', error);
            setError('Failed to load requests. Please try again.');
        } finally {
            if (withLoader) setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        const upperStatus = status?.toUpperCase();
        switch (upperStatus) {
            case 'PENDING':
                return {
                    icon: <AlertTriangle className="text-sky-600" size={20} />,
                    badgeClass: 'status-badge-pending',
                    text: 'Pending'
                };
            case 'ACCEPTED':
                return {
                    icon: <CheckCircle className="text-emerald-600" size={20} />,
                    badgeClass: 'status-badge-accepted',
                    text: 'Accepted'
                };
            case 'REJECTED':
                return {
                    icon: <XCircle className="text-red-600" size={20} />,
                    badgeClass: 'status-badge-rejected',
                    text: 'Rejected'
                };
            default:
                return {
                    icon: <Clock className="text-slate-500" size={20} />,
                    badgeClass: 'status-badge-default',
                    text: status || 'Unknown'
                };
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
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page-shell">
                <div className="surface-card p-6 text-sm text-slate-500">Loading your requests...</div>
            </div>
        );
    }

    return (
        <div className="page-shell space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50/35 to-white p-5 sm:p-6 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2"><Calendar className="text-sky-600" /> My Meeting Requests</h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">Track all your meeting requests and their status.</p>
            </header>

            <div className="surface-card p-5 sm:p-6">
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {([
                        { key: 'all', label: 'All', count: statusCounts.all },
                        { key: 'pending', label: 'Pending', count: statusCounts.pending },
                        { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
                        { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
                    ]).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`filter-pill ${filter === tab.key ? 'active' : ''}`}
                        >
                            {tab.label}
                            <span className="filter-pill-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6">{error}</div>
                )}

                {/* Requests List */}
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-16">
                        <Info size={48} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">
                            {filter === 'all' ? 'No requests sent yet' : `No ${filter} requests`}
                        </h3>
                        <p className="text-slate-500 mt-1">
                            {filter === 'all'
                                ? 'Find a caterer and request a meeting to get started.'
                                : 'There are no requests with this status.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRequests.map((request, index) => {
                            const statusInfo = getStatusInfo(request.status);
                            return (
                                <div key={request.id || index} className="border border-slate-200 rounded-xl p-5 hover:bg-slate-50 transition-colors shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">{statusInfo.icon}</div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">
                                                    {request.catererName}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    Request sent on {formatDate(request.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${statusInfo.badgeClass}`}>
                                            {statusInfo.text}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar size={16} className="text-slate-400" />
                                            <div>
                                                <span className="font-semibold">Event Date:</span> {formatDate(request.eventDate)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users size={16} className="text-slate-400" />
                                            <div>
                                                <span className="font-semibold">Guests:</span> {request.numberOfGuests}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin size={16} className="text-slate-400" />
                                            <div>
                                                <span className="font-semibold">Location:</span> {request.eventLocation}
                                            </div>
                                        </div>
                                    </div>
                                    

                                    {request.message && (
                                        <div className="mt-4 text-sm text-slate-700 bg-slate-100 p-3 rounded-md">
                                            <strong>Your message:</strong> "{request.message}"
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientMeetingRequests;
