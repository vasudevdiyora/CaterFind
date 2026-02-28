import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save } from 'lucide-react';

const ClientProfile = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: user?.name || user?.email?.split('@')[0] || 'Guest User',
        email: user?.email || '',
        phone: user?.phone || '',
        location: 'Delhi NCR',
        memberSince: '2026-01-15',
    });

    const handleSave = () => {
        // Validate required fields
        if (!profile.name.trim()) {
            alert('Full Name is required');
            return;
        }
        if (!profile.phone.trim()) {
            alert('Phone Number is required');
            return;
        }
        if (!profile.location.trim()) {
            alert('Location is required');
            return;
        }
        // TODO: Save profile to API
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="pb-20 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your account information</p>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-primary/20 to-accent/10 p-8 text-center relative">
                    <div className="w-24 h-24 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4 border-4 border-card">
                        <User size={48} className="text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                        {profile.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">Client</p>
                    
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="absolute top-4 right-4 p-2 bg-card rounded-lg hover:bg-secondary transition-colors"
                    >
                        {isEditing ? (
                            <Save size={18} className="text-primary" />
                        ) : (
                            <Edit2 size={18} className="text-muted-foreground" />
                        )}
                    </button>
                </div>

                {/* Profile Details */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <ProfileField
                            icon={User}
                            label="Full Name"
                            value={profile.name}
                            isEditing={isEditing}
                            onChange={(value) => handleChange('name', value)}
                            required
                        />
                        
                        <ProfileField
                            icon={Mail}
                            label="Email"
                            value={profile.email}
                            isEditing={false}
                            readOnly
                        />
                        
                        <ProfileField
                            icon={Phone}
                            label="Phone Number"
                            value={profile.phone}
                            isEditing={isEditing}
                            onChange={(value) => handleChange('phone', value)}
                            placeholder="Enter phone number"
                            required
                        />
                        
                        <ProfileField
                            icon={MapPin}
                            label="Location"
                            value={profile.location}
                            isEditing={isEditing}
                            onChange={(value) => handleChange('location', value)}
                            required
                        />
                        
                        <ProfileField
                            icon={Calendar}
                            label="Member Since"
                            value={new Date(profile.memberSince).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                            isEditing={false}
                            readOnly
                        />
                    </div>

                    {/* Account Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">0</div>
                            <div className="text-xs text-muted-foreground mt-1">Trials Booked</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">0</div>
                            <div className="text-xs text-muted-foreground mt-1">Events Planned</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">0</div>
                            <div className="text-xs text-muted-foreground mt-1">Reviews Given</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Actions */}
            <div className="mt-6 space-y-3">
                <button className="w-full px-4 py-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors text-left">
                    <span className="text-foreground font-medium">Saved Caterers</span>
                    <p className="text-xs text-muted-foreground mt-1">View your favorite caterers</p>
                </button>
                
                <button className="w-full px-4 py-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors text-left">
                    <span className="text-foreground font-medium">Preferences</span>
                    <p className="text-xs text-muted-foreground mt-1">Set dietary and cuisine preferences</p>
                </button>
                
                <button className="w-full px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors text-left">
                    <span className="text-destructive font-medium">Delete Account</span>
                    <p className="text-xs text-destructive/70 mt-1">Permanently delete your account</p>
                </button>
            </div>
        </div>
    );
};

const ProfileField = ({ icon: Icon, label, value, isEditing, onChange, placeholder, readOnly, optional, required }) => {
    return (
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                    {label} 
                    {required && <span className="text-red-500">*</span>}
                    {optional && <span className="text-muted-foreground/70">(optional)</span>}
                </label>
                {isEditing && !readOnly ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                ) : (
                    <div className="text-sm text-foreground">
                        {value || <span className="text-muted-foreground italic">Not set</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientProfile;
