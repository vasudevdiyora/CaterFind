import React, { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, Shield, Globe } from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        // Notification Settings
        emailNotifications: true,
        smsNotifications: false,
        newUserNotification: true,
        trialBookingNotification: true,
        reportNotification: true,
        
        // Platform Settings
        allowRegistrations: true,
        requireCatererApproval: true,
        maintenanceMode: false,
        
        // Commission Settings
        commissionPercentage: 10,
        minimumCommission: 100,
        
        // Security Settings
        enforceStrongPassword: true,
        twoFactorAuth: false,
        sessionTimeout: 30,
    });

    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadSettings = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await adminAPI.getSettings();
                if (!isMounted) return;
                setSettings(prev => ({ ...prev, ...(data || {}) }));
            } catch (err) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load admin settings');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setError('');
        try {
            const data = await adminAPI.saveSettings(settings);
            setSettings(prev => ({ ...prev, ...(data || {}) }));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        }
    };

    const Toggle = ({ enabled, onToggle }) => (
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                enabled ? 'bg-sky-500' : 'bg-slate-300'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">Manage platform configuration and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="primary-button w-full sm:w-auto"
                >
                    <Save size={18} />
                    <span>Save Changes</span>
                </button>
            </div>

            {saved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-4">
                    Settings saved successfully!
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-500 shadow-sm">
                    Loading settings...
                </div>
            )}

            {/* Notification Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Bell className="text-sky-600" size={22} />
                    <h2 className="text-xl font-semibold text-foreground">Notification Settings</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Toggle 
                            enabled={settings.emailNotifications}
                            onToggle={() => handleToggle('emailNotifications')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">SMS Notifications</p>
                            <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                        </div>
                        <Toggle 
                            enabled={settings.smsNotifications}
                            onToggle={() => handleToggle('smsNotifications')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">New Account Registrations</p>
                            <p className="text-sm text-muted-foreground">Get notified when new accounts are created</p>
                        </div>
                        <Toggle 
                            enabled={settings.newUserNotification}
                            onToggle={() => handleToggle('newUserNotification')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Trial Bookings</p>
                            <p className="text-sm text-muted-foreground">Get notified about new trial bookings</p>
                        </div>
                        <Toggle 
                            enabled={settings.trialBookingNotification}
                            onToggle={() => handleToggle('trialBookingNotification')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Content Reports</p>
                            <p className="text-sm text-muted-foreground">Get notified about flagged content</p>
                        </div>
                        <Toggle 
                            enabled={settings.reportNotification}
                            onToggle={() => handleToggle('reportNotification')}
                        />
                    </div>
                </div>
            </div>

            {/* Platform Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Globe className="text-sky-600" size={22} />
                    <h2 className="text-xl font-semibold text-foreground">Platform Settings</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Allow New Registrations</p>
                            <p className="text-sm text-muted-foreground">Enable or disable account registrations</p>
                        </div>
                        <Toggle 
                            enabled={settings.allowRegistrations}
                            onToggle={() => handleToggle('allowRegistrations')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Require Caterer Approval</p>
                            <p className="text-sm text-muted-foreground">Manually approve caterer registrations</p>
                        </div>
                        <Toggle 
                            enabled={settings.requireCatererApproval}
                            onToggle={() => handleToggle('requireCatererApproval')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Maintenance Mode</p>
                            <p className="text-sm text-muted-foreground">Put the platform in maintenance mode</p>
                        </div>
                        <Toggle 
                            enabled={settings.maintenanceMode}
                            onToggle={() => handleToggle('maintenanceMode')}
                        />
                    </div>
                </div>
            </div>

            {/* Commission Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="text-sky-600" size={22} />
                    <h2 className="text-xl font-semibold text-foreground">Commission Settings</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Commission Percentage
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={settings.commissionPercentage}
                                onChange={(e) => handleChange('commissionPercentage', Number(e.target.value))}
                                className="w-32 h-9 px-3 bg-white border border-slate-200 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                                min="0"
                                max="100"
                            />
                            <span className="text-muted-foreground">%</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Platform commission on each transaction
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Minimum Commission
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">₹</span>
                            <input
                                type="number"
                                value={settings.minimumCommission}
                                onChange={(e) => handleChange('minimumCommission', Number(e.target.value))}
                                className="w-32 h-9 px-3 bg-white border border-slate-200 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                                min="0"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Minimum commission amount per transaction
                        </p>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Shield className="text-sky-600" size={22} />
                    <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Enforce Strong Password</p>
                            <p className="text-sm text-muted-foreground">Require strong passwords for all users</p>
                        </div>
                        <Toggle 
                            enabled={settings.enforceStrongPassword}
                            onToggle={() => handleToggle('enforceStrongPassword')}
                        />
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-foreground">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">Enable 2FA for admin accounts</p>
                        </div>
                        <Toggle 
                            enabled={settings.twoFactorAuth}
                            onToggle={() => handleToggle('twoFactorAuth')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Session Timeout (minutes)
                        </label>
                        <input
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => handleChange('sessionTimeout', Number(e.target.value))}
                            className="w-32 h-9 px-3 bg-white border border-slate-200 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                            min="5"
                            max="120"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Automatically log out inactive users
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
