import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import Header from '../components/Header';
import RaceTrack from '../components/RaceTrack';
import TypingArea from '../components/TypingArea';
import TrackSelector from '../components/TrackSelector';
import Results from '../components/Results';

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuthStore();
  const game = useGameStore();

  const [error, setError] = useState('');
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // Connect to socket and join room
  useEffect(() => {
    if (!code || !user) return;

    socket.connect();

    const handleConnected = () => {
      socket.emit('join-room', {
        roomCode: code,
        user: {
          id: user.id,
          username: user.username,
          avatarColor: user.avatarColor,
          carColor: user.carColor,
        },
      });
    };

    const handleJoinedRoom = (data: any) => {
      game.setRoomCode(data.roomCode);
    };

    const handleRoomUpdate = (data: any) => {
      game.setStatus(data.status);
      game.setPlayers(data.players || []);
      if (data.trackId) {
        game.setTrack(data.trackId, data.trackText, null);
      }
    };

    const handleTrackSelected = (data: any) => {
      game.setTrack(data.trackId, data.trackText, data.trackName);
    };

    const handleCountdownStarted = (data: any) => {
      game.setStatus('countdown');
      game.setCountdown(data.duration);

      // Start countdown timer
      let seconds = data.duration;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = window.setInterval(() => {
        seconds--;
        game.setCountdown(seconds);
        if (seconds <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 1000);
    };

    const handleRaceStarted = (data: any) => {
      game.setStatus('racing');
      game.setStartTime(data.startTime);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };

    const handlePlayerProgress = (data: any) => {
      game.updatePlayer(data.odefinitionPlayerId, {
        progress: data.progress,
        wpm: data.wpm,
        accuracy: data.accuracy,
      });
    };

    const handlePlayerFinished = (data: any) => {
      game.updatePlayer(data.odefinitionPlayerId, {
        finished: true,
        position: data.position,
        wpm: data.wpm,
        accuracy: data.accuracy,
        finishTime: data.finishTime,
      });
    };

    const handleRaceEnded = (data: any) => {
      game.setStatus('finished');
      game.setResults(data.results);
    };

    const handleRoomReset = (data: any) => {
      game.setStatus('waiting');
      game.setPlayers(data.players);
      game.setResults([]);
      game.setStartTime(null);
    };

    const handlePlayerLeft = (data: any) => {
      game.setPlayers(data.players);
    };

    const handleError = (data: any) => {
      setError(data.message);
      setTimeout(() => setError(''), 5000);
    };

    // Register event handlers
    socket.on('connect', handleConnected);
    socket.on('joined-room', handleJoinedRoom);
    socket.on('room-update', handleRoomUpdate);
    socket.on('track-selected', handleTrackSelected);
    socket.on('countdown-started', handleCountdownStarted);
    socket.on('race-started', handleRaceStarted);
    socket.on('player-progress', handlePlayerProgress);
    socket.on('player-finished', handlePlayerFinished);
    socket.on('race-ended', handleRaceEnded);
    socket.on('room-reset', handleRoomReset);
    socket.on('player-left', handlePlayerLeft);
    socket.on('error', handleError);

    if (socket.connected) {
      handleConnected();
    }

    return () => {
      socket.emit('leave-room');
      socket.off('connect', handleConnected);
      socket.off('joined-room', handleJoinedRoom);
      socket.off('room-update', handleRoomUpdate);
      socket.off('track-selected', handleTrackSelected);
      socket.off('countdown-started', handleCountdownStarted);
      socket.off('race-started', handleRaceStarted);
      socket.off('player-progress', handlePlayerProgress);
      socket.off('player-finished', handlePlayerFinished);
      socket.off('race-ended', handleRaceEnded);
      socket.off('room-reset', handleRoomReset);
      socket.off('player-left', handlePlayerLeft);
      socket.off('error', handleError);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      game.reset();
    };
  }, [code, user]);

  const handleSelectTrack = (trackId: string) => {
    socket.emit('select-track', { trackId });
    setShowTrackSelector(false);
  };

  const handleStartRace = () => {
    socket.emit('start-race');
  };

  const handleTypingProgress = useCallback(
    (progress: number, wpm: number, accuracy: number) => {
      socket.emit('typing-progress', { progress, wpm, accuracy });
    },
    []
  );

  const handleRaceFinished = useCallback((wpm: number, accuracy: number) => {
    socket.emit('race-finished', { wpm, accuracy });
  }, []);

  const isHost = game.players[0]?.odefinitionUserId === user?.id;
  const inviteUrl = `${window.location.origin}/room/${code}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setError('Invite link copied!');
    setTimeout(() => setError(''), 2000);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-4">
        {error && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className={`px-4 py-3 rounded-lg ${error.includes('copied') ? 'bg-green-500/20 border border-green-500 text-green-400' : 'bg-red-500/20 border border-red-500 text-red-400'}`}>
              {error}
            </div>
          </div>
        )}

        {/* Room Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold">Room: {code}</h1>
                <p className="text-gray-400 text-sm">
                  {game.players.length} player{game.players.length !== 1 ? 's' : ''} •{' '}
                  <span className={game.status === 'waiting' ? 'text-green-400' : game.status === 'racing' ? 'text-yellow-400' : 'text-blue-400'}>
                    {game.status === 'waiting' ? 'Waiting' : game.status === 'countdown' ? 'Starting...' : game.status === 'racing' ? 'Racing!' : 'Finished'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Copy Invite Link
                </button>
                {isHost && game.status === 'waiting' && (
                  <>
                    <button
                      onClick={() => setShowTrackSelector(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                    >
                      Select Track
                    </button>
                    <button
                      onClick={handleStartRace}
                      disabled={!game.trackText}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-colors"
                    >
                      Start Race
                    </button>
                  </>
                )}
              </div>
            </div>

            {game.trackName && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Track: </span>
                <span className="text-white">{game.trackName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Race Track */}
        <div className="max-w-4xl mx-auto mb-6">
          <RaceTrack players={game.players} />
        </div>

        {/* Countdown */}
        {game.status === 'countdown' && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-8 text-center">
              <div className="text-6xl font-bold text-yellow-400 animate-pulse">
                {game.countdownSeconds}
              </div>
              <p className="text-yellow-400 mt-2">Get ready!</p>
            </div>
          </div>
        )}

        {/* Typing Area */}
        {(game.status === 'racing' || game.status === 'countdown') && game.trackText && (
          <div className="max-w-4xl mx-auto mb-6">
            <TypingArea
              text={game.trackText}
              disabled={game.status !== 'racing'}
              onProgress={handleTypingProgress}
              onFinish={handleRaceFinished}
            />
          </div>
        )}

        {/* Results */}
        {game.status === 'finished' && game.results.length > 0 && (
          <div className="max-w-4xl mx-auto mb-6">
            <Results results={game.results} />
          </div>
        )}

        {/* Waiting State */}
        {game.status === 'waiting' && !game.trackText && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">
                {isHost
                  ? 'Select a track to start the race!'
                  : 'Waiting for the host to select a track...'}
              </p>
            </div>
          </div>
        )}

        {game.status === 'waiting' && game.trackText && !isHost && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400">Waiting for the host to start the race...</p>
            </div>
          </div>
        )}

        {/* Track Selector Modal */}
        {showTrackSelector && (
          <TrackSelector
            onSelect={handleSelectTrack}
            onClose={() => setShowTrackSelector(false)}
          />
        )}
      </main>
    </div>
  );
}
