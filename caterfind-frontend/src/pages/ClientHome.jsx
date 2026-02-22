import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter } from 'lucide-react';
import { profileAPI, fileAPI } from '../services/api';

const ClientHome = ({ user }) => {
    const [caterers, setCaterers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All'); // All, Veg, Non-Veg - Mock filter for now
    const navigate = useNavigate();

    useEffect(() => {
        loadCaterers();
    }, []);

    const loadCaterers = async () => {
        try {
            const data = await profileAPI.getAll();
            setCaterers(data);
        } catch (error) {
            // Error loading caterers
        } finally {
            setLoading(false);
        }
    };

    const filteredCaterers = caterers.filter(caterer =>
        caterer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caterer.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCatererClick = (caterer) => {
        const catererId = caterer.userId ?? caterer.id;
        navigate(`/client/caterer/${catererId}`);
    };

    return (
        <div className="p-6 bg-[#1a1a1a] min-h-screen text-white">
            {/* Header / Search Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-yellow-500 mb-4">
                    <MapPin size={18} />
                    <span>Delhi NCR <span className="text-orange-400 cursor-pointer">Change</span></span>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search caterers..."
                        className="w-full bg-[#2a2a2a] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    {['All', 'Veg Only', 'Non-Veg'].map(f => (
                        <button
                            key={f}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${filter === f ? 'bg-orange-500 text-black font-medium' : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'All' && <Filter size={14} />}
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Caterer Grid */}
            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading caterers...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCaterers.map(caterer => (
                        <div
                            key={caterer.id}
                            onClick={() => handleCatererClick(caterer)}
                            className="bg-[#2a2a2a] rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-lg cursor-pointer"
                        >
                            <div className="h-48 bg-gray-700 relative">
                                <img
                                    src={caterer.imageUrl ? fileAPI.getImageUrl(caterer.imageUrl) : "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"}
                                    alt={caterer.businessName}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">Veg</span>
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">Non-Veg</span>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-white">{caterer.businessName}</h3>
                                    <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md">
                                        <Star size={14} fill="currentColor" />
                                        <span className="font-bold text-sm">{caterer.rating || 'New'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
                                    <MapPin size={14} />
                                    <span>{caterer.area || caterer.city}, {caterer.city}</span>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {['Punjabi', 'Mughlai', 'Tandoor'].map(tag => (
                                        <span key={tag} className="text-xs bg-[#333] text-gray-300 px-2 py-1 rounded border border-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientHome;
