import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    MapPin,
    LocateFixed,
    Star,
    SlidersHorizontal,
    Heart,
    ArrowUpDown,
    Scale,
    X,
} from 'lucide-react';
import { profileAPI, fileAPI, discoveryAPI } from '../services/api';

const ClientHome = ({ user }) => {
    const [caterers, setCaterers] = useState([]);
    const [allCaterers, setAllCaterers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [locatingPosition, setLocatingPosition] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedArea, setSelectedArea] = useState('all');
    const [minRating, setMinRating] = useState(0);
    const [minServiceRadius, setMinServiceRadius] = useState(0);
    const [sortBy, setSortBy] = useState('relevance');

    const [shortlistOnly, setShortlistOnly] = useState(false);
    const [shortlistedIds, setShortlistedIds] = useState([]);

    const [compareIds, setCompareIds] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const [currentLocation, setCurrentLocation] = useState('Delhi NCR');
    const [clientCoordinates, setClientCoordinates] = useState({ lat: null, lng: null });
    const initialSearchDone = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadCaterers();
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [
        user?.userId,
        searchTerm,
        selectedCity,
        selectedArea,
        minRating,
        minServiceRadius,
        sortBy,
        clientCoordinates.lat,
        clientCoordinates.lng,
    ]);

    // Restore saved client location (if any)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('clientLocation');
            if (saved) setCurrentLocation(saved);

            const savedCoords = localStorage.getItem('clientCoordinates');
            if (savedCoords) {
                const parsed = JSON.parse(savedCoords);
                if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
                    setClientCoordinates({ lat: parsed.lat, lng: parsed.lng });
                }
            }
        } catch (e) {
            // ignore localStorage errors
        }
    }, []);

    useEffect(() => {
        const loadShortlist = async () => {
            if (!user?.userId) {
                setShortlistedIds([]);
                return;
            }

            try {
                const data = await discoveryAPI.getShortlist();
                setShortlistedIds(Array.isArray(data?.ids) ? data.ids : []);
            } catch (e) {
                setShortlistedIds([]);
            }
        };

        loadShortlist();
    }, [user?.userId]);

    const loadFilterOptions = async () => {
        try {
            const data = await profileAPI.getAll();
            setAllCaterers(Array.isArray(data) ? data : []);
        } catch (error) {
            setAllCaterers([]);
        }
    };

    const loadCaterers = async () => {
        if (!initialSearchDone.current) {
            setLoading(true);
        } else {
            setSearching(true);
        }
        setSearchError('');

        try {
            const data = await discoveryAPI.searchCaterers({
                q: searchTerm,
                city: selectedCity,
                area: selectedArea,
                minRating,
                minServiceRadius,
                lat: clientCoordinates.lat,
                lng: clientCoordinates.lng,
                sortBy,
            });

            setCaterers(Array.isArray(data) ? data : []);

            if (!allCaterers.length && Array.isArray(data)) {
                setAllCaterers(data);
            }
        } catch (error) {
            setSearchError('Failed to load discovery results. Showing fallback list.');

            try {
                const fallback = await profileAPI.getAll();
                setCaterers(Array.isArray(fallback) ? fallback : []);
            } catch (fallbackError) {
                setCaterers([]);
            }
        } finally {
            setLoading(false);
            setSearching(false);
            initialSearchDone.current = true;
        }
    };

    const getCatererId = (caterer) => caterer.userId ?? caterer.id;

    const cityOptions = useMemo(() => {
        return [...new Set(allCaterers.map(c => (c.city || '').trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b));
    }, [allCaterers]);

    const areaOptions = useMemo(() => {
        return [...new Set(
            allCaterers
                .filter(c => selectedCity === 'all' || (c.city || '').toLowerCase() === selectedCity.toLowerCase())
                .map(c => (c.area || '').trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));
    }, [allCaterers, selectedCity]);

    const shortlistedSet = useMemo(() => new Set(shortlistedIds), [shortlistedIds]);

    const filteredCaterers = useMemo(() => {
        if (!shortlistOnly) {
            return caterers;
        }

        return caterers.filter((caterer) => {
            const catererId = getCatererId(caterer);
            return shortlistedSet.has(catererId) || caterer.isShortlisted;
        });
    }, [caterers, shortlistOnly, shortlistedSet]);

    const compareCaterers = useMemo(() => {
        const ids = new Set(compareIds);
        return caterers.filter(c => ids.has(getCatererId(c)));
    }, [caterers, compareIds]);

    const toggleShortlist = async (catererId) => {
        if (!user?.userId) {
            alert('Please login as a client to manage shortlist.');
            return;
        }

        const isAlreadyShortlisted = shortlistedIds.includes(catererId);

        try {
            const data = isAlreadyShortlisted
                ? await discoveryAPI.removeFromShortlist(catererId)
                : await discoveryAPI.addToShortlist(catererId);

            const nextIds = Array.isArray(data?.shortlistedIds) ? data.shortlistedIds : [];
            const nextSet = new Set(nextIds);

            setShortlistedIds(nextIds);

            setCaterers((prev) => prev.map((item) => {
                const itemId = getCatererId(item);
                return { ...item, isShortlisted: nextSet.has(itemId) };
            }));
        } catch (error) {
            alert(error.message || 'Failed to update shortlist');
        }
    };

    const toggleCompare = (catererId) => {
        setCompareIds((prev) => {
            if (prev.includes(catererId)) {
                return prev.filter(id => id !== catererId);
            }
            if (prev.length >= 3) {
                alert('You can compare up to 3 caterers at a time.');
                return prev;
            }
            return [...prev, catererId];
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCity('all');
        setSelectedArea('all');
        setMinRating(0);
        setMinServiceRadius(0);
        setSortBy('relevance');
        setShortlistOnly(false);
    };

    const handleChangeLocation = () => {
        const newLoc = window.prompt('Enter preferred location (e.g. Delhi NCR)', currentLocation || '');
        if (newLoc && newLoc.trim()) {
            const loc = newLoc.trim();
            setCurrentLocation(loc);
            try {
                localStorage.setItem('clientLocation', loc);
            } catch (e) {
                // ignore localStorage errors
            }
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported in this browser.');
            return;
        }

        setLocatingPosition(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                setClientCoordinates(nextCoords);
                setCurrentLocation('Current location');

                if (sortBy === 'relevance') {
                    setSortBy('distance');
                }

                try {
                    localStorage.setItem('clientLocation', 'Current location');
                    localStorage.setItem('clientCoordinates', JSON.stringify(nextCoords));
                } catch (e) {
                    // ignore localStorage errors
                }

                setLocatingPosition(false);
            },
            (error) => {
                setLocatingPosition(false);
                alert(error.message || 'Unable to fetch your current location.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    };

    const clearCurrentCoordinates = () => {
        setClientCoordinates({ lat: null, lng: null });
        try {
            localStorage.removeItem('clientCoordinates');
        } catch (e) {
            // ignore localStorage errors
        }
    };

    const handleCatererClick = (caterer) => {
        const catererId = getCatererId(caterer);
        navigate(`/client/caterer/${catererId}`);
    };

    return (
        <div className="pb-4">
            {/* Header / Search Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-yellow-500 mb-4">
                    <MapPin size={18} />
                    <span>
                        {currentLocation}{' '}
                        <span className="text-orange-400 cursor-pointer" onClick={handleChangeLocation}>
                            Change
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-card border border-border text-foreground hover:bg-secondary"
                        disabled={locatingPosition}
                    >
                        <LocateFixed size={12} />
                        {locatingPosition ? 'Locating...' : 'Use current location'}
                    </button>
                    {(typeof clientCoordinates.lat === 'number' && typeof clientCoordinates.lng === 'number') && (
                        <button
                            type="button"
                            onClick={clearCurrentCoordinates}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-card border border-border text-muted-foreground hover:bg-secondary"
                        >
                            Clear nearby
                        </button>
                    )}
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, city, area or keyword..."
                        className="w-full bg-input border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-foreground font-semibold mb-4">
                        <SlidersHorizontal size={16} />
                        Advanced Filters
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <select
                            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                            value={selectedCity}
                            onChange={(e) => {
                                setSelectedCity(e.target.value);
                                setSelectedArea('all');
                            }}
                        >
                            <option value="all">All cities</option>
                            {cityOptions.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>

                        <select
                            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                        >
                            <option value="all">All areas</option>
                            {areaOptions.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>

                        <select
                            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                            value={minRating}
                            onChange={(e) => setMinRating(Number(e.target.value))}
                        >
                            <option value={0}>Any rating</option>
                            <option value={3}>3.0+ rating</option>
                            <option value={4}>4.0+ rating</option>
                            <option value={4.5}>4.5+ rating</option>
                        </select>

                        <select
                            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                            value={minServiceRadius}
                            onChange={(e) => setMinServiceRadius(Number(e.target.value))}
                        >
                            <option value={0}>Any service radius</option>
                            <option value={5}>5+ km radius</option>
                            <option value={10}>10+ km radius</option>
                            <option value={20}>20+ km radius</option>
                            <option value={30}>30+ km radius</option>
                        </select>

                        <button
                            type="button"
                            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary/80"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-muted-foreground" />
                        <select
                            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="relevance">Sort: Relevance</option>
                            <option value="rating_high">Sort: Rating high to low</option>
                            <option value="rating_low">Sort: Rating low to high</option>
                            <option value="name_asc">Sort: Name A-Z</option>
                            <option value="name_desc">Sort: Name Z-A</option>
                            <option value="distance">Sort: Distance (nearest first)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                            shortlistOnly
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
                        }`}
                        onClick={() => setShortlistOnly(prev => !prev)}
                    >
                        <Heart size={14} fill={shortlistOnly ? 'currentColor' : 'none'} />
                        Shortlist only
                    </button>

                    <button
                        type="button"
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                            compareIds.length > 0
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
                        }`}
                        onClick={() => setShowCompareModal(true)}
                        disabled={compareIds.length < 2}
                    >
                        <Scale size={14} />
                        Compare ({compareIds.length}/3)
                    </button>

                    <span className="text-sm text-muted-foreground">{filteredCaterers.length} caterers found</span>
                    {searching && <span className="text-xs text-muted-foreground">Updating...</span>}
                    {searchError && <span className="text-xs text-destructive">{searchError}</span>}
                </div>
            </div>

            {/* Caterer Grid */}
            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading caterers...</div>
            ) : filteredCaterers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    No caterers match your current filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                    {filteredCaterers.map((caterer) => {
                        const catererId = getCatererId(caterer);
                        const isShortlisted = shortlistedSet.has(catererId) || caterer.isShortlisted;
                        const isInCompare = compareIds.includes(catererId);
                        const distanceKm = typeof caterer.distanceKm === 'number' ? caterer.distanceKm : null;

                        return (
                            <div
                                key={catererId}
                                onClick={() => handleCatererClick(caterer)}
                                className="bg-card border border-border rounded-xl overflow-hidden hover:transform hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 shadow-lg cursor-pointer"
                            >
                                <div className="h-48 bg-secondary relative">
                                    <img
                                        src={
                                            caterer.imageUrl
                                                ? fileAPI.getImageUrl(caterer.imageUrl)
                                                : 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80'
                                        }
                                        alt={caterer.businessName}
                                        className="w-full h-full object-cover"
                                    />

                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleShortlist(catererId);
                                            }}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                                isShortlisted
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-black/50 text-white hover:bg-black/70'
                                            }`}
                                            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                                        >
                                            <Heart size={16} fill={isShortlisted ? 'currentColor' : 'none'} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCompare(catererId);
                                            }}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                                isInCompare
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-black/50 text-white hover:bg-black/70'
                                            }`}
                                            title={isInCompare ? 'Remove from compare' : 'Add to compare'}
                                        >
                                            <Scale size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-foreground">{caterer.businessName}</h3>
                                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md">
                                            <Star size={14} fill="currentColor" />
                                            <span className="font-bold text-sm">{caterer.rating || 'New'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                                        <MapPin size={14} />
                                        <span>
                                            {[caterer.area, caterer.city].filter(Boolean).join(', ') || 'Location not specified'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded border border-border">
                                            Radius: {caterer.serviceRadius || 0} km
                                        </span>
                                        {distanceKm !== null && (
                                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded border border-border">
                                                Distance: {distanceKm.toFixed(1)} km
                                            </span>
                                        )}
                                        {isShortlisted && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/30">
                                                Shortlisted
                                            </span>
                                        )}
                                        {isInCompare && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/30">
                                                Compare
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Compare Modal */}
            {showCompareModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-5xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="text-lg font-bold text-foreground">Compare Caterers</h3>
                            <button
                                type="button"
                                onClick={() => setShowCompareModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 overflow-x-auto">
                            {compareCaterers.length < 2 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Select at least 2 caterers to compare.
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 pr-4 text-muted-foreground">Field</th>
                                            {compareCaterers.map(c => (
                                                <th
                                                    key={getCatererId(c)}
                                                    className="text-left py-2 pr-4 text-foreground min-w-[180px]"
                                                >
                                                    {c.businessName}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-border/60">
                                            <td className="py-2 pr-4 text-muted-foreground">Rating</td>
                                            {compareCaterers.map(c => (
                                                <td key={`rating-${getCatererId(c)}`} className="py-2 pr-4">
                                                    {c.rating || 'New'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-border/60">
                                            <td className="py-2 pr-4 text-muted-foreground">City</td>
                                            {compareCaterers.map(c => (
                                                <td key={`city-${getCatererId(c)}`} className="py-2 pr-4">
                                                    {c.city || 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-border/60">
                                            <td className="py-2 pr-4 text-muted-foreground">Area</td>
                                            {compareCaterers.map(c => (
                                                <td key={`area-${getCatererId(c)}`} className="py-2 pr-4">
                                                    {c.area || 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-border/60">
                                            <td className="py-2 pr-4 text-muted-foreground">Service Radius</td>
                                            {compareCaterers.map(c => (
                                                <td key={`radius-${getCatererId(c)}`} className="py-2 pr-4">
                                                    {c.serviceRadius || 0} km
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="py-2 pr-4 text-muted-foreground">Description</td>
                                            {compareCaterers.map(c => (
                                                <td key={`desc-${getCatererId(c)}`} className="py-2 pr-4">
                                                    {(c.description || 'N/A').slice(0, 120)}
                                                    {(c.description || '').length > 120 ? '...' : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setCompareIds([])}
                                className="px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
                            >
                                Clear compare list
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCompareModal(false)}
                                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientHome;
