import { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';
import AuthShell from './AuthShell';

const inputClass =
  'w-full pl-12 pr-4 py-3 bg-white border border-line rounded-xl text-ink placeholder-gray-400 focus:ring-2 focus:ring-forest-500 focus:border-forest-500';

function LoginPage({ onNavigate, onLogin, notice }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.login(formData);
      authUtils.setToken(response.access_token);
      authUtils.setUser(formData.username);
      onLogin(response.access_token, formData.username);
      onNavigate('dashboard');
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

  return (
    <AuthShell
      headline="A week full of good things."
      tagline="Bring your favourite flavours to the table."
      eyebrow="Your kitchen starts here"
      title="Welcome back"
      subtitle="Sign in to keep your preferences and weekly menus together."
    >
      {notice && (
        <div className="mb-6 p-4 bg-forest-50 border border-forest-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-forest-700" />
          <span className="text-forest-800 text-sm">{notice}</span>
        </div>
      )}
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
              placeholder="Your username"
              className={inputClass}
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Your password"
              className={inputClass + ' pr-12'}
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
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
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
        {loading && (
          <p className="text-center text-xs text-muted">
            The first sign-in after a quiet spell can take up to a minute while the server wakes up.
          </p>
        )}
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center text-muted">
        New to Rasoi Genie?{' '}
        <button
          onClick={() => onNavigate('signup')}
          className="text-forest-700 font-semibold hover:text-forest-900"
        >
          Create an account
        </button>
      </div>
    </AuthShell>
  );
}

export default LoginPage;
