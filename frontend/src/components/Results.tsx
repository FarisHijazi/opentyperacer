interface RaceResult {
  odefinitionUserId: string;
  username: string;
  position: number | null;
  wpm: number;
  accuracy: number;
  finishTime: number | null;
}

interface ResultsProps {
  results: RaceResult[];
}

export default function Results({ results }: ResultsProps) {
  const formatTime = (ms: number | null) => {
    if (!ms) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMedal = (position: number | null) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-bold text-center">Race Results</h2>
      </div>

      <div className="p-4">
        {/* Podium for top 3 */}
        {results.length >= 1 && (
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* Second place */}
            {results[1] && (
              <div className="text-center">
                <div className="text-4xl mb-2">🥈</div>
                <div className="bg-gray-700 px-4 py-6 rounded-t-lg w-24">
                  <div className="font-bold truncate">{results[1].username}</div>
                  <div className="text-green-400 font-bold">{results[1].wpm} WPM</div>
                </div>
                <div className="bg-gray-600 h-16 w-24 rounded-b-lg flex items-center justify-center text-2xl font-bold">
                  2
                </div>
              </div>
            )}

            {/* First place */}
            {results[0] && (
              <div className="text-center">
                <div className="text-5xl mb-2">🥇</div>
                <div className="bg-yellow-600/30 px-4 py-8 rounded-t-lg w-28 border border-yellow-500/50">
                  <div className="font-bold truncate text-lg">{results[0].username}</div>
                  <div className="text-green-400 font-bold text-xl">{results[0].wpm} WPM</div>
                </div>
                <div className="bg-yellow-600/50 h-20 w-28 rounded-b-lg flex items-center justify-center text-3xl font-bold border-x border-b border-yellow-500/50">
                  1
                </div>
              </div>
            )}

            {/* Third place */}
            {results[2] && (
              <div className="text-center">
                <div className="text-4xl mb-2">🥉</div>
                <div className="bg-gray-700 px-4 py-4 rounded-t-lg w-24">
                  <div className="font-bold truncate">{results[2].username}</div>
                  <div className="text-green-400 font-bold">{results[2].wpm} WPM</div>
                </div>
                <div className="bg-gray-600 h-12 w-24 rounded-b-lg flex items-center justify-center text-2xl font-bold">
                  3
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full results table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="text-left py-2 px-4">Rank</th>
                <th className="text-left py-2 px-4">Racer</th>
                <th className="text-right py-2 px-4">WPM</th>
                <th className="text-right py-2 px-4">Accuracy</th>
                <th className="text-right py-2 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {results.map((result, index) => (
                <tr
                  key={result.odefinitionUserId}
                  className={index === 0 ? 'bg-yellow-500/10' : ''}
                >
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      {getMedal(result.position)}
                      <span className="font-bold">#{result.position || '-'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium">{result.username}</td>
                  <td className="py-3 px-4 text-right text-green-400 font-bold">
                    {result.wpm}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-400">
                    {result.accuracy}%
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400">
                    {formatTime(result.finishTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          Next race starting soon...
        </div>
      </div>
    </div>
  );
}
