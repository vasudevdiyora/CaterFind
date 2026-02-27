import React, { useState, useEffect } from 'react';
import { Search, Eye, XCircle, MapPin, Calendar, MessageSquare } from 'lucide-react';

const AdminClients = () => {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        // TODO: Fetch from API
        setClients([
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+91 9876543210',
                location: 'Mumbai, Maharashtra',
                joinedDate: '2024-02-15',
                totalTrials: 5,
                activeConversations: 2,
                lastActive: '2024-02-27'
            },
            {
                id: 2,
                name: 'Priya Sharma',
                email: 'priya@example.com',
                phone: '+91 9876543211',
                location: 'Delhi, NCR',
                joinedDate: '2024-01-20',
                totalTrials: 8,
                activeConversations: 3,
                lastActive: '2024-02-26'
            },
            {
                id: 3,
                name: 'Rahul Verma',
                email: 'rahul@example.com',
                phone: '+91 9876543212',
                location: 'Bangalore, Karnataka',
                joinedDate: '2023-12-10',
                totalTrials: 12,
                activeConversations: 1,
                lastActive: '2024-02-25'
            },
            {
                id: 4,
                name: 'Anita Desai',
                email: 'anita@example.com',
                phone: '+91 9876543213',
                location: 'Pune, Maharashtra',
                joinedDate: '2024-02-01',
                totalTrials: 3,
                activeConversations: 4,
                lastActive: '2024-02-27'
            },
        ]);
    }, []);

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Clients Management</h1>
                <p className="text-muted-foreground mt-1">Manage and monitor all clients on the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-foreground">
                        {clients.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Clients</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-500">
                        {clients.filter(c => {
                            const lastActive = new Date(c.lastActive);
                            const today = new Date();
                            const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
                            return diffDays <= 7;
                        }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active (Last 7 days)</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-500">
                        {clients.reduce((sum, c) => sum + c.totalTrials, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Trials Booked</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-500">
                        {clients.reduce((sum, c) => sum + c.activeConversations, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Conversations</div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary border-b border-border">
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
                        <tbody className="divide-y divide-border">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-secondary/50">
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
                                                <Calendar size={14} className="text-blue-500" />
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
                                            {new Date(client.lastActive).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => setSelectedClient(client)}
                                            className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"
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
            {selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">Client Details</h2>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
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
                                <p className="text-foreground">{new Date(selectedClient.joinedDate).toLocaleDateString()}</p>
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
                                <p className="text-foreground">{new Date(selectedClient.lastActive).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClients;
