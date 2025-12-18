import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Header() {
  const { user, setUsername } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.username || '');

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== user?.username) {
      setUsername(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditName(user?.username || '');
      setIsEditing(false);
    }
  };

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
            <div
              className="flex items-center gap-2 ml-4 px-3 py-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                if (!isEditing) {
                  setEditName(user.username);
                  setIsEditing(true);
                }
              }}
              title="Click to change name"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.username[0].toUpperCase()}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  className="bg-gray-900 text-white text-sm px-2 py-1 rounded w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  maxLength={20}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm hidden sm:block">{user.username}</span>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
