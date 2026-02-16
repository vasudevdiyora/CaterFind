import { useState } from 'react';
import { authAPI } from '../services/api';
import { UtensilsCrossed, Mail, Lock, Store, ArrowRight, Info, ArrowLeft, Eye, EyeOff } from 'lucide-react';


/**
 * Register Page Component (Tailwind v4 + Loveable Style)
 */
function Register({ onLogin, onSwitchToLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


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

        setLoading(true);

        try {
            const response = await authAPI.register(email, password, businessName);

            if (response.success) {
                onLogin(response);
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mt-6">Join CaterFind</h1>
                    <p className="text-muted-foreground text-lg">Create your business profile</p>
                </div>

                {/* Card */}
                <div className="bg-card border rounded-2xl p-8 shadow-2xl shadow-background/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Business Name Field */}
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
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
