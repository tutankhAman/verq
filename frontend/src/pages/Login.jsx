import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Spline from '@splinetool/react-spline';
import { signInWithGoogle, signInWithGitHub, login } from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      console.log('Signed in user:', user);
      
      // Verify token is stored
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Navigate only after successful token storage
      navigate('/');
    } catch (error) {
      console.error('Error during Google sign in:', error);
      setError(error.message || "Failed to sign in with Google");
      // Clear any partial state
      localStorage.removeItem('firebaseToken');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGitHub();
      console.log('Signed in user:', user);
      navigate('/');
    } catch (error) {
      if (error.message.includes('already registered with a different authentication method')) {
        setError("This email is already registered with a different authentication method. Please use the original method to sign in.");
      } else {
        setError(error.message || "Failed to sign in with GitHub");
      }
      console.error('Error during GitHub sign in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Spline background */}
      <div className="absolute inset-0 z-0">
        <Spline scene="https://prod.spline.design/7Tb0aKWGPlARtmku/scene.splinecode" />
      </div>
      
      {/* Overlay to ensure form is visible */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>
      
      <div className="absolute inset-0 flex items-center justify-center z-20 px-4 sm:px-6">
        <div className="glass-card p-4 sm:p-6 md:p-8 w-full max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">Login</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-[0.5rem] bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-200 mb-1">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-[0.5rem] bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm sm:text-base"
                placeholder="Enter your password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-[63%] -translate-y-[37%] text-gray-400 hover:text-white transition-colors duration-200 bg-white/5 p-1 rounded-lg"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-purple-600/75 hover:bg-transparent text-white font-medium rounded-[0.5rem] transition duration-200 mx-auto mt-6 sm:mt-10 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-[#020202]/20 text-gray-400">Or continue with</span>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-[0.5rem] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Sign in with Google
              </button>
              <button
                type="button"
                onClick={handleGitHubSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-[0.5rem] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  />
                </svg>
                Sign in with GitHub
              </button>
            </div>
          </form>
          <p className="mt-4 text-center text-gray-400 text-xs sm:text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-purple-500 hover:text-purple-400 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(2, 2, 2, 0.2);
          backdrop-filter: blur(50px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Login; 