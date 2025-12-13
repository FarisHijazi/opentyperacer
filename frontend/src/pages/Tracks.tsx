import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Header from '../components/Header';

interface Track {
  id: string;
  name: string;
  description: string | null;
  text: string;
  language: string;
  difficulty: string;
  creator: { username: string } | null;
  _count: { races: number };
}

interface Language {
  code: string;
  name: string;
  count: number;
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

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
};

export default function Tracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    loadTracks();
  }, [selectedLanguage, selectedDifficulty, search]);

  const loadLanguages = async () => {
    try {
      const response = await api.get<Language[]>('/tracks/languages');
      setLanguages(response.data);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const loadTracks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLanguage !== 'all') params.append('language', selectedLanguage);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (search) params.append('search', search);

      const response = await api.get<{ tracks: Track[] }>(`/tracks?${params}`);
      setTracks(response.data.tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Race Tracks</h1>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracks..."
              className="flex-1 min-w-[200px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Languages</option>
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.count})
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading tracks...</div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-gray-400">No tracks found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{track.name}</h3>
                      {track.description && (
                        <p className="text-gray-400 text-sm">{track.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {LANGUAGE_NAMES[track.language] || track.language}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${DIFFICULTY_COLORS[track.difficulty]}`}>
                        {track.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    "{track.text.substring(0, 150)}..."
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      By {track.creator?.username || 'Anonymous'} • {track._count.races} races
                    </span>
                    <span>{track.text.split(/\s+/).length} words</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
