import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('Full name is required');
        }
        await signUp(email, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gray-50 to-gray-100 flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="w-full max-w-md animate-in">
        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-strong border border-gray-200 p-8 sm:p-10">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900">Artiya</h1>
                <p className="text-sm text-gray-500 -mt-1">Management System</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
              Modern agricultural management system for farmers and businesses
            </p>
          </header>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1.5 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 touch-target ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LogIn size={16} className="inline mr-2" />
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 touch-target ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserPlus size={16} className="inline mr-2" />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-in">
                <label className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input py-3"
                  placeholder="Enter your full name"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input py-3"
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input py-3"
                placeholder={isLogin ? "Enter your password" : "Create a strong password (min 6 chars)"}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 px-6 text-base font-semibold rounded-xl touch-target-large disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-95 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{isLogin ? 'Sign In to Account' : 'Create New Account'}</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors duration-200"
            >
              {isLogin ? 'Create one now' : 'Sign in instead'}
            </button>
          </p>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              By continuing, you agree to our terms of service and privacy policy.
              <br />
              <span className="text-gray-400">Secure authentication powered by Supabase</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
