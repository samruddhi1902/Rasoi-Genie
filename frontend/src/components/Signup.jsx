import { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';
import AuthShell from './AuthShell';

const inputClass =
  'w-full pl-12 pr-12 py-3 bg-white border border-line rounded-xl text-ink placeholder-gray-400 focus:ring-2 focus:ring-forest-500 focus:border-forest-500';

function SignupPage({ onNavigate }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validations, setValidations] = useState({ username: false, email: false, password: false });

  useEffect(() => {
    setValidations({
      username: authUtils.validateUsername(formData.username),
      email: authUtils.validateEmail(formData.email),
      password: authUtils.validatePassword(formData.password),
    });
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validations.username || !validations.email || !validations.password) {
      setError('Please fill all fields correctly');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.register(formData);
      onNavigate('login', { justRegistered: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const Tick = ({ ok }) =>
    ok ? <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-500" /> : null;

  return (
    <AuthShell
      headline="Never wonder what to cook again."
      tagline="Weekly menus, recipes and grocery lists made for your kitchen."
      eyebrow="Join Rasoi Genie"
      title="Create your account"
      subtitle="It takes less than a minute. Then tell us what your family likes to eat."
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-ink mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              className={inputClass}
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
            <Tick ok={validations.username} />
          </div>
          <p className="text-xs text-muted mt-1">At least 3 characters</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className={inputClass}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
            <Tick ok={validations.email} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="At least 6 characters"
              className={inputClass}
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest-700 text-white py-3.5 rounded-xl font-semibold hover:bg-forest-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center text-muted">
        Already have an account?{' '}
        <button
          onClick={() => onNavigate('login')}
          className="text-forest-700 font-semibold hover:text-forest-900"
        >
          Sign in
        </button>
      </div>
    </AuthShell>
  );
}

export default SignupPage;
