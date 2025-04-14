import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function Footer() {
  const { darkMode } = useTheme();

  return (
    <footer className={`w-full py-8 mt-16 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'} backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="group">
              <h2 className="font-lato font-bold text-2xl text-gray-900 dark:text-gray-100 group-hover:text-pink-500 dark:group-hover:text-pink-400">VerQ</h2>
            </Link>
            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your AI-powered interview preparation platform. Practice, improve, and excel in your interviews.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`font-montserrat font-semibold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/interview" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>
                  Interview
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className={`font-montserrat font-semibold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Contact</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="mailto:support@verq.com" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'}`}>
                  verqofficals@gmail.com
                </a>
              </li>
            
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`mt-8 pt-8 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} VerQ. All rights reserved.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 