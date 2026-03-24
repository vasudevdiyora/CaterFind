import React, { useState, useEffect } from 'react';
import { CalendarCheck, Utensils, MapPin, Users, Info } from 'lucide-react';
import { meetingRequestAPI } from '../services/api';
import '../styles/Table.css';

const ClientTrials = ({ user }) => {
    const [trials, setTrials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTrials();
    }, [user]);

    const loadTrials = async () => {
        setLoading(true);
        setError('');
        try {
            if (!user?.userId) throw new Error("User not authenticated");
            const data = await meetingRequestAPI.getClientRequests('accepted');
            setTrials(Array.isArray(data) ? data : []);
        } catch {
            setError('Could not load your trials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page-shell justify-center items-center">
                <p>Loading your confirmed trials...</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <header className="page-header">
                <h1 className="page-title"><CalendarCheck /> My Trials</h1>
                <p className="page-subtitle">Accepted meeting requests appear here as confirmed trials.</p>
            </header>

            <div className="max-w-4xl mx-auto">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6">
                        {error}
                        <button onClick={loadTrials} className="ml-4 text-sm font-semibold underline">Retry</button>
                    </div>
                )}

                {trials.length === 0 && !error ? (
                    <div className="surface-card text-center py-16">
                        <Info size={48} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">No Trials Yet</h3>
                        <p className="text-slate-500 mt-1">
                            When a caterer accepts your meeting request, it will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {trials.map(trial => (
                            <div key={trial.id} className="surface-card p-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800">
                                            {trial.catererName || 'Caterer'}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Confirmed on {new Date(trial.updatedAt).toLocaleDateString('en-US')}
                                        </p>
                                    </div>
                                    <div className="status-badge-accepted self-start sm:self-center">
                                        Accepted
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-200">
                                    <InfoItem icon={<CalendarCheck size={18} />} label="Event Date" value={formatDate(trial.eventDate)} />
                                    <InfoItem icon={<Utensils size={18} />} label="Event Type" value={trial.eventType} />
                                    <InfoItem icon={<MapPin size={18} />} label="Location" value={trial.eventLocation} />
                                    <InfoItem icon={<Users size={18} />} label="Guests" value={trial.numberOfGuests} />
                                </div>

                                {trial.message && (
                                    <div className="mt-4 text-sm text-slate-700 bg-slate-100 p-3 rounded-md">
                                        <strong>Your original message:</strong> "{trial.message}"
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

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="text-slate-400 mt-0.5">{icon}</div>
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-semibold text-slate-700">{value || '—'}</p>
        </div>
    </div>
);

export default ClientTrials;
