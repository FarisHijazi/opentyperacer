interface Player {
  id: string;
  odefinitionUserId: string;
  username: string;
  avatarColor: string;
  carColor: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  position: number | null;
}

interface RaceTrackProps {
  players: Player[];
}

export default function RaceTrack({ players }: RaceTrackProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="font-bold text-sm">Race Track</span>
        <span className="text-gray-400 text-sm">{players.length} racers</span>
      </div>

      <div className="relative">
        {/* Track background with finish line */}
        <div className="absolute right-8 top-0 bottom-0 w-4 finish-line opacity-50"></div>

        {players.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Waiting for players...
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="relative h-16 race-track-lane"
              >
                {/* Lane background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/30 to-gray-600/30"></div>

                {/* Lane markers */}
                <div className="absolute inset-0 flex items-center">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r border-dashed border-gray-600/30 h-1"
                    />
                  ))}
                </div>

                {/* Player info */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[80px]">
                    {player.username}
                  </span>
                </div>

                {/* Car */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out car-animate"
                  style={{ left: `calc(100px + ${player.progress}% * (100% - 150px) / 100)` }}
                >
                  <Car color={player.carColor} finished={player.finished} />
                </div>

                {/* Stats */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-right">
                  <div className="text-xs">
                    {player.finished ? (
                      <span className="text-green-400 font-bold">
                        #{player.position} - {player.wpm} WPM
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {player.wpm > 0 ? `${player.wpm} WPM` : '---'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {player.progress.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Car({ color, finished }: { color: string; finished: boolean }) {
  return (
    <div className={`relative ${finished ? '' : 'animate-car-bounce'}`}>
      <svg
        width="40"
        height="24"
        viewBox="0 0 40 24"
        className="drop-shadow-lg"
      >
        {/* Car body */}
        <rect x="5" y="8" width="30" height="10" rx="2" fill={color} />
        <rect x="10" y="4" width="18" height="8" rx="2" fill={color} />

        {/* Windows */}
        <rect x="12" y="5" width="14" height="5" rx="1" fill="#93C5FD" />

        {/* Wheels */}
        <circle cx="12" cy="18" r="4" fill="#1F2937" />
        <circle cx="28" cy="18" r="4" fill="#1F2937" />
        <circle cx="12" cy="18" r="2" fill="#6B7280" />
        <circle cx="28" cy="18" r="2" fill="#6B7280" />

        {/* Headlights */}
        <rect x="33" y="10" width="3" height="2" rx="1" fill="#FEF08A" />
        <rect x="33" y="14" width="3" height="2" rx="1" fill="#FEF08A" />

        {/* Finish flag if finished */}
        {finished && (
          <g transform="translate(18, -4)">
            <rect x="0" y="0" width="2" height="8" fill="#6B7280" />
            <rect x="2" y="0" width="8" height="6" fill="white" />
            <rect x="2" y="0" width="4" height="3" fill="black" />
            <rect x="6" y="3" width="4" height="3" fill="black" />
          </g>
        )}
      </svg>
    </div>
  );
}
