import { useState } from 'react';
import { authAPI } from '../services/api';
import { UtensilsCrossed, Mail, Lock, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Login Page Component (Tailwind v4 + Loveable Style)
 */
function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);

            if (response.success) {
                if (response.role === 'CATERER') {
                    onLogin(response);
                } else {
                    setError('Client dashboard is not implemented. This system is for caterers only.');
                }
            } else {
                setError(response.message || 'Invalid email or password');
            }
        } catch (err) {
            setError('Login failed. Please check your credentials.');
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
                    <h1 className="text-4xl font-extrabold tracking-tight mt-6">CaterFind</h1>
                    <p className="text-muted-foreground text-lg">Catering Business Management</p>
                </div>

                {/* Card */}
                <div className="bg-card border rounded-2xl p-8 shadow-2xl shadow-background/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 hover:border-primary/50"
                                placeholder="admin@caterfind.com"
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
                            <input
                                type="password"
                                className="flex h-12 w-full rounded-xl border bg-input px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-border/50 hover:border-primary/50"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
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
                            {loading ? 'Logging in...' : 'Login to Dashboard'}
                            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="text-center space-y-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 inline-block text-left max-w-xs mx-auto">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info className="h-3 w-3" />
                            Demo Account
                        </p>
                        <p className="text-sm text-foreground">
                            <strong>Email:</strong> admin@caterfind.com
                        </p>
                        <p className="text-sm text-foreground">
                            <strong>Pass:</strong> admin123
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © 2026 CaterFind Business. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
