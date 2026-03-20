import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoadingOtp(true);

    try {
      const data = await authAPI.requestForgotPasswordOtp(email);
      setMessage(data.message || 'If your email exists, OTP has been sent.');
      setOtpRequested(true);
    } catch (err) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoadingReset(true);

    try {
      await authAPI.verifyForgotPasswordOtp(email, otp);
      const data = await authAPI.resetPasswordWithOtp(email, otp, newPassword);
      setMessage(data.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login/client'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Forgot Password</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email to receive OTP on Gmail, then set a new password.
        </p>

        <form className="space-y-4" onSubmit={handleRequestOtp}>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Email</label>
            <input
              type="email"
              className="w-full h-11 rounded-xl border bg-input px-4 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loadingOtp}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            {loadingOtp ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        {otpRequested && (
          <form className="space-y-4 mt-6" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">OTP</label>
              <input
                type="text"
                className="w-full h-11 rounded-xl border bg-input px-4 text-sm"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">New Password</label>
              <input
                type="password"
                className="w-full h-11 rounded-xl border bg-input px-4 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full h-11 rounded-xl border bg-input px-4 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingReset}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              {loadingReset ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 text-sm text-muted-foreground">
          Remembered password?{' '}
          <Link to="/login/client" className="text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
