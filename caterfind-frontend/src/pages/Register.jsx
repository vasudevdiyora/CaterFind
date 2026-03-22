import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI, locationAPI, fileAPI } from '../services/api';
import {
    UtensilsCrossed, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft,
    User, Phone, Building, MapPin, Hash, ChefHat, Home, LocateFixed
} from 'lucide-react';
import { states, getCities } from '../lib/locations';
import '../styles/Login.css'; // Reusing login styles for consistency

const Register = ({ onLogin }) => {
    const navigate = useNavigate();
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
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState('');
    const [locating, setLocating] = useState(false);

    const getRoleFromQuery = () => new URLSearchParams(location.search).get('role')?.toUpperCase() || 'CLIENT';
    const [role, setRole] = useState(getRoleFromQuery());

    useEffect(() => {
        setRole(getRoleFromQuery());
    }, [location.search]);

    // Allow manual pincode entry — do not auto-lookup remote API
    const handlePincodeChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
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
                setLatitude(String(position.coords.latitude));
                setLongitude(String(position.coords.longitude));
                setLocating(false);
            },
            () => {
                setError('Unable to fetch your current location.');
                setLocating(false);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) return setError('Passwords do not match.');
        if (password.length < 6) return setError('Password must be at least 6 characters.');

        const payload = { email, password, role, pincode, state: selectedState, city, area };

        if (role === 'CATERER') {
            Object.assign(payload, {
                businessName,
                ownerName,
                primaryPhone,
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
            Object.assign(payload, { name: clientName, phone: primaryPhone });
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
        <div className="login-container">
            <div className="login-card !max-w-2xl">
                <Link to="/" className="back-button">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="login-header">
                    <div className="logo-icon">
                        <UtensilsCrossed size={24} />
                    </div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Common Fields */}
                        <h3 className="col-span-full form-section-header">Account Details</h3>
                        <FormInput id="email" label="Email Address" type="email" value={email} onChange={setEmail} icon={<Mail />} required />
                        <div />
                        <FormInput id="password" label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} icon={<Lock />} required>
                            <PasswordToggle visible={showPassword} setVisible={setShowPassword} />
                        </FormInput>
                        <FormInput id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} icon={<Lock />} required>
                            <PasswordToggle visible={showConfirmPassword} setVisible={setShowConfirmPassword} />
                        </FormInput>

                        {/* Role-Specific Fields */}
                        <h3 className="col-span-full form-section-header pt-4">{role === 'CATERER' ? 'Business Information' : 'Personal Information'}</h3>
                        {role === 'CATERER' ? (
                            <>
                                <FormInput id="businessName" label="Business Name" value={businessName} onChange={setBusinessName} icon={<ChefHat />} required />
                                <FormInput id="ownerName" label="Owner's Full Name" value={ownerName} onChange={setOwnerName} icon={<User />} required />
                            </>
                        ) : (
                            <FormInput id="clientName" label="Full Name" value={clientName} onChange={setClientName} icon={<User />} required />
                        )}
                        <FormInput id="primaryPhone" label="Contact Phone" type="tel" value={primaryPhone} onChange={setPrimaryPhone} icon={<Phone />} required />

                        {role === 'CATERER' && (
                            <>
                                <FormInput id="panNumber" label="PAN Number" value={panNumber} onChange={setPanNumber} icon={<Hash />} />

                                <FormInput id="aadharNumber" label="Aadhaar Number" value={aadharNumber} onChange={setAadharNumber} icon={<Hash />} />

                                <div className="form-group">
                                    <label>Profile Image</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0], setProfileImageUrl)} />
                                    {profileImageUrl && <p className="text-xs text-slate-600 mt-1">Uploaded: {profileImageUrl}</p>}
                                </div>

                                <div className="form-group">
                                    <label>PAN Document (optional)</label>
                                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e.target.files?.[0], setPanDocumentUrl)} />
                                    {panDocumentUrl && <p className="text-xs text-slate-600 mt-1">Uploaded: {panDocumentUrl}</p>}
                                </div>

                                <div className="form-group">
                                    <label>Aadhaar Document (optional)</label>
                                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e.target.files?.[0], setAadharDocumentUrl)} />
                                    {aadharDocumentUrl && <p className="text-xs text-slate-600 mt-1">Uploaded: {aadharDocumentUrl}</p>}
                                </div>
                            </>
                        )}

                        <h3 className="col-span-full form-section-header pt-4">Location</h3>
                        <FormInput id="pincode" label="Pincode" value={pincode} onChangeRaw={handlePincodeChange} icon={<Hash />} maxLength={6} loading={pincodeLoading} error={pincodeError} />
                        <div className="form-group">
                            <label>State</label>
                            <select className="form-input" value={selectedState} onChange={e => setSelectedState(e.target.value)} required>
                                <option value="">Select State</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <select className="form-input" value={city} onChange={e => setCity(e.target.value)} required disabled={!selectedState}>
                                <option value="">Select City</option>
                                {getCities(selectedState).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <FormInput id="area" label="Area / Locality" value={area} onChange={setArea} icon={<MapPin />} required />

                        {role === 'CATERER' && (
                            <>
                                <FormInput id="streetAddress" label="Street Address" value={streetAddress} onChange={setStreetAddress} icon={<Home />} required wrapperClass="col-span-full" />
                                <FormInput id="latitude" label="Latitude" value={latitude} onChange={setLatitude} icon={<LocateFixed />} placeholder="e.g., 28.6139" />
                                <FormInput id="longitude" label="Longitude" value={longitude} onChange={setLongitude} icon={<LocateFixed />} placeholder="e.g., 77.2090">
                                    <button type="button" onClick={handleUseCurrentLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-600 hover:underline" disabled={locating}>
                                        {locating ? 'Locating...' : 'Use Current'}
                                    </button>
                                </FormInput>
                            </>
                        )}
                    </div>

                    {error && <div className="error-alert col-span-full"><AlertCircle size={20} /><span>{error}</span></div>}

                    <div className="pt-4">
                        <button type="submit" className="primary-button w-full !text-base !py-3" disabled={loading}>
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Create Account <ArrowRight size={20} className="ml-2" /></>}
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
    <div className={`form-group ${wrapperClass}`}>
        <label htmlFor={id}>{label}</label>
        <div className="input-wrapper">
            {icon && <div className="input-icon">{React.cloneElement(icon, { size: 18 })}</div>}
            <input
                id={id}
                type={type}
                className={`form-input ${icon ? 'with-icon' : ''} ${children ? 'pr-24' : ''}`}
                value={value}
                onChange={onChangeRaw || (e => onChange(e.target.value))}
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
