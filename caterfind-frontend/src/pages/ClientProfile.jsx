import React, { useState, useEffect } from 'react';
import { User, Edit3, Save, X, AlertCircle, CheckCircle, Mail, Phone, MapPin, CalendarDays } from 'lucide-react';
import { authAPI } from '../services/api';
import '../styles/Table.css';

const ClientProfile = ({ user }) => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        memberSince: ''
    });
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await authAPI.getProfile();
            const formatted = {
                name: data.name || user?.displayName || '',
                email: data.email || user?.email || '',
                phone: data.phone || '',
                location: data.city || data.location || '',
                memberSince: data.createdAt
                    ? new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : ''
            };
            setProfile(formatted);
            setEditData(formatted);
        } catch {
            const fallback = {
                name: user?.displayName || '',
                email: user?.email || '',
                phone: '',
                location: '',
                memberSince: ''
            };
            setProfile(fallback);
            setEditData(fallback);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditData({ ...profile });
        setEditing(true);
        setSuccessMsg('');
        setError('');
    };

    const handleCancel = () => {
        setEditing(false);
        setError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                name: editData.name,
                phone: editData.phone,
                location: editData.location
            };
            await authAPI.updateProfile(payload);
            setProfile(prev => ({ ...prev, ...editData }));
            setEditing(false);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page-shell">
                <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="h-7 w-56 rounded-md bg-slate-200"></div>
                        <div className="h-4 w-72 rounded-md bg-slate-100 mt-3"></div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                        <div className="h-4 w-40 rounded-md bg-slate-100"></div>
                        <div className="h-12 rounded-lg bg-slate-100"></div>
                        <div className="h-12 rounded-lg bg-slate-100"></div>
                        <div className="h-12 rounded-lg bg-slate-100"></div>
                        <div className="h-12 rounded-lg bg-slate-100"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-shell space-y-6 pb-24 md:pb-8">
            <header className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50/35 to-white px-6 py-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-sky-100 text-sky-700">
                                <User size={22} />
                            </span>
                            My Profile
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-2">View and manage your personal information.</p>
                    </div>

                    {!editing && (
                        <button onClick={handleEdit} className="secondary-button-sm flex items-center gap-2">
                            <Edit3 size={14} /> Edit Profile
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="surface-card rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                        <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                        <p className="text-sm text-slate-500">Keep your details up to date for better recommendations.</p>
                    </div>

                    <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
                        {successMsg && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-center gap-3">
                                <CheckCircle size={20} />
                                <span>{successMsg}</span>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-3">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ProfileField
                                icon={<User size={16} />}
                                label="Full Name"
                                value={profile.name}
                                editValue={editData.name}
                                editing={editing}
                                onChange={v => setEditData(p => ({ ...p, name: v }))}
                                placeholder="Your full name"
                            />
                            <ProfileField
                                icon={<Mail size={16} />}
                                label="Email"
                                value={profile.email}
                                readonly
                            />
                            <ProfileField
                                icon={<Phone size={16} />}
                                label="Phone"
                                value={profile.phone}
                                editValue={editData.phone}
                                editing={editing}
                                onChange={v => setEditData(p => ({ ...p, phone: v }))}
                                placeholder="Your phone number"
                                type="tel"
                            />
                            <ProfileField
                                icon={<MapPin size={16} />}
                                label="City / Location"
                                value={profile.location}
                                editValue={editData.location}
                                editing={editing}
                                onChange={v => setEditData(p => ({ ...p, location: v }))}
                                placeholder="Your city"
                            />
                        </div>

                        {profile.memberSince && !editing && (
                            <ProfileField
                                icon={<CalendarDays size={16} />}
                                label="Member Since"
                                value={profile.memberSince}
                                readonly
                            />
                        )}

                        {editing && (
                            <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 sm:gap-4 pt-4 border-t border-slate-200">
                                <button type="button" onClick={handleCancel} className="secondary-button">
                                    <X size={16} className="mr-2" /> Cancel
                                </button>
                                <button type="submit" className="primary-button" disabled={saving}>
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    ) : (
                                        <Save size={16} className="mr-2" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

const ProfileField = ({ icon, label, value, editValue, editing, onChange, placeholder, type = 'text', readonly = false }) => {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <span className="text-slate-400">{icon}</span>
                <span>{label}</span>
            </label>
            {editing && !readonly ? (
                <input
                    type={type}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    value={editValue}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            ) : (
                <p className="text-slate-900 font-semibold pt-2">{value || '---'}</p>
            )}
        </div>
    );
};

export default ClientProfile;
