import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ArrowLeft, Mail, Lock, KeyRound, AlertCircle, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import '../styles/Login.css'; // Reusing login styles

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const data = await authAPI.requestForgotPasswordOtp(email);
            setMessage(data.message || 'OTP sent to your email.');
            setStep(2);
        } catch (err) {
            setError(err.message || 'Failed to request OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            await authAPI.verifyForgotPasswordOtp(email, otp);
            const data = await authAPI.resetPasswordWithOtp(email, otp, newPassword);
            setMessage(data.message || 'Password reset successful!');
            setTimeout(() => navigate('/login?role=client'), 2000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. Check OTP and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <Link to="/login?role=client" className="back-button">
                    <ArrowLeft size={16} /> Back to Login
                </Link>

                <div className="login-header">
                    <div className="logo-icon bg-sky-500">
                        <KeyRound size={24} />
                    </div>
                    <h1>Reset Password</h1>
                    <p>{step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}</p>
                </div>

                {message && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-center gap-3 text-sm mb-6">
                        <CheckCircle size={18} />
                        <span>{message}</span>
                    </div>
                )}

                {error && (
                    <div className="error-alert mb-6">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
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
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button type="submit" className="primary-button w-full !text-base !py-3" disabled={loading}>
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>Send OTP <ArrowRight size={20} className="ml-2" /></>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="form-group">
                            <label className="flex justify-between">
                                <span>OTP Code</span>
                                <button type="button" onClick={() => setStep(1)} className="text-xs text-sky-600 hover:underline">Change Email</button>
                            </label>
                            <input
                                type="text"
                                className="form-input text-center tracking-widest text-lg font-mono"
                                placeholder="000000"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    className="form-input with-icon"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    className="form-input with-icon"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="primary-button w-full !text-base !py-3" disabled={loading}>
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login?role=client" className="font-semibold text-sky-600 hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

