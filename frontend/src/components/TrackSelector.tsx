import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Track {
  id: string;
  name: string;
  text: string;
  language: string;
  difficulty: string;
}

interface TrackSelectorProps {
  onSelect: (trackId: string) => void;
  onClose: () => void;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ar: 'Arabic',
  pt: 'Portuguese',
  it: 'Italian',
  ja: 'Japanese',
  zh: 'Chinese',
  code: 'Code',
};

export default function TrackSelector({ onSelect, onClose }: TrackSelectorProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  useEffect(() => {
    loadTracks();
  }, [selectedLanguage]);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLanguage !== 'all') {
        params.append('language', selectedLanguage);
      }
      params.append('limit', '50');

      const response = await api.get<{ tracks: Track[] }>(`/tracks?${params}`);
      setTracks(response.data.tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomTrack = async () => {
    try {
      const params = selectedLanguage !== 'all' ? `?language=${selectedLanguage}` : '';
      const response = await api.get<Track>(`/tracks/random${params}`);
      onSelect(response.data.id);
    } catch (error) {
      console.error('Failed to get random track:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Select Track</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-700 flex items-center gap-4">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Languages</option>
            {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRandomTrack}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold transition-colors"
          >
            Random Track
          </button>
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading tracks...</div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No tracks found</div>
          ) : (
            <div className="grid gap-3">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelect(track.id)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{track.name}</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {LANGUAGE_NAMES[track.language] || track.language}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          track.difficulty === 'easy'
                            ? 'bg-green-500/20 text-green-400'
                            : track.difficulty === 'hard'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {track.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {track.text.substring(0, 100)}...
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    {track.text.split(/\s+/).length} words
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
