import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI, locationAPI } from '../services/api';
import { UtensilsCrossed, Mail, Lock, Store, ArrowRight, Info, ArrowLeft, Eye, EyeOff, ChefHat, User, Phone, Home, MapPin, LocateFixed } from 'lucide-react';
import { states, getCities } from '../lib/locations';


/**
 * Register Page Component (Tailwind v4 + Loveable Style)
 */
function Register({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [aadharNumber, setAadharNumber] = useState('');
    const [primaryPhone, setPrimaryPhone] = useState('');
    const [alternatePhone, setAlternatePhone] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [area, setArea] = useState('');
    const [city, setCity] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [pincode, setPincode] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [locatingPosition, setLocatingPosition] = useState(false);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [aadharError, setAadharError] = useState('');
    const [primaryPhoneError, setPrimaryPhoneError] = useState('');
    const [alternatePhoneError, setAlternatePhoneError] = useState('');
    const [clientPhoneError, setClientPhoneError] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { role } = useParams(); // Get role from URL
    const selectedRole = role?.toUpperCase();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Basic additional validation per role
        if (selectedRole === 'CATERER') {
            if (!businessName.trim()) { setError('Business name is required'); return; }
            if (!ownerName.trim()) { setError('Owner name is required'); return; }
            if (!primaryPhone.trim()) { setError('Primary phone is required'); return; }
            if (!selectedState) { setError('State is required'); return; }
            if (!city.trim()) { setError('City is required'); return; }
            if (!streetAddress.trim()) { setError('Business street address is required'); return; }

            const hasLatitude = latitude.trim() !== '';
            const hasLongitude = longitude.trim() !== '';

            if ((hasLatitude && !hasLongitude) || (!hasLatitude && hasLongitude)) {
                setError('Please provide both latitude and longitude, or leave both empty.');
                return;
            }

            if (hasLatitude && hasLongitude) {
                const latValue = Number(latitude);
                const lngValue = Number(longitude);

                if (Number.isNaN(latValue) || latValue < -90 || latValue > 90) {
                    setError('Latitude must be between -90 and 90.');
                    return;
                }

                if (Number.isNaN(lngValue) || lngValue < -180 || lngValue > 180) {
                    setError('Longitude must be between -180 and 180.');
                    return;
                }
            }
        } else {
            // Client
            if (!clientName.trim()) { setError('Name is required'); return; }
            if (!clientPhone.trim()) { setError('Phone is required'); return; }
            if (!selectedState) { setError('State is required'); return; }
            if (!city.trim() || !area.trim()) { setError('City and area are required'); return; }
        }

        // prevent submit when there are validation errors
        if (aadharError || primaryPhoneError || alternatePhoneError || clientPhoneError) {
            setError('Please fix validation errors before submitting');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                email,
                password,
                role: selectedRole || 'CLIENT'
            };

            if (pincode) payload.pincode = pincode;

            if (selectedRole === 'CATERER') {
                payload.businessName = businessName;
                payload.ownerName = ownerName;
                payload.aadharNumber = aadharNumber;
                payload.primaryPhone = primaryPhone;
                payload.alternatePhone = alternatePhone;
                payload.streetAddress = streetAddress;
                payload.area = area;
                payload.state = selectedState;
                payload.city = city;
                payload.address = `${streetAddress}${area ? ', ' + area : ''}${city ? ', ' + city : ''}`;

                if (latitude.trim() !== '' && longitude.trim() !== '') {
                    payload.latitude = Number(latitude);
                    payload.longitude = Number(longitude);
                }
            } else {
                payload.name = clientName;
                payload.phone = clientPhone;
                payload.state = selectedState;
                payload.city = city;
                payload.area = area;
            }

            const response = await authAPI.register(payload);

            if (response.success) {
                onLogin(response);
                // App.jsx will redirect based on role
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported in this browser.');
            return;
        }

        setLocatingPosition(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(String(position.coords.latitude));
                setLongitude(String(position.coords.longitude));
                setLocatingPosition(false);
            },
            (geoError) => {
                setError(geoError.message || 'Unable to fetch your current location.');
                setLocatingPosition(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    };

    const handlePincodeChange = async (e) => {
        const val = e.target.value.replace(/\D/g, '');
        setPincode(val);
        setPincodeError('');
        if (val.length === 6) {
            setPincodeLoading(true);
            try {
                const res = await locationAPI.lookupPincode(val);
                if (res && res.success) {
                    if (res.state) setSelectedState(res.state);
                    if (res.district) setCity(res.district);
                    setPincodeError('');
                } else {
                    setPincodeError(res.message || 'Pincode not found');
                }
            } catch (err) {
                setPincodeError(err.message || 'Lookup failed');
            } finally {
                setPincodeLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
            </button>

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mt-6">Join CaterFind</h1>
                    <p className="text-muted-foreground text-lg">
                        {selectedRole === 'CATERER'
                            ? 'Create your business profile'
                            : 'Start finding perfect caterers'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-card border rounded-2xl p-8 shadow-2xl shadow-background/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Caterer: business + owner + contacts + address */}
                        {selectedRole === 'CATERER' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                        <Store className="h-4 w-4" />
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 hover:border-primary/50"
                                        placeholder="My Catering Co."
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        Owner Name
                                    </label>
                                    <input type="text" className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground"><Info className="h-4 w-4" />Aadhar Card No.</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={12}
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            value={aadharNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAadharNumber(val);
                                                        if (!val) setAadharError('Aadhaar is required');
                                                        else if (val.length !== 12) setAadharError('Aadhaar must be 12 digits');
                                                        else setAadharError('');
                                                    }}
                                            required
                                        />
                                                {aadharError && <div className="text-sm text-destructive mt-1">{aadharError}</div>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />Primary Phone</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={10}
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            value={primaryPhone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setPrimaryPhone(val);
                                                if (!val) setPrimaryPhoneError('Primary phone is required');
                                                else if (val.length !== 10) setPrimaryPhoneError('Phone must be 10 digits');
                                                else setPrimaryPhoneError('');
                                            }}
                                            required
                                        />
                                        {primaryPhoneError && <div className="text-sm text-destructive mt-1">{primaryPhoneError}</div>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />Alternate Phone (optional)</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        maxLength={10}
                                        className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                        value={alternatePhone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setAlternatePhone(val);
                                            if (val && val.length !== 10) setAlternatePhoneError('Alternate phone must be 10 digits');
                                            else setAlternatePhoneError('');
                                        }}
                                    />
                                    {alternatePhoneError && <div className="text-sm text-destructive mt-1">{alternatePhoneError}</div>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground"><Home className="h-4 w-4" />Street Address</label>
                                    <input type="text" className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">Pincode</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        maxLength={6}
                                        className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                        value={pincode}
                                        onChange={handlePincodeChange}
                                    />
                                    {pincodeLoading ? <div className="text-sm text-muted-foreground">Looking up pincode...</div> : pincodeError && <div className="text-sm text-destructive">{pincodeError}</div>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">State</label>
                                        <select
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            value={selectedState}
                                            onChange={(e) => { setSelectedState(e.target.value); setCity(''); }}
                                        >
                                            <option value="">Select state</option>
                                                { /* If pincode returns a state that's not in our static list, render it so the select shows the value */ }
                                                {selectedState && !states.some(s => s.value === selectedState) && (
                                                    <option value={selectedState}>{selectedState}</option>
                                                )}
                                                {states.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">City</label>
                                        <select
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            value={city}
                                            disabled={!selectedState}
                                            onChange={(e) => setCity(e.target.value)}
                                        >
                                            <option value="">Select city</option>
                                            { /* Include API-returned district as an option if it's not already in our static list */ }
                                            {city && selectedState && !getCities(selectedState).includes(city) && (
                                                <option key={city} value={city}>{city}</option>
                                            )}
                                            {getCities(selectedState).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">Area</label>
                                        <input type="text" className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm" value={area} onChange={(e) => setArea(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            Coordinates (Optional)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleUseCurrentLocation}
                                            disabled={locatingPosition}
                                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border bg-input hover:bg-secondary text-foreground"
                                        >
                                            <LocateFixed className="h-3 w-3" />
                                            {locatingPosition ? 'Locating...' : 'Use current location'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            step="any"
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            placeholder="Latitude (e.g. 28.6139)"
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            step="any"
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            placeholder="Longitude (e.g. 77.2090)"
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Adding coordinates improves nearby search ranking for clients.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 hover:border-primary/50"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Client-specific minimal fields */}
                        {selectedRole !== 'CATERER' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">Pincode</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        maxLength={6}
                                        className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                        value={pincode}
                                        onChange={handlePincodeChange}
                                    />
                                    {pincodeLoading ? <div className="text-sm text-muted-foreground">Looking up pincode...</div> : pincodeError && <div className="text-sm text-destructive">{pincodeError}</div>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        Name
                                    </label>
                                    <input type="text" className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm" placeholder="Your name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">State</label>
                                        <select
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            value={selectedState}
                                            onChange={(e) => { setSelectedState(e.target.value); setCity(''); }}
                                        >
                                            <option value="">Select state</option>
                                                { /* If pincode returns a state that's not in our static list, render it so the select shows the value */ }
                                                {selectedState && !states.some(s => s.value === selectedState) && (
                                                    <option value={selectedState}>{selectedState}</option>
                                                )}
                                                {states.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">City</label>
                                        <select
                                            className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                            value={city}
                                            disabled={!selectedState}
                                            onChange={(e) => setCity(e.target.value)}
                                        >
                                            <option value="">Select city</option>
                                            { /* Include API-returned district as an option if it's not already in our static list */ }
                                            {city && selectedState && !getCities(selectedState).includes(city) && (
                                                <option key={city} value={city}>{city}</option>
                                            )}
                                            {getCities(selectedState).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">Area</label>
                                        <input type="text" className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm" value={area} onChange={(e) => setArea(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />Phone</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        maxLength={10}
                                        className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm"
                                        value={clientPhone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setClientPhone(val);
                                            if (!val) setClientPhoneError('Phone is required');
                                            else if (val.length !== 10) setClientPhoneError('Phone must be 10 digits');
                                            else setClientPhoneError('');
                                        }}
                                        required
                                    />
                                    {clientPhoneError && <div className="text-sm text-destructive mt-1">{clientPhoneError}</div>}
                                </div>
                            </>
                        )}

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                <Lock className="h-4 w-4" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 pr-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 hover:border-primary/50"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                <Lock className="h-4 w-4" />
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 pr-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 hover:border-primary/50"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-in shake duration-300">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to={`/login/${role || 'client'}`}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
