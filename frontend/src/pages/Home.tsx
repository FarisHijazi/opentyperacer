import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/Header';

interface Room {
  id: string;
  code: string;
  name: string;
  maxPlayers: number;
  playerCount: number;
  status: string;
  host: { username: string } | null;
}

export default function Home() {
  const navigate = useNavigate();
  useAuthStore(); // For initialization side effects
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await api.get<Room[]>('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/room/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            OpenTypeRacer
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Challenge your friends to a typing race!
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate('/create-room')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Create Room
            </button>
            <button
              onClick={() => navigate('/tracks')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              Browse Tracks
            </button>
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoinRoom} className="flex gap-2 justify-center max-w-md mx-auto">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 uppercase"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              Join
            </button>
          </form>
        </div>

        {/* Public Rooms */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-green-400">●</span> Public Rooms
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-gray-400 mb-4">No public rooms available</p>
              <button
                onClick={() => navigate('/create-room')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Create the first room!
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => navigate(`/room/${room.code}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{room.name}</h3>
                      <p className="text-gray-400 text-sm">
                        Hosted by {room.host?.username || 'Anonymous'} • Code: {room.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className={room.status === 'waiting' ? 'text-green-400' : 'text-yellow-400'}>
                          {room.status === 'waiting' ? 'Waiting' : room.status === 'racing' ? 'Racing' : room.status}
                        </span>
                      </div>
                      <div className="text-gray-400">
                        {room.playerCount}/{room.maxPlayers} players
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🏎️</div>
              <h3 className="font-bold mb-2">Real-time Racing</h3>
              <p className="text-gray-400 text-sm">
                Watch cars race as you type! See your progress against opponents in real-time.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="font-bold mb-2">Multi-language</h3>
              <p className="text-gray-400 text-sm">
                Practice typing in English, Spanish, French, German, Arabic, and more!
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="font-bold mb-2">Custom Tracks</h3>
              <p className="text-gray-400 text-sm">
                Create your own race tracks with custom text and share them with friends.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
