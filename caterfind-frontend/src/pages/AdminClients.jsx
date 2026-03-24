import React, { useState, useEffect } from 'react';
import { Search, Eye, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';

const AdminClients = () => {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadClients = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await adminAPI.getClients();
                if (!isMounted) return;
                setClients(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load clients');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadClients();

        return () => {
            isMounted = false;
        };
    }, []);

    const toDate = (value) => {
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? date : null;
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Clients Management</h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">Manage and monitor all clients on the platform</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-500 shadow-sm">
                    Loading clients...
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-foreground">
                        {clients.length}
                    </div>
                    <div className="text-sm text-slate-600">Total Clients</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-green-500">
                        {clients.filter(c => {
                            const lastActive = toDate(c.lastActive);
                            if (!lastActive) return false;
                            const today = new Date();
                            const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
                            return diffDays <= 7;
                        }).length}
                    </div>
                    <div className="text-sm text-slate-600">Active (Last 7 days)</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-sky-600">
                        {clients.reduce((sum, c) => sum + c.totalTrials, 0)}
                    </div>
                    <div className="text-sm text-slate-600">Total Trials Booked</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">
                        {clients.reduce((sum, c) => sum + c.activeConversations, 0)}
                    </div>
                    <div className="text-sm text-slate-600">Active Conversations</div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                    />
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
                        No clients found
                    </div>
                )}

                {filteredClients.map((client, index) => (
                    <div key={client.id || index} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-base font-semibold text-slate-900">{client.name}</div>
                                <div className="text-sm text-slate-600">{client.email}</div>
                                <div className="text-sm text-slate-600">{client.phone}</div>
                            </div>
                            <button
                                onClick={() => setSelectedClient(client)}
                                className="primary-button"
                                title="View Details"
                            >
                                <Eye size={16} className="mr-2" />
                                Details
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-slate-500">Location</div>
                                <div className="text-slate-800 inline-flex items-center gap-1"><MapPin size={14} className="text-slate-400" />{client.location}</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Last Active</div>
                                <div className="text-slate-800">{toDate(client.lastActive)?.toLocaleDateString() || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Trials</div>
                                <div className="text-slate-800 inline-flex items-center gap-1"><Calendar size={14} className="text-sky-500" />{client.totalTrials}</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Conversations</div>
                                <div className="text-slate-800 inline-flex items-center gap-1"><MessageSquare size={14} className="text-emerald-500" />{client.activeConversations}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Clients Table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Activity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredClients.map((client, index) => (
                                <tr key={client.id || index} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-foreground">
                                            {client.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{client.email}</div>
                                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1 text-sm text-foreground">
                                            <MapPin size={14} />
                                            {client.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} className="text-sky-500" />
                                                <span className="text-sm text-foreground">{client.totalTrials}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare size={14} className="text-green-500" />
                                                <span className="text-sm text-foreground">{client.activeConversations}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">
                                            {toDate(client.lastActive)?.toLocaleDateString() || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => setSelectedClient(client)}
                                            className="p-1 text-sky-500 hover:bg-sky-500/10 rounded"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No clients found
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                title={<h2 className="text-xl font-bold text-foreground">Client Details</h2>}
                className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
                {selectedClient && (
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-foreground">{selectedClient.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-foreground">{selectedClient.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-foreground">{selectedClient.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Location</label>
                            <p className="text-foreground">{selectedClient.location}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                            <p className="text-foreground">{toDate(selectedClient.joinedDate)?.toLocaleDateString() || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Total Trials</label>
                            <p className="text-foreground">{selectedClient.totalTrials}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Active Conversations</label>
                            <p className="text-foreground">{selectedClient.activeConversations}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                            <p className="text-foreground">{toDate(selectedClient.lastActive)?.toLocaleDateString() || 'N/A'}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminClients;
