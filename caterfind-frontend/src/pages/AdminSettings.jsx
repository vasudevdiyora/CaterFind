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
                enabled ? 'bg-primary' : 'bg-secondary'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage platform configuration and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Save size={18} />
                    <span>Save Changes</span>
                </button>
            </div>

            {saved && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg p-4">
                    Settings saved successfully!
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
                    Loading settings...
                </div>
            )}

            {/* Notification Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Bell className="text-primary" size={24} />
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
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Globe className="text-primary" size={24} />
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
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="text-primary" size={24} />
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
                                className="w-32 px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                                className="w-32 px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Shield className="text-primary" size={24} />
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
                            className="w-32 px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
