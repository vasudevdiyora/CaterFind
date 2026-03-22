import React, { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import { fileAPI, profileAPI, authAPI } from '../services/api';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import '../styles/MyBusiness.css';
import '../styles/Table.css'; // For modals and buttons
import { Building, Info, Phone, Mail, MapPin, Compass, Image as ImageIcon, Video, Upload, Trash2, Save, Loader, ShieldCheck, X, LocateFixed } from 'lucide-react';

const DEFAULT_MAP_CENTER = [22.9734, 78.6569]; // Center of India

const businessLocationIcon = L.icon({
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
            icon={businessLocationIcon}
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

/**
 * My Business Page Component (Dense Light Theme)
 */
function MyBusiness({ user }) {
    const [formData, setFormData] = useState({
        businessName: '',
        description: '',
        primaryPhone: '',
        alternatePhone: '',
        email: '',
        streetAddress: '',
        area: '',
        city: '',
        landmark: '',
        latitude: '',
        longitude: '',
        serviceRadius: 50,
        imageUrl: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [locatingPosition, setLocatingPosition] = useState(false);
    const [businessPhotos, setBusinessPhotos] = useState([]);
    const [businessVideos, setBusinessVideos] = useState([]);
    const [mapPosition, setMapPosition] = useState(null);

    // Email-change OTP state
    const [originalEmail, setOriginalEmail] = useState('');
    const [emailOtpModal, setEmailOtpModal] = useState(false);
    const [pendingNewEmail, setPendingNewEmail] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');

    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);

    useEffect(() => {
        loadBusinessProfile();
    }, []);

    useEffect(() => {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            setMapPosition([lat, lng]);
        }
    }, [formData.latitude, formData.longitude]);

    const loadBusinessProfile = async () => {
        const catererId = user?.userId || user?.id;
        if (!catererId) {
            setLoading(false);
            return;
        }
        try {
            const data = await profileAPI.get(catererId);
            if (data) {
                setFormData({
                    businessName: data.businessName || '',
                    description: data.description || '',
                    primaryPhone: data.primaryPhone || '',
                    alternatePhone: data.alternatePhone || '',
                    email: data.email || '',
                    streetAddress: data.streetAddress || '',
                    area: data.area || '',
                    city: data.city || '',
                    landmark: data.landmark || '',
                    latitude: data.latitude ?? '',
                    longitude: data.longitude ?? '',
                    serviceRadius: data.serviceRadius || 50,
                    imageUrl: data.imageUrl || ''
                });
                setOriginalEmail(data.email || '');
                if (data.businessPhotos) {
                    const photoUrls = data.businessPhotos.split(',').filter(url => url.trim());
                    setBusinessPhotos(photoUrls.map(url => ({ url: url.trim(), name: '' })));
                }
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const newEmail = formData.email.trim().toLowerCase();
        const oldEmail = originalEmail.trim().toLowerCase();

        if (newEmail && newEmail !== oldEmail) {
            setSendingOtp(true);
            setOtpError('');
            try {
                await authAPI.requestEmailChangeOtp(formData.email.trim());
                setPendingNewEmail(formData.email.trim());
                setOtpValue('');
                setOtpError('');
                setOtpSuccess('');
                setEmailOtpModal(true);
            } catch (err) {
                alert('Could not send OTP: ' + (err.message || 'Please try again.'));
            } finally {
                setSendingOtp(false);
            }
        } else {
            await performSave();
        }
    };

    const performSave = async (finalEmail = null) => {
        setSaving(true);
        const catererId = user?.userId || user?.id;
        const photoUrls = businessPhotos.map(p => p.url).join(',');
        const payload = {
            ...formData,
            email: finalEmail || formData.email,
            businessPhotos: photoUrls
        };

        try {
            await profileAPI.update(catererId, payload);
            if (finalEmail) {
                setOriginalEmail(finalEmail);
            }
            alert('Profile saved successfully!');
        } catch (error) {
            alert('Failed to save profile: ' + error.message);
        } finally {
            setSaving(false);
            setEmailOtpModal(false);
        }
    };

    const handleOtpVerification = async (e) => {
        e.preventDefault();
        setVerifyingOtp(true);
        setOtpError('');
        setOtpSuccess('');
        try {
            await authAPI.verifyEmailChangeOtp(pendingNewEmail, otpValue);
            setOtpSuccess('Email verified! Saving profile...');
            await performSave(pendingNewEmail);
        } catch (err) {
            setOtpError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const uploader = type === 'photo' ? setUploadingPhoto : setUploadingVideo;
        uploader(true);

        try {
            const result = await fileAPI.upload(file);
            if (type === 'photo') {
                setBusinessPhotos(prev => [...prev, { url: result.url, name: file.name }]);
            } else {
                setBusinessVideos(prev => [...prev, { url: result.url, name: file.name }]);
            }
        } catch (error) {
            alert(`Failed to upload ${type}: ${error.message}`);
        } finally {
            uploader(false);
            event.target.value = '';
        }
    };

    const removeMedia = (index, type) => {
        if (type === 'photo') {
            setBusinessPhotos(prev => prev.filter((_, i) => i !== index));
        } else {
            setBusinessVideos(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setLocatingPosition(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handleChange('latitude', latitude.toFixed(6));
                handleChange('longitude', longitude.toFixed(6));
                setLocatingPosition(false);
            },
            () => {
                alert('Unable to retrieve your location.');
                setLocatingPosition(false);
            }
        );
    };

    const FormSection = ({ title, icon, children }) => (
        <div className="surface-card p-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3 mb-4">
                {icon} {title}
            </h2>
            <div className="space-y-4">{children}</div>
        </div>
    );

    if (loading) {
        return <div className="page-shell text-center p-10">Loading business profile...</div>;
    }

    return (
        <div className="page-shell py-8">
            <form onSubmit={handleSave}>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-extrabold text-slate-800">My Business Profile</h1>
                    <button type="submit" className="primary-button" disabled={saving || sendingOtp}>
                        {saving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="dense-grid grid-cols-1 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-5">
                        <FormSection title="Basic Information" icon={<Building size={20} />}>
                            <div className="form-group">
                                <label htmlFor="businessName">Business Name</label>
                                <input id="businessName" type="text" className="form-input" value={formData.businessName} onChange={e => handleChange('businessName', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description / Bio</label>
                                <textarea id="description" className="form-input" rows="4" value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Tell clients about your business, your specialty, and what makes you unique."></textarea>
                            </div>
                        </FormSection>

                        <FormSection title="Contact Details" icon={<Phone size={20} />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label htmlFor="primaryPhone">Primary Phone</label>
                                    <input id="primaryPhone" type="tel" className="form-input" value={formData.primaryPhone} onChange={e => handleChange('primaryPhone', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="alternatePhone">Alternate Phone</label>
                                    <input id="alternatePhone" type="tel" className="form-input" value={formData.alternatePhone} onChange={e => handleChange('alternatePhone', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Business Email</label>
                                <input id="email" type="email" className="form-input" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                                <p className="text-xs text-slate-500 mt-1">Changing your email will require OTP verification.</p>
                            </div>
                        </FormSection>

                        <FormSection title="Photos & Media" icon={<ImageIcon size={20} />}>
                            <div>
                                <label className="form-label">Business Photos</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {businessPhotos.map((photo, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img src={photo.url} alt={`Business photo ${index + 1}`} className="w-full h-full object-cover rounded-lg bg-slate-100" />
                                            <button type="button" onClick={() => removeMedia(index, 'photo')} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <div
                                        className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:border-sky-500 hover:bg-sky-50 transition-colors cursor-pointer"
                                        onClick={() => photoInputRef.current?.click()}
                                    >
                                        {uploadingPhoto ? <Loader className="animate-spin" /> : <Upload size={24} />}
                                    </div>
                                </div>
                                <input type="file" ref={photoInputRef} onChange={e => handleFileUpload(e, 'photo')} className="hidden" accept="image/*" />
                            </div>
                        </FormSection>
                    </div>

                    <div className="lg:col-span-1 space-y-5">
                        <FormSection title="Location & Service Area" icon={<MapPin size={20} />}>
                            <div className="form-group">
                                <label htmlFor="streetAddress">Street Address</label>
                                <input id="streetAddress" type="text" className="form-input" value={formData.streetAddress} onChange={e => handleChange('streetAddress', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label htmlFor="area">Area</label>
                                    <input id="area" type="text" className="form-input" value={formData.area} onChange={e => handleChange('area', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input id="city" type="text" className="form-input" value={formData.city} onChange={e => handleChange('city', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="landmark">Landmark</label>
                                <input id="landmark" type="text" className="form-input" value={formData.landmark} onChange={e => handleChange('landmark', e.target.value)} />
                            </div>
                            <div className="h-64 w-full rounded-lg overflow-hidden relative">
                                <MapContainer center={mapPosition || DEFAULT_MAP_CENTER} zoom={mapPosition ? 14 : 5} scrollWheelZoom={true} className="h-full w-full">
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapCenterUpdater position={mapPosition} />
                                    <LocationSelectorMarker position={mapPosition} onPositionSelect={(lat, lng) => {
                                        handleChange('latitude', lat.toFixed(6));
                                        handleChange('longitude', lng.toFixed(6));
                                    }} />
                                </MapContainer>
                                <button type="button" onClick={handleLocateMe} className="absolute top-2 right-2 secondary-button-sm z-[1000]">
                                    {locatingPosition ? <Loader className="animate-spin w-4 h-4" /> : <LocateFixed size={16} />}
                                </button>
                            </div>
                            <div className="form-group">
                                <label htmlFor="serviceRadius">Service Radius (km)</label>
                                <input id="serviceRadius" type="range" min="5" max="200" step="5" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={formData.serviceRadius} onChange={e => handleChange('serviceRadius', e.target.value)} />
                                <div className="text-center font-semibold text-slate-700 mt-1">{formData.serviceRadius} km</div>
                            </div>
                        </FormSection>
                    </div>
                </div>
            </form>

            <Modal isOpen={emailOtpModal} onClose={() => setEmailOtpModal(false)} title={<div className="flex items-center gap-2"><ShieldCheck /> Verify New Email</div>} className="">
                <form onSubmit={handleOtpVerification}>
                    <p className="text-sm text-slate-600 mb-4">
                        We've sent a One-Time Password (OTP) to <strong>{pendingNewEmail}</strong>. Please enter it below to confirm the change.
                    </p>
                    <div className="form-group">
                        <label htmlFor="otp">Enter OTP</label>
                        <input id="otp" type="text" className="form-input text-center tracking-[0.5em]" value={otpValue} onChange={e => setOtpValue(e.target.value)} maxLength="6" required />
                    </div>
                    {otpError && <p className="form-error-text mt-2">{otpError}</p>}
                    {otpSuccess && <p className="text-green-600 font-semibold mt-2">{otpSuccess}</p>}
                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={() => setEmailOtpModal(false)}>Cancel</button>
                        <button type="submit" className="submit-button" disabled={verifyingOtp}>
                            {verifyingOtp ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
                            Verify & Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default MyBusiness;
