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
    Utensils,
    Building,
    Sparkles,
    Award,
    Compass
} from 'lucide-react';
import { profileAPI, discoveryAPI, fileAPI } from '../services/api';
import '../styles/Table.css'; // For buttons, modals
import '../styles/Contacts.css'; // For filter pills
import Modal from '../components/Modal';

const CATERER_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23e0f2fe"/><stop offset="100%" stop-color="%23f8fafc"/></linearGradient></defs><rect width="800" height="500" fill="url(%23g)"/><circle cx="140" cy="110" r="54" fill="%23bae6fd"/><circle cx="710" cy="420" r="82" fill="%23e2e8f0"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%230f172a" font-family="Arial,sans-serif" font-size="34" font-weight="700">CaterFind</text><text x="50%" y="61%" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="Arial,sans-serif" font-size="18">Caterer Profile Image</text></svg>';

const ClientHome = ({ user }) => {
    const [caterers, setCaterers] = useState([]);
    const [allCaterers, setAllCaterers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [locationNotice, setLocationNotice] = useState('');
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

            // Update caterer list in-place for instant UI feedback
            setCaterers(prev => prev.map(c => {
                if (getCatererId(c) === catererId) {
                    return { ...c, isShortlisted: nextSet.has(catererId) };
                }
                return c;
            }));
        } catch (e) {
            alert('Failed to update shortlist.');
        }
    };

    const toggleCompare = (catererId) => {
        setCompareIds(prev => {
            const next = new Set(prev);
            if (next.has(catererId)) {
                next.delete(catererId);
            } else {
                if (next.size < 4) {
                    next.add(catererId);
                } else {
                    alert('You can compare up to 4 caterers at a time.');
                }
            }
            return [...next];
        });
    };

    const handleLocateMe = () => {
        setLocationNotice('');
        if (!navigator.geolocation) {
            setLocationNotice('Geolocation is not supported by this browser.');
            return;
        }
        setLocatingPosition(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setClientCoordinates({ lat: latitude, lng: longitude });
                setCurrentLocation('Your Current Location');
                localStorage.setItem('clientLocation', 'Your Current Location');
                localStorage.setItem('clientCoordinates', JSON.stringify({ lat: latitude, lng: longitude }));
                setLocationNotice('Location updated. Showing nearby caterers.');
                setLocatingPosition(false);
            },
            (error) => {
                if (error?.code === error.PERMISSION_DENIED) {
                    setLocationNotice('Location permission denied. Please allow location access.');
                } else if (error?.code === error.TIMEOUT) {
                    setLocationNotice('Location request timed out. Please try again.');
                } else {
                    setLocationNotice('Unable to retrieve your location right now.');
                }
                setLocatingPosition(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCity('all');
        setSelectedArea('all');
        setMinRating(0);
        setMinServiceRadius(0);
        setSortBy('relevance');
        setShortlistOnly(false);
        setCompareIds([]);
        setSearchError('');
    };

    const getCatererImage = (caterer) => {
        const candidate =
            caterer.imageUrl ||
            caterer.profileImageUrl ||
            caterer.profileImage ||
            caterer.logoUrl ||
            caterer.businessImageUrl ||
            caterer.coverImageUrl ||
            '';

        const resolved = fileAPI.getImageUrl(candidate);
        return resolved || CATERER_FALLBACK_IMAGE;
    };

    const renderCatererCard = (caterer, index) => {
        const catererId = getCatererId(caterer);
        const isShortlisted = shortlistedSet.has(catererId);
        const isComparing = compareIds.includes(catererId);

        return (
            <div key={catererId || index} className="surface-card overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-0.5 duration-300">
                <div className="relative">
                    <img
                        src={getCatererImage(caterer)}
                        alt={caterer.businessName}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = CATERER_FALLBACK_IMAGE;
                        }}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button
                            onClick={() => toggleShortlist(catererId)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                                isShortlisted ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white'
                            }`}
                        >
                            <Heart size={16} fill={isShortlisted ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/55 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        <span>{caterer.averageRating?.toFixed(1) || 'New'}</span>
                    </div>
                </div>
                <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-slate-800 text-lg truncate">{caterer.businessName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                        <MapPin size={12} /> {caterer.area}, {caterer.city}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2 flex-grow">{caterer.description}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                        <button
                            onClick={() => toggleCompare(catererId)}
                            className={`text-sm font-semibold flex items-center gap-2 transition-colors ${
                                isComparing ? 'text-sky-600' : 'text-slate-500 hover:text-sky-500'
                            }`}
                        >
                            <Scale size={14} /> {isComparing ? 'Comparing' : 'Compare'}
                        </button>
                        <button
                            onClick={() => navigate(`/client/caterer/${catererId}`)}
                            className="primary-button-sm"
                        >
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderFilters = () => (
        <div className="p-4 pb-8 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900"><SlidersHorizontal size={18} className="text-sky-600" /> Filters</h3>
            <div className="form-group">
                <label>City</label>
                <select className="form-select border-slate-200 focus:border-sky-500 focus:ring-sky-500" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                    <option value="all">All Cities</option>
                    {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>Area</label>
                <select className="form-select border-slate-200 focus:border-sky-500 focus:ring-sky-500" value={selectedArea} onChange={e => setSelectedArea(e.target.value)} disabled={selectedCity === 'all'}>
                    <option value="all">All Areas</option>
                    {areaOptions.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>Minimum Rating</label>
                <div className="flex items-center justify-between">
                    {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => setMinRating(r)} className={`flex items-center gap-1 text-sm ${minRating >= r ? 'text-sky-500 font-bold' : 'text-slate-500'}`}>
                            {r} <Star size={14} fill={minRating >= r ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="form-group">
                <label>Service Radius ({minServiceRadius} km)</label>
                <input type="range" min="0" max="100" step="5" value={minServiceRadius} onChange={e => setMinServiceRadius(e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="form-group">
                <label>Sort By</label>
                <select className="form-select border-slate-200 focus:border-sky-500 focus:ring-sky-500" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating</option>
                    <option value="distance">Distance</option>
                </select>
            </div>

            <button
                type="button"
                onClick={handleClearFilters}
                className="w-full secondary-button"
            >
                Clear Filters
            </button>

            <div className="pt-4 border-t border-slate-200">
                <div className={`label-checkbox !w-full ${shortlistOnly ? 'selected' : ''}`} onClick={() => setShortlistOnly(!shortlistOnly)}>
                    <Heart size={16} className="mr-2" /> Show My Shortlist Only
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-shell py-8 pb-32">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Find the Perfect Caterer</h1>
                <p className="text-lg text-slate-500">Discover top-rated caterers for your next event in <span className="font-semibold text-sky-600">{currentLocation}</span>.</p>
            </header>

            {/* Search and Location Bar */}
            <div className="max-w-3xl mx-auto mb-8 p-2 bg-white rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, cuisine, or specialty..."
                        className="w-full bg-transparent pl-11 pr-4 py-3 rounded-full focus:outline-none text-slate-800"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={handleLocateMe} className="secondary-button rounded-full !px-4">
                    {locatingPosition ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <LocateFixed size={20} />}
                </button>
            </div>

            {locationNotice && (
                <div className="max-w-3xl mx-auto mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    {locationNotice}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <aside className="lg:col-span-1 lg:self-start">
                    <div className="surface-card lg:sticky lg:top-4 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
                        {renderFilters()}
                    </div>
                </aside>

                {/* Caterer Grid */}
                <main className="lg:col-span-3">
                    {loading ? (
                        <div className="dense-grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                                <div key={skeleton} className="surface-card overflow-hidden animate-pulse">
                                    <div className="h-40 bg-slate-100" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-5 w-2/3 rounded bg-slate-100" />
                                        <div className="h-4 w-1/2 rounded bg-slate-100" />
                                        <div className="h-4 w-full rounded bg-slate-100" />
                                        <div className="h-4 w-5/6 rounded bg-slate-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchError ? (
                        <div className="surface-card p-8 text-center text-red-600">{searchError}</div>
                    ) : filteredCaterers.length === 0 ? (
                        <div className="surface-card p-8 text-center text-slate-500">
                            <h3 className="font-bold text-xl mb-2">No Caterers Found</h3>
                            <p>Try adjusting your search or filter criteria.</p>
                        </div>
                    ) : (
                        <div className="dense-grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCaterers.map((caterer, index) => renderCatererCard(caterer, index))}
                        </div>
                    )}
                </main>
            </div>

            {/* Compare Bar */}
            {compareIds.length > 0 && (
                <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-3 md:px-0">
                    <div className="bg-slate-800 text-white rounded-lg shadow-2xl p-4 flex items-center justify-between">
                        <p className="font-semibold">{compareIds.length} caterer(s) selected</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCompareIds([])} className="text-sm text-slate-300 hover:text-white">Clear</button>
                            <button onClick={() => setShowCompareModal(true)} className="primary-button-sm">Compare</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compare Modal */}
            <Modal isOpen={showCompareModal} onClose={() => setShowCompareModal(false)} title={'Compare Caterers'} className={'!max-w-5xl'}>
                <div className="p-4 overflow-x-auto">
                    <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 border-b border-slate-200 text-left">Feature</th>
                                        {compareCaterers.map(c => (
                                            <th key={getCatererId(c)} className="p-2 border-b border-slate-200 text-center">
                                                {c.businessName}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {([
                                        { label: 'Rating', icon: <Star size={14} />, key: 'averageRating', format: (v) => v?.toFixed(1) || 'N/A' },
                                        { label: 'City', icon: <Building size={14} />, key: 'city' },
                                        { label: 'Area', icon: <MapPin size={14} />, key: 'area' },
                                        { label: 'Service Radius', icon: <Compass size={14} />, key: 'serviceRadius', format: (v) => `${v} km` },
                                    ]).map(feature => (
                                        <tr key={feature.key}>
                                            <td className="p-2 border-b border-slate-100 font-semibold flex items-center gap-2">{feature.icon} {feature.label}</td>
                                            {compareCaterers.map(c => (
                                                <td key={getCatererId(c)} className="p-2 border-b border-slate-100 text-center">
                                                    {feature.format ? feature.format(c[feature.key]) : c[feature.key] || 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};

export default ClientHome;
