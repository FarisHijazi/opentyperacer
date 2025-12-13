# OpenTypeRacer

Self-hosted multiplayer typing race game similar to TypeRacer.

## Features

- **Real-time Multiplayer Racing**: WebSocket-based racing with live progress updates
- **Visual Car Racing**: Animated cars race across the track as players type
- **Custom Race Tracks**: Create and share custom typing texts
- **Multi-language Support**: English, Spanish, French, German, Arabic, Portuguese, Italian, Japanese, Chinese, Code
- **Room System**: Create public/private rooms, invite friends via room code
- **Guest Mode**: Play without registration
- **Statistics**: Track WPM, accuracy, and race results

## Tech Stack

- **Backend**: Node.js, Express, Socket.io, Prisma ORM
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerization**: Docker Compose with Traefik integration

## Access

- **Public URL**: https://typeracer.fhijazi.com
- **Dev URL**: https://typeracer-dev.fhijazi.com

## Quick Start

```bash
cd /home/faris/media-server/compose/opentyperacer
docker compose up -d --build
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 80 (internal) | React SPA |
| backend | 3001 (internal) | API + WebSocket server |
| postgres | 5432 (internal) | Database |
| redis | 6379 (internal) | Session/room state |

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/guest` - Create guest user
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/tracks` - List tracks
- `GET /api/tracks/random` - Get random track
- `POST /api/tracks` - Create track
- `GET /api/rooms` - List public rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/:code` - Get room details

## WebSocket Events

### Client → Server
- `authenticate` - Auth with token
- `join-room` - Join a room
- `select-track` - Select race track (host only)
- `start-race` - Start countdown (host only)
- `typing-progress` - Update typing progress
- `race-finished` - Signal race completion
- `leave-room` - Leave current room

### Server → Client
- `room-update` - Room state update
- `track-selected` - Track was selected
- `countdown-started` - Race countdown started
- `race-started` - Race began
- `player-progress` - Player progress update
- `player-finished` - Player finished race
- `race-ended` - Race completed with results

## Data Location

- PostgreSQL data: `./provision/postgres/`
- Redis data: `./provision/redis/`

## Environment Variables

See `.env` for configuration options:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Database credentials
- `JWT_SECRET` - JWT signing key
- `CORS_ORIGIN` - Allowed CORS origins

## Development

### Rebuild after changes:
```bash
docker compose up -d --build
```

### View logs:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Reset database:
```bash
docker compose down
rm -rf ./provision/postgres
docker compose up -d
```

## Troubleshooting

### WebSocket connection fails
- Check that Traefik is routing `/socket.io` to the backend
- Verify CORS_ORIGIN includes the frontend URL

### Database connection fails
- Ensure postgres container is healthy: `docker compose ps`
- Check DATABASE_URL in backend logs

### Frontend shows blank page
- Check browser console for errors
- Verify Traefik routing to frontend is working
