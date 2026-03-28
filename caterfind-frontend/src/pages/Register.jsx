import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authAPI, fileAPI } from '../services/api';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft,
    User, Phone, Building, MapPin, Hash, ChefHat, Home, LocateFixed
} from 'lucide-react';
import logo from '@/assets/logo.png';
import Select from '../components/Select';
import { states, getCities } from '../lib/locations';
import { formatPhoneForInput } from '../lib/utils';
import '../styles/Login.css'; // Reusing login styles for consistency

const DEFAULT_MAP_CENTER = [22.9734, 78.6569];

const registerLocationIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapCenterUpdater({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, Math.max(map.getZoom(), 14));
        }
    }, [map, position]);

    return null;
}

function LocationSelectorMarker({ position, onPositionSelect }) {
    useMapEvents({
        click(event) {
            const { lat, lng } = event.latlng;
            onPositionSelect(lat, lng);
        }
    });

    if (!position) return null;

    return (
        <Marker
            position={position}
            icon={registerLocationIcon}
            draggable
            eventHandlers={{
                dragend: (event) => {
                    const { lat, lng } = event.target.getLatLng();
                    onPositionSelect(lat, lng);
                }
            }}
        />
    );
}

const Register = ({ onLogin }) => {
    const _navigate = null;
    const location = useLocation();

    // State for form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Role-specific fields
    const [clientName, setClientName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [primaryPhone, setPrimaryPhone] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [panDocumentUrl, setPanDocumentUrl] = useState('');
    const [aadharDocumentUrl, setAadharDocumentUrl] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [area, setArea] = useState('');
    const [city, setCity] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [pincode, setPincode] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // UI State
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pincodeLoading, _setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState('');
    const [locating, setLocating] = useState(false);
    const [mapPosition, setMapPosition] = useState(null);
    const [cityLocating, setCityLocating] = useState(false);
    const [cityMapMessage, setCityMapMessage] = useState('');
    const cityLookupRequestRef = useRef(0);

    const getRoleFromQuery = () => new URLSearchParams(location.search).get('role')?.toUpperCase() || 'CLIENT';
    const [role, setRole] = useState(getRoleFromQuery());

    useEffect(() => {
        setRole(getRoleFromQuery());
    }, [location.search]);

    useEffect(() => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            setMapPosition([lat, lng]);
            return;
        }
        setMapPosition(null);
    }, [latitude, longitude]);

    const geocodeAndSetLocation = async (query, successMessage, requestId) => {
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
        const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
        const rows = response.ok ? await response.json() : [];

        if (requestId !== cityLookupRequestRef.current) return false;

        const first = Array.isArray(rows) ? rows[0] : null;
        const latValue = Number(first?.lat);
        const lngValue = Number(first?.lon);
        if (Number.isNaN(latValue) || Number.isNaN(lngValue)) {
            return false;
        }

        setLatitude(latValue.toFixed(6));
        setLongitude(lngValue.toFixed(6));
        setCityMapMessage(successMessage);
        return true;
    };

    useEffect(() => {
        if (role !== 'CATERER') return;

        const trimmedPincode = String(pincode || '').trim();
        if (trimmedPincode.length !== 6) return;

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const hasValidCoordinates = !Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        if (hasValidCoordinates) {
            setCityLocating(false);
            setCityMapMessage('');
            return;
        }

        const requestId = cityLookupRequestRef.current + 1;
        cityLookupRequestRef.current = requestId;
        setCityLocating(true);
        setCityMapMessage('Finding pincode on map...');

        geocodeAndSetLocation(`${trimmedPincode}, India`, `Map centered near pincode ${trimmedPincode}. Adjust marker for exact address.`, requestId)
            .then((ok) => {
                if (requestId !== cityLookupRequestRef.current) return;
                if (!ok) {
                    setCityMapMessage('Could not locate this pincode. Trying selected city...');
                }
            })
            .catch(() => {
                if (requestId !== cityLookupRequestRef.current) return;
                setCityMapMessage('Could not locate this pincode. Trying selected city...');
            })
            .finally(() => {
                if (requestId === cityLookupRequestRef.current) {
                    setCityLocating(false);
                }
            });
    }, [role, pincode]);

    useEffect(() => {
        if (role !== 'CATERER') return;

        const trimmedCity = String(city || '').trim();
        if (!trimmedCity) {
            setCityLocating(false);
            setCityMapMessage('');
            return;
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const hasValidCoordinates = !Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        if (hasValidCoordinates) {
            setCityLocating(false);
            setCityMapMessage('');
            return;
        }

        if (String(pincode || '').trim().length === 6) {
            // Prefer pincode as the first map hint because it is generally more precise than city.
            return;
        }

        const requestId = cityLookupRequestRef.current + 1;
        cityLookupRequestRef.current = requestId;
        setCityLocating(true);
        setCityMapMessage('Finding selected city on map...');

        const query = [trimmedCity, selectedState, 'India'].filter(Boolean).join(', ');

        geocodeAndSetLocation(query, `Map centered near ${trimmedCity}. Adjust marker for exact address.`, requestId)
            .then((ok) => {
                if (requestId !== cityLookupRequestRef.current) return;
                if (!ok) {
                    setCityMapMessage('Could not locate this city exactly. Please place marker manually.');
                }
            })
            .catch(() => {
                if (requestId !== cityLookupRequestRef.current) return;
                setCityMapMessage('Could not fetch city location right now. Please place marker manually.');
            })
            .finally(() => {
                if (requestId === cityLookupRequestRef.current) {
                    setCityLocating(false);
                }
            });
    }, [role, city, selectedState, pincode]);

    // Allow manual pincode entry — do not auto-lookup remote API
    const handlePincodeChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPincode(val);
        setPincodeError('');
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported in this browser.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toFixed(6));
                setLongitude(position.coords.longitude.toFixed(6));
                setLocating(false);
            },
            () => {
                setError('Unable to fetch your current location.');
                setLocating(false);
            }
        );
    };

    const handleMapPositionSelect = (lat, lng) => {
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) return setError('Passwords do not match.');
        if (password.length < 6) return setError('Password must be at least 6 characters.');

        const normalizedPrimaryPhone = formatPhoneForInput(primaryPhone);
        const payload = { email, password, role, pincode, state: selectedState, city, area };

        if (role === 'CATERER') {
            Object.assign(payload, {
                businessName,
                ownerName,
                primaryPhone: normalizedPrimaryPhone,
                streetAddress,
                address: `${streetAddress}, ${area}, ${city}`,
                latitude: latitude ? Number(latitude) : undefined,
                longitude: longitude ? Number(longitude) : undefined,
                aadharNumber: aadharNumber,
                panNumber,
                profileImageUrl,
                panDocumentUrl,
                aadharDocumentUrl
            });
        } else {
            Object.assign(payload, { name: clientName, phone: normalizedPrimaryPhone });
        }

        setLoading(true);
        try {
            const response = await authAPI.register(payload);
            onLogin(response);
            // App.jsx will redirect
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file, setter) => {
        if (!file) return;
        try {
            const result = await fileAPI.upload(file);
            if (result && result.url) setter(result.url);
        } catch (err) {
            setError('File upload failed: ' + (err.message || ''));
        }
    };

    const { title, subtitle } = role === 'CATERER'
        ? { title: 'Become a Partner', subtitle: 'Join our network of professional caterers' }
        : { title: 'Create an Account', subtitle: 'Start discovering amazing caterers' };

    return (
        <div className="login-container !bg-slate-50">
            <div className="login-card !max-w-4xl">
                <Link to="/" className="back-button">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="login-header">
                    <img src={logo} alt="CaterFind Logo" className="logo-icon h-12 w-12 md:h-14 md:w-14 mx-auto mb-4 object-contain" />
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 sm:p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-5">Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput id="email" label="Email Address" type="email" value={email} onChange={setEmail} icon={<Mail />} required wrapperClass="md:col-span-2" />
                                <FormInput id="password" label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} icon={<Lock />} required>
                                    <PasswordToggle visible={showPassword} setVisible={setShowPassword} />
                                </FormInput>
                                <FormInput id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={setConfirmPassword} icon={<Lock />} required>
                                    <PasswordToggle visible={showConfirmPassword} setVisible={setShowConfirmPassword} />
                                </FormInput>
                            </div>
                        </section>

                        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 sm:p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-5">{role === 'CATERER' ? 'Business Information' : 'Personal Information'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {role === 'CATERER' ? (
                                    <>
                                        <FormInput id="businessName" label="Business Name" value={businessName} onChange={setBusinessName} icon={<ChefHat />} required />
                                        <FormInput id="ownerName" label="Owner's Full Name" value={ownerName} onChange={setOwnerName} icon={<User />} required />
                                    </>
                                ) : (
                                    <FormInput id="clientName" label="Full Name" value={clientName} onChange={setClientName} icon={<User />} required />
                                )}
                                <FormInput id="primaryPhone" label="Contact Phone" type="tel" value={primaryPhone} onChange={setPrimaryPhone} icon={<Phone />} placeholder="98765 43210" required wrapperClass={role === 'CLIENT' ? 'md:col-span-1' : ''} />
                            </div>
                        </section>

                        {role === 'CATERER' && (
                            <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 sm:p-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-5">Verification Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput id="panNumber" label="PAN Number" value={panNumber} onChange={setPanNumber} icon={<Hash />} placeholder="ABCDE1234F" />
                                    <FormInput id="aadharNumber" label="Aadhaar Number" value={aadharNumber} onChange={setAadharNumber} icon={<Hash />} placeholder="1234 5678 9012" />

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">Profile Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e.target.files?.[0], setProfileImageUrl)}
                                            className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm text-slate-700 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        />
                                        {profileImageUrl && <p className="text-xs text-slate-500 mt-1">Uploaded: {profileImageUrl}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">PAN Document (optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => handleFileUpload(e.target.files?.[0], setPanDocumentUrl)}
                                            className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm text-slate-700 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Upload clear PAN copy for faster verification.</p>
                                        {panDocumentUrl && <p className="text-xs text-slate-500 mt-1">Uploaded: {panDocumentUrl}</p>}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">Aadhaar Document (optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => handleFileUpload(e.target.files?.[0], setAadharDocumentUrl)}
                                            className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-sm text-slate-700 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Ensure Aadhaar details are clearly readable.</p>
                                        {aadharDocumentUrl && <p className="text-xs text-slate-500 mt-1">Uploaded: {aadharDocumentUrl}</p>}
                                    </div>
                                </div>
                            </section>
                        )}

                        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 sm:p-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-5">Location Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput id="pincode" label="Pincode" value={pincode} onChangeRaw={handlePincodeChange} icon={<Hash />} maxLength={6} loading={pincodeLoading} error={pincodeError} />

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                                    <Select
                                        value={selectedState}
                                        onChange={e => setSelectedState(e.target.value)}
                                        options={[
                                            { value: '', label: 'Select State' },
                                            ...states.map(s => ({ value: s, label: s }))
                                        ]}
                                        placeholder="Select state"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                                    <Select
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        disabled={!selectedState}
                                        options={[
                                            { value: '', label: 'Select City' },
                                            ...getCities(selectedState).map(c => ({ value: c, label: c }))
                                        ]}
                                        placeholder="Select city"
                                    />
                                </div>

                                <FormInput id="area" label="Area / Locality" value={area} onChange={setArea} icon={<MapPin />} required />

                                {role === 'CATERER' && (
                                    <>
                                        <FormInput id="streetAddress" label="Street Address" value={streetAddress} onChange={setStreetAddress} icon={<Home />} required wrapperClass="md:col-span-2" />
                                        <FormInput id="latitude" label="Latitude" value={latitude} onChange={setLatitude} icon={<LocateFixed />} placeholder="e.g., 28.6139" />
                                        <FormInput id="longitude" label="Longitude" value={longitude} onChange={setLongitude} icon={<LocateFixed />} placeholder="e.g., 77.2090">
                                            <button type="button" onClick={handleUseCurrentLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-600 hover:underline" disabled={locating}>
                                                {locating ? 'Locating...' : 'Use Current'}
                                            </button>
                                        </FormInput>
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-slate-700 font-medium mb-2">Select on Map</p>
                                            <div className="h-80 w-full rounded-lg overflow-hidden relative border border-slate-200">
                                                <MapContainer center={mapPosition || DEFAULT_MAP_CENTER} zoom={mapPosition ? 14 : 5} scrollWheelZoom={true} className="h-full w-full">
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <MapCenterUpdater position={mapPosition} />
                                                    <LocationSelectorMarker position={mapPosition} onPositionSelect={handleMapPositionSelect} />
                                                </MapContainer>
                                                <button
                                                    type="button"
                                                    onClick={handleUseCurrentLocation}
                                                    className="absolute top-2 right-2 z-[1000] inline-flex items-center justify-center w-9 h-9 rounded-md bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50"
                                                    disabled={locating}
                                                    aria-label="Use current location"
                                                >
                                                    <LocateFixed size={16} className={locating ? 'animate-spin' : ''} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">Click anywhere on the map or drag the marker to set your business location.</p>
                                            {cityMapMessage && (
                                                <p className={`text-xs mt-1 ${cityMapMessage.startsWith('Could not') ? 'text-amber-600' : 'text-slate-500'}`}>
                                                    {cityLocating ? 'Finding selected city on map...' : cityMapMessage}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {error && <div className="error-alert"><AlertCircle size={20} /><span>{error}</span></div>}

                    <div className="mt-8">
                        <button
                            type="submit"
                            className="w-full h-11 rounded-lg font-semibold bg-sky-500 hover:bg-sky-600 text-white inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Create Account <ArrowRight size={18} /></>}
                        </button>
                    </div>
                </form>

                <div className="login-footer">
                    <p>Already have an account?{' '}
                        <Link to={`/login?role=${role.toLowerCase()}`} className="font-semibold text-sky-600 hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ id, label, type = 'text', value, onChange, onChangeRaw, icon, required, children, wrapperClass = '', loading, error, ...props }) => (
    <div className={`space-y-1.5 ${wrapperClass}`}>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}{required ? <> <span className="text-red-500">*</span></> : null}</label>
        <div className="input-wrapper">
            {icon && <div className="input-icon">{React.cloneElement(icon, { size: 18 })}</div>}
            <input
                id={id}
                type={type}
                className={`form-input w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${icon ? 'with-icon' : ''} ${children ? 'pr-24' : ''}`}
                value={value}
                onChange={onChangeRaw || (e => {
                    const nextValue = type === 'tel'
                        ? e.target.value.replace(/\D/g, '').slice(0, 10)
                        : e.target.value;
                    onChange(nextValue);
                })}
                required={required}
                {...props}
            />
            {children}
            {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
);

const PasswordToggle = ({ visible, setVisible }) => (
    <button type="button" onClick={() => setVisible(!visible)} className="password-toggle">
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
);

export default Register;
