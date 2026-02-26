import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';

const ClientTrials = ({ user }) => {
    const [trials, setTrials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch trials from API
        // For now, using mock data
        setTimeout(() => {
            setTrials([
                {
                    id: 1,
                    catererName: 'Sharma Catering Services',
                    date: '2026-03-15',
                    time: '14:00',
                    location: 'South Delhi',
                    status: 'scheduled',
                    cuisine: 'Punjabi',
                },
                {
                    id: 2,
                    catererName: 'Chennai Tiffin House',
                    date: '2026-03-20',
                    time: '12:00',
                    location: 'Dwarka',
                    status: 'scheduled',
                    cuisine: 'South Indian',
                },
            ]);
            setLoading(false);
        }, 500);
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'completed':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'cancelled':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-20">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Sample Trials</h1>
                <p className="text-muted-foreground">
                    Manage your scheduled food tasting sessions
                </p>
            </div>

            {trials.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        No Trials Scheduled
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        Book a trial session with caterers to taste their food
                    </p>
                    <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        Browse Caterers
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {trials.map((trial) => (
                        <div
                            key={trial.id}
                            className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">
                                        {trial.catererName}
                                    </h3>
                                    <span className="inline-block px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
                                        {trial.cuisine}
                                    </span>
                                </div>
                                <span
                                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                        trial.status
                                    )}`}
                                >
                                    {trial.status.charAt(0).toUpperCase() + trial.status.slice(1)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar size={16} />
                                    <span>{new Date(trial.date).toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock size={16} />
                                    <span>{trial.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin size={16} />
                                    <span>{trial.location}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                                    View Details
                                </button>
                                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium">
                                    Reschedule
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientTrials;
