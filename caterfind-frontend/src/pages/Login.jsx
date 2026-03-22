import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { UtensilsCrossed, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const getRoleFromQuery = () => {
        const params = new URLSearchParams(location.search);
        const roleValue = params.get('role')?.toUpperCase();
        return ['CLIENT', 'CATERER', 'ADMIN'].includes(roleValue) ? roleValue : null;
    };

    const [role, setRole] = useState(getRoleFromQuery());

    useEffect(() => {
        setRole(getRoleFromQuery());
    }, [location.search]);

    useEffect(() => {
        if (!role) {
            navigate('/', { replace: true });
        }
    }, [role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);

            if (role && response?.role && response.role.toUpperCase() !== role) {
                setError(`This account is not allowed in the ${role.toLowerCase()} login.`);
                return;
            }

            onLogin(response);
            // Navigation is handled by App.jsx redirects
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const getPageInfo = () => {
        switch (role) {
            case 'ADMIN':
                return { title: 'Admin Panel', subtitle: 'Access the control center' };
            case 'CATERER':
                return { title: 'Caterer Dashboard', subtitle: 'Manage your business' };
            default:
                return { title: 'Welcome Back', subtitle: 'Find the perfect caterer for your event' };
        }
    };

    const { title, subtitle } = getPageInfo();

    return (
        <div className="login-container">
            <div className="login-card">
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
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="form-input with-icon"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="form-input with-icon"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="text-right text-sm">
                        <Link to="/forgot-password" className="text-sky-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    {error && (
                        <div className="error-alert">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-button w-full !text-base !py-3"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Login <ArrowRight size={20} className="ml-2" />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to={`/register?role=${role.toLowerCase()}`} className="font-semibold text-sky-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
