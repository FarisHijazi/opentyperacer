import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Room from './pages/Room';
import CreateRoom from './pages/CreateRoom';
import CreateTrack from './pages/CreateTrack';
import Tracks from './pages/Tracks';
import { useAuthStore } from './store/authStore';

function App() {
  const { initGuest, user, loading } = useAuthStore();

  useEffect(() => {
    if (!user && !loading) {
      initGuest();
    }
  }, [user, loading, initGuest]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/create-track" element={<CreateTrack />} />
        <Route path="/tracks" element={<Tracks />} />
      </Routes>
    </div>
  );
}

export default App;
