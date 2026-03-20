import React, { useState, useEffect } from 'react';
import { 
    Search, CheckCircle, XCircle, Eye, MapPin, Star 
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminCaterers = () => {
    const [caterers, setCaterers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCaterer, setSelectedCaterer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadCaterers = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await adminAPI.getCaterers('all');
                if (!isMounted) return;
                setCaterers(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load caterers');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadCaterers();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleStatusChange = async (catererId, newStatus) => {
        setUpdatingId(catererId);
        setError('');
        try {
            await adminAPI.updateCatererStatus(catererId, newStatus);
            setCaterers(prev => prev.map(c => 
                c.id === catererId ? { ...c, status: newStatus } : c
            ));
            setSelectedCaterer(prev => prev && prev.id === catererId ? { ...prev, status: newStatus } : prev);
        } catch (err) {
            setError(err.message || 'Failed to update caterer status');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredCaterers = caterers.filter(caterer => {
        const matchesSearch = caterer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            caterer.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            caterer.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || caterer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-500/10 text-green-500 border-green-500/20',
            pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        return styles[status] || styles.pending;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Caterers Management</h1>
                <p className="text-muted-foreground mt-1">Manage and monitor all caterers on the platform</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
                    Loading caterers...
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-foreground">
                        {caterers.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Caterers</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-500">
                        {caterers.filter(c => c.status === 'active').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-500">
                        {caterers.filter(c => c.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Approval</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-500">
                        {caterers.filter(c => c.status === 'suspended').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Suspended</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search caterers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Caterers Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary border-b border-border">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Business
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredCaterers.map((caterer) => (
                                <tr key={caterer.id} className="hover:bg-secondary/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-foreground">
                                                {caterer.businessName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {caterer.ownerName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{caterer.email}</div>
                                        <div className="text-xs text-muted-foreground">{caterer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1 text-sm text-foreground">
                                            <MapPin size={14} />
                                            {caterer.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm text-foreground">
                                                {caterer.rating > 0 ? caterer.rating.toFixed(1) : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {caterer.totalOrders} orders
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(caterer.status)}`}>
                                            {caterer.status.charAt(0).toUpperCase() + caterer.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {caterer.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(caterer.id, 'active')}
                                                        disabled={updatingId === caterer.id}
                                                        className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(caterer.id, 'suspended')}
                                                        disabled={updatingId === caterer.id}
                                                        className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {caterer.status === 'active' && (
                                                <button
                                                    onClick={() => handleStatusChange(caterer.id, 'suspended')}
                                                    disabled={updatingId === caterer.id}
                                                    className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                                    title="Suspend"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                            {caterer.status === 'suspended' && (
                                                <button
                                                    onClick={() => handleStatusChange(caterer.id, 'active')}
                                                    disabled={updatingId === caterer.id}
                                                    className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                                    title="Activate"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedCaterer(caterer)}
                                                className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCaterers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No caterers found
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedCaterer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">Caterer Details</h2>
                            <button
                                onClick={() => setSelectedCaterer(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                                <p className="text-foreground">{selectedCaterer.businessName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                                <p className="text-foreground">{selectedCaterer.ownerName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="text-foreground">{selectedCaterer.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                <p className="text-foreground">{selectedCaterer.phone}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Location</label>
                                <p className="text-foreground">{selectedCaterer.location}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Specialties</label>
                                <div className="flex gap-2 mt-1">
                                    {(selectedCaterer.specialties || []).map((spec, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                            {spec}
                                        </span>
                                    ))}
                                    {(!selectedCaterer.specialties || selectedCaterer.specialties.length === 0) && (
                                        <span className="text-sm text-muted-foreground">No specialties added</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                                <p className="text-foreground">{new Date(selectedCaterer.joinedDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(selectedCaterer.status)}`}>
                                    {selectedCaterer.status.charAt(0).toUpperCase() + selectedCaterer.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCaterers;
