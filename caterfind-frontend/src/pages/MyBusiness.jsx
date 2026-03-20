import React, { useState, useEffect, useRef } from 'react';
import { fileAPI, profileAPI } from '../services/api';
import '../styles/MyBusiness.css';

/**
 * My Business Page Component (Loveable Design)
 * 
 * Comprehensive business profile management with:
 * - Basic Information (name, description)
 * - Contact Details (phones, email)
 * - Address (street, area, city, landmark)
 * - Service Area (radius in km)
 * - Photos & Media upload
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
        imageUrl: '' // Profile image URL - saved to database
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [locatingPosition, setLocatingPosition] = useState(false);
    const [businessPhotos, setBusinessPhotos] = useState([]);
    const [businessVideos, setBusinessVideos] = useState([]);

    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);

    useEffect(() => {
        loadBusinessProfile();
    }, []);

    const loadBusinessProfile = async () => {
        const catererId = user?.userId || user?.id; // Handle both cases for robustness
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
                
                // Load business photos from comma-separated string
                if (data.businessPhotos) {
                    const photoUrls = data.businessPhotos.split(',').filter(url => url.trim());
                    setBusinessPhotos(photoUrls.map(url => ({ url: url.trim(), name: '' })));
                }
            }
        } catch (error) {
            // Error loading profile
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const catererId = user?.userId || user?.id;

        try {
            const hasLatitude = String(formData.latitude).trim() !== '';
            const hasLongitude = String(formData.longitude).trim() !== '';

            if ((hasLatitude && !hasLongitude) || (!hasLatitude && hasLongitude)) {
                throw new Error('Please provide both latitude and longitude, or leave both empty.');
            }

            if (hasLatitude && hasLongitude) {
                const latValue = Number(formData.latitude);
                const lngValue = Number(formData.longitude);

                if (Number.isNaN(latValue) || latValue < -90 || latValue > 90) {
                    throw new Error('Latitude must be between -90 and 90.');
                }

                if (Number.isNaN(lngValue) || lngValue < -180 || lngValue > 180) {
                    throw new Error('Longitude must be between -180 and 180.');
                }
            }

            // Convert businessPhotos array to comma-separated string
            const businessPhotosString = businessPhotos.map(photo => photo.url).join(',');
            
            const dataToSave = {
                ...formData,
                latitude: hasLatitude ? Number(formData.latitude) : null,
                longitude: hasLongitude ? Number(formData.longitude) : null,
                businessPhotos: businessPhotosString
            };
            
            const updatedData = await profileAPI.update(catererId, dataToSave);
            if (updatedData) {
                setFormData(updatedData); // Update with server response
                alert('Business profile updated successfully!');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
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
                handleChange('latitude', String(position.coords.latitude));
                handleChange('longitude', String(position.coords.longitude));
                setLocatingPosition(false);
            },
            (error) => {
                alert(error.message || 'Unable to fetch your current location.');
                setLocatingPosition(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    };

    const handlePhotoUpload = () => {
        photoInputRef.current?.click();
    };

    const handleVideoUpload = () => {
        videoInputRef.current?.click();
    };

    const handlePhotoChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingPhoto(true);
        try {
            for (const file of files) {
                const result = await fileAPI.upload(file);
                setBusinessPhotos(prev => [...prev, {
                    url: result.url,
                    name: file.name
                }]);
                
                // Set the first uploaded photo as the profile image
                if (formData.imageUrl === '') {
                    handleChange('imageUrl', result.url);
                }
            }
        } catch (error) {
            alert('Failed to upload photos: ' + error.message);
        } finally {
            setUploadingPhoto(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleVideoChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingVideo(true);
        try {
            for (const file of files) {
                const result = await fileAPI.upload(file);
                setBusinessVideos(prev => [...prev, {
                    url: result.url,
                    name: file.name
                }]);
            }
        } catch (error) {
            alert('Failed to upload videos: ' + error.message);
        } finally {
            setUploadingVideo(false);
            e.target.value = ''; // Reset input
        }
    };

    const removePhoto = async (index, photoUrl) => {
        if (confirm('Delete this photo?')) {
            try {
                await fileAPI.delete(photoUrl);
                setBusinessPhotos(prev => prev.filter((_, i) => i !== index));
            } catch (error) {
                alert('Failed to delete photo');
            }
        }
    };

    const removeVideo = async (index, videoUrl) => {
        if (confirm('Delete this video?')) {
            try {
                await fileAPI.delete(videoUrl);
                setBusinessVideos(prev => prev.filter((_, i) => i !== index));
            } catch (error) {
                alert('Failed to delete video');
            }
        }
    };

    if (loading) {
        return (
            <div className="business-container">
                <div className="loading-state">Loading business profile...</div>
            </div>
        );
    }

    return (
        <div className="business-container">
            <div className="business-header">
                <h1 className="business-title">👤 Business Profile</h1>
            </div>

            <form className="business-form" onSubmit={handleSave}>
                {/* Basic Information */}
                <div className="form-section">
                    <h2 className="section-heading">Basic Information</h2>

                    <div className="form-field">
                        <label className="field-label">Business Name</label>
                        <input
                            type="text"
                            className="field-input"
                            value={formData.businessName}
                            onChange={(e) => handleChange('businessName', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label className="field-label">Description</label>
                        <textarea
                            className="field-textarea"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            placeholder="Describe your catering services..."
                        />
                    </div>
                </div>

                {/* Contact Details */}
                <div className="form-section">
                    <h2 className="section-heading">📞 Contact Details</h2>

                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label">Primary Phone</label>
                            <div className="input-with-icon">
                                <span className="input-icon">📞</span>
                                <input
                                    type="tel"
                                    className="field-input with-icon"
                                    value={formData.primaryPhone}
                                    onChange={(e) => handleChange('primaryPhone', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="field-label">Alternate Phone</label>
                            <div className="input-with-icon">
                                <span className="input-icon">📞</span>
                                <input
                                    type="tel"
                                    className="field-input with-icon"
                                    value={formData.alternatePhone}
                                    onChange={(e) => handleChange('alternatePhone', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">Email</label>
                        <div className="input-with-icon">
                            <span className="input-icon">📧</span>
                            <input
                                type="email"
                                className="field-input with-icon"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="form-section">
                    <h2 className="section-heading">📍 Address</h2>

                    <div className="form-field">
                        <label className="field-label">Street Address</label>
                        <input
                            type="text"
                            className="field-input"
                            value={formData.streetAddress}
                            onChange={(e) => handleChange('streetAddress', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label">Area</label>
                            <input
                                type="text"
                                className="field-input"
                                value={formData.area}
                                onChange={(e) => handleChange('area', e.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label className="field-label">City</label>
                            <input
                                type="text"
                                className="field-input"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">Landmark (Optional)</label>
                        <input
                            type="text"
                            className="field-input"
                            value={formData.landmark}
                            onChange={(e) => handleChange('landmark', e.target.value)}
                            placeholder="e.g., Near Central Market"
                        />
                    </div>

                    <div className="form-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <label className="field-label" style={{ marginBottom: 0 }}>Coordinates (Optional)</label>
                            <button
                                type="button"
                                className="upload-button"
                                onClick={handleUseCurrentLocation}
                                disabled={locatingPosition}
                                style={{ padding: '8px 12px', fontSize: '12px' }}
                            >
                                {locatingPosition ? 'Locating...' : 'Use current location'}
                            </button>
                        </div>
                        <div className="form-row">
                            <div className="form-field">
                                <input
                                    type="number"
                                    step="any"
                                    className="field-input"
                                    value={formData.latitude}
                                    onChange={(e) => handleChange('latitude', e.target.value)}
                                    placeholder="Latitude (e.g. 28.6139)"
                                />
                            </div>
                            <div className="form-field">
                                <input
                                    type="number"
                                    step="any"
                                    className="field-input"
                                    value={formData.longitude}
                                    onChange={(e) => handleChange('longitude', e.target.value)}
                                    placeholder="Longitude (e.g. 77.2090)"
                                />
                            </div>
                        </div>
                        <p className="field-hint">Coordinates improve nearby ranking in client discovery.</p>
                    </div>
                </div>

                {/* Service Area */}
                <div className="form-section">
                    <h2 className="section-heading">✈️ Service Area</h2>

                    <div className="form-field">
                        <label className="field-label">Service Radius (in km)</label>
                        <div className="radius-input-group">
                            <input
                                type="number"
                                className="field-input radius-input"
                                value={formData.serviceRadius}
                                onChange={(e) => handleChange('serviceRadius', parseInt(e.target.value))}
                                min="1"
                                max="500"
                                required
                            />
                            <span className="radius-hint">kilometers from your location</span>
                        </div>
                    </div>
                </div>

                {/* Photos & Media */}
                <div className="form-section">
                    <h2 className="section-heading">📸 Photos & Media</h2>

                    {/* Profile Image Preview */}
                    <div className="form-field">
                        <label className="field-label">Profile Image</label>
                        {formData.imageUrl && (
                            <div style={{ marginBottom: '16px' }}>
                                <img 
                                    src={fileAPI.getImageUrl(formData.imageUrl)} 
                                    alt="Profile"
                                    style={{ 
                                        width: '200px', 
                                        height: '200px', 
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '2px solid var(--border-color, #333)'
                                    }}
                                />
                                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Current profile image</p>
                            </div>
                        )}
                    </div>

                    <div className="form-field">
                        <label className="field-label">Business Photos</label>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            className="upload-button"
                            onClick={handlePhotoUpload}
                            disabled={uploadingPhoto}
                        >
                            <span className="upload-icon">⬆️</span>
                            {uploadingPhoto ? 'Uploading...' : 'Upload Photos'}
                        </button>
                        <p className="field-hint">Upload photos of your kitchen, dishes, and events</p>
                        
                        {businessPhotos.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                {businessPhotos.map((photo, index) => (
                                    <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: formData.imageUrl === photo.url ? '3px solid #4CAF50' : '2px solid var(--border-color, #333)' }}>
                                        <img 
                                            src={fileAPI.getImageUrl(photo.url)} 
                                            alt={photo.name}
                                            style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => handleChange('imageUrl', photo.url)}
                                            title="Click to set as profile image"
                                        />
                                        {formData.imageUrl === photo.url && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '8px',
                                                background: '#4CAF50',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                ✓ Profile Image
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index, photo.url)}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(255, 0, 0, 0.8)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                lineHeight: '1'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-field">
                        <label className="field-label">Videos (Optional)</label>
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleVideoChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            className="upload-button"
                            onClick={handleVideoUpload}
                            disabled={uploadingVideo}
                        >
                            <span className="upload-icon">⬆️</span>
                            {uploadingVideo ? 'Uploading...' : 'Upload Videos'}
                        </button>
                        <p className="field-hint">Showcase your catering services with videos</p>
                        
                        {businessVideos.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                {businessVideos.map((video, index) => (
                                    <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border-color, #333)' }}>
                                        <video 
                                            src={fileAPI.getImageUrl(video.url)}
                                            controls
                                            style={{ width: '100%', height: '150px', objectFit: 'cover', backgroundColor: '#000' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVideo(index, video.url)}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(255, 0, 0, 0.8)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                lineHeight: '1'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className="save-button"
                        disabled={saving}
                    >
                        <span className="save-icon">💾</span>
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default MyBusiness;
