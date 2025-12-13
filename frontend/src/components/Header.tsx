import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
            TR
          </div>
          <span className="font-bold text-xl hidden sm:block">OpenTypeRacer</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to="/tracks"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Tracks
          </Link>
          <Link
            to="/create-track"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Create Track
          </Link>
          {user && (
            <div className="flex items-center gap-2 ml-4 px-3 py-2 bg-gray-800 rounded-lg">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-sm hidden sm:block">{user.username}</span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
