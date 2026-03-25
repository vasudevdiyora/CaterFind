import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authAPI, fileAPI } from '../services/api';
import {
    Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft,
    User, Phone, Building, MapPin, Hash, ChefHat, Home, LocateFixed
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { states, getCities } from '../lib/locations';
import '../styles/Login.css'; // Reusing login styles for consistency

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
                                <FormInput id="primaryPhone" label="Contact Phone" type="tel" value={primaryPhone} onChange={setPrimaryPhone} icon={<Phone />} required wrapperClass={role === 'CLIENT' ? 'md:col-span-1' : ''} />
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                    <select
                                        className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        value={selectedState}
                                        onChange={e => setSelectedState(e.target.value)}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                    <select
                                        className="w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        required
                                        disabled={!selectedState}
                                    >
                                        <option value="">Select City</option>
                                        {getCities(selectedState).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
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
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="input-wrapper">
            {icon && <div className="input-icon">{React.cloneElement(icon, { size: 18 })}</div>}
            <input
                id={id}
                type={type}
                className={`form-input w-full h-10 px-3 border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${icon ? 'with-icon' : ''} ${children ? 'pr-24' : ''}`}
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
