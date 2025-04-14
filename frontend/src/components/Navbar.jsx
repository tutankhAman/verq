import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../config/firebase';
import profileImage from '../assets/images/profile.png';
import { logout } from '../services/authService';
import { api } from '../services/api';
import { onAuthStateChanged } from 'firebase/auth';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewport, setViewport] = useState('desktop');
  const [userData, setUserData] = useState(null);
  const { darkMode, toggleTheme } = useTheme();
  const profileDropdownRef = useRef(null);
  
  // Check viewport size
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewport('mobile');
      } else if (width < 1024) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const token = await user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        
        try {
          // Try to get user profile from backend
          const userData = await api.getUserProfile();
          setUserData(userData.data.user);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Use Firebase user data as fallback
          setUserData({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            providerData: user.providerData
          });
        }
      } else {
        // User is signed out
        setUserData(null);
        localStorage.removeItem('firebaseToken');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownRef]);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (profileOpen) setProfileOpen(false);
  };
  
  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setProfileOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Profile dropdown component
  const ProfileDropdown = () => (
    <div className={`absolute right-0 top-full mt-2 p-5 rounded-xl shadow-lg backdrop-blur-md border border-gray-700 w-[260px] ${profileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} bg-gray-900/90`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-3">
          <img 
            src={userData?.photoURL || profileImage} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-montserrat font-semibold text-lg text-gray-100 truncate">{userData?.displayName || 'Guest'}</h3>
            <p className="text-sm text-gray-400 truncate" title={userData?.email || ''}>{userData?.email || ''}</p>
            {userData?.providerData?.[0]?.providerId === 'github.com' && (
              <a 
                href={`https://github.com/${userData?.providerData?.[0]?.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  />
                </svg>
                <span className="truncate">View GitHub Profile</span>
              </a>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <Link 
            to="/my-interviews"
            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg"
            onClick={() => setProfileOpen(false)}
          >
            My Interviews
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile menu component
  const MobileMenu = () => (
    <div className={`absolute top-[70px] right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <ul className="flex flex-col space-y-3 font-montserrat font-semibold text-sm">
        <li>
          <Link 
            to="/" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
        </li>
        {/* <li>
          <Link 
            to="/dashboard" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/dashboard') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
        </li> */}
        <li>
          <Link 
            to="/interview" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/interview') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Take Interview
          </Link>
        </li>
        <li>
          <Link 
            to="/my-interviews" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/my-interviews') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            My Interviews
          </Link>
        </li>
      </ul>
    </div>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full mt-4">
      <nav className={`flex items-center px-4 h-[60px] relative
        ${viewport !== 'desktop'
          ? 'w-[95vw] bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full shadow-sm border border-gray-200 dark:border-gray-700 justify-between' 
          : 'w-[70vw] bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full shadow-sm border border-gray-200 dark:border-gray-700 justify-between'
        }`}>
        {/* Left section - Logo */}
        <div className="flex flex-col justify-center">
          <Link to="/" className="group">
            <h1 className="font-zen font-bold text-xl sm:text-2xl text-gray-900 dark:text-gray-100 group-hover:text-pink-500 dark:group-hover:text-pink-400">VerQ</h1>
          </Link>
        </div>
        
        {/* Middle section - Navigation pills - Centered with absolute positioning */}
        {viewport !== 'mobile' && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full shadow-sm inline-flex items-center border border-gray-300 dark:border-gray-700 p-0.5">
              <ul className="flex font-chakra font-semibold text-xs sm:text-sm items-center">
                <li className="flex items-center">
                  <Link 
                    to="/" 
                    className={`inline-block px-3 sm:px-4 py-2 rounded-full ${
                      isActive('/') 
                        ? 'bg-white dark:bg-black text-gray-900 dark:text-heading backdrop-blur-md' 
                        : 'text-gray-800 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/70'
                    }`}
                  >
                    Home
                  </Link>
                </li>
                {/* <li className="flex items-center">
                  <Link 
                    to="/dashboard" 
                    className={`inline-block px-3 sm:px-4 py-2 rounded-full ${
                      isActive('/dashboard') 
                        ? 'bg-white dark:bg-black text-gray-900 dark:text-heading backdrop-blur-sm' 
                        : 'text-gray-800 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/70'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li> */}
                <li className="flex items-center">
                  <Link 
                    to="/interview" 
                    className={`inline-block px-3 sm:px-4 py-2 rounded-full ${
                      isActive('/interview') 
                        ? 'bg-white dark:bg-black text-gray-900 dark:text-heading backdrop-blur-sm' 
                        : 'text-gray-800 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/70'
                    }`}
                  >
                    Take Interview
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Right section - Profile and Mobile Menu */}
        <div className="flex items-center space-x-2">
          {/* Profile button - Always visible */}
          <div className="relative" ref={profileDropdownRef}>
            <button 
              onClick={toggleProfile}
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
            <ProfileDropdown />
          </div>

          {/* Mobile menu button - Only visible on mobile */}
          {viewport === 'mobile' && (
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Mobile Menu */}
        {viewport === 'mobile' && <MobileMenu />}
      </nav>
    </div>
  );
}

export default Navbar; 