import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma, redis } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

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
  finishTime: number | null;
  position: number | null;
}

interface RoomState {
  code: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  players: Map<string, Player>;
  trackId: string | null;
  trackText: string | null;
  startTime: number | null;
  countdownStartTime: number | null;
  finishedCount: number;
}

const rooms = new Map<string, RoomState>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', async (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    let currentRoom: string | null = null;
    let currentUser: { id: string; username: string; avatarColor: string; carColor: string } | null = null;

    // Authenticate user
    socket.on('authenticate', async (data: { token?: string }) => {
      try {
        if (data.token) {
          const decoded = jwt.verify(data.token, JWT_SECRET) as { odefinitionUserId: string };
          const user = await prisma.user.findUnique({
            where: { id: decoded.odefinitionUserId },
            select: { id: true, username: true, avatarColor: true, carColor: true },
          });
          if (user) {
            currentUser = user;
            socket.emit('authenticated', { user: currentUser });
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Join room
    socket.on('join-room', async (data: { roomCode: string; user?: any }) => {
      try {
        const roomCode = data.roomCode;

        // Use provided user data or require authentication
        if (data.user) {
          currentUser = data.user;
        }

        if (!currentUser) {
          socket.emit('error', { message: 'Please authenticate first' });
          return;
        }

        // Check if room exists in DB
        const dbRoom = await prisma.room.findUnique({
          where: { code: roomCode },
        });

        if (!dbRoom) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check max players
        let roomState = rooms.get(roomCode);
        if (!roomState) {
          roomState = {
            code: roomCode,
            status: 'waiting',
            players: new Map(),
            trackId: null,
            trackText: null,
            startTime: null,
            countdownStartTime: null,
            finishedCount: 0,
          };
          rooms.set(roomCode, roomState);
        }

        // Check max players (null means unlimited)
        if (dbRoom.maxPlayers !== null && roomState.players.size >= dbRoom.maxPlayers) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Leave previous room if any
        if (currentRoom) {
          await leaveRoom(socket, currentRoom, currentUser.id);
        }

        // Join new room
        currentRoom = roomCode;
        socket.join(roomCode);

        const player: Player = {
          id: socket.id,
          odefinitionUserId: currentUser.id,
          username: currentUser.username,
          avatarColor: currentUser.avatarColor,
          carColor: currentUser.carColor,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          finishTime: null,
          position: null,
        };

        roomState.players.set(socket.id, player);

        // Store in Redis for persistence
        await redis.sadd(`room:${roomCode}:players`, socket.id);
        await redis.hset(`room:${roomCode}:player:${socket.id}`, {
          odefinitionUserId: currentUser.id,
          username: currentUser.username,
          avatarColor: currentUser.avatarColor,
          carColor: currentUser.carColor,
        });

        // Notify all players
        io.to(roomCode).emit('room-update', {
          status: roomState.status,
          players: Array.from(roomState.players.values()),
          trackId: roomState.trackId,
          trackText: roomState.trackText,
        });

        socket.emit('joined-room', { roomCode, player });

        console.log(`${currentUser.username} joined room ${roomCode}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Select track for race
    socket.on('select-track', async (data: { trackId: string }) => {
      if (!currentRoom || !currentUser) return;

      const roomState = rooms.get(currentRoom);
      if (!roomState) return;

      // Verify user is host or first player
      const isHost = Array.from(roomState.players.values())[0]?.odefinitionUserId === currentUser.id;
      if (!isHost) {
        socket.emit('error', { message: 'Only the host can select tracks' });
        return;
      }

      try {
        const track = await prisma.raceTrack.findUnique({
          where: { id: data.trackId },
        });

        if (!track) {
          socket.emit('error', { message: 'Track not found' });
          return;
        }

        roomState.trackId = track.id;
        roomState.trackText = track.text;

        io.to(currentRoom).emit('track-selected', {
          trackId: track.id,
          trackName: track.name,
          trackText: track.text,
          language: track.language,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to select track' });
      }
    });

    // Start race countdown
    socket.on('start-race', async () => {
      if (!currentRoom || !currentUser) return;

      const roomState = rooms.get(currentRoom);
      if (!roomState || roomState.status !== 'waiting') return;

      // Verify host
      const isHost = Array.from(roomState.players.values())[0]?.odefinitionUserId === currentUser.id;
      if (!isHost) {
        socket.emit('error', { message: 'Only the host can start the race' });
        return;
      }

      if (!roomState.trackText) {
        socket.emit('error', { message: 'Please select a track first' });
        return;
      }

      if (roomState.players.size < 1) {
        socket.emit('error', { message: 'Need at least 1 player to start' });
        return;
      }

      // Start countdown
      roomState.status = 'countdown';
      roomState.countdownStartTime = Date.now();

      await prisma.room.update({
        where: { code: currentRoom },
        data: { status: 'countdown' },
      });

      io.to(currentRoom).emit('countdown-started', {
        duration: 5,
        trackText: roomState.trackText,
      });

      // After 5 seconds, start the race
      const roomCodeForTimeout = currentRoom;
      setTimeout(async () => {
        const rs = rooms.get(roomCodeForTimeout);
        if (!rs || rs.status !== 'countdown') return;

        rs.status = 'racing';
        rs.startTime = Date.now();
        rs.finishedCount = 0;

        // Reset all players
        rs.players.forEach((player) => {
          player.progress = 0;
          player.wpm = 0;
          player.accuracy = 100;
          player.finished = false;
          player.finishTime = null;
          player.position = null;
        });

        await prisma.room.update({
          where: { code: roomCodeForTimeout },
          data: { status: 'racing' },
        });

        // Create race record
        if (rs.trackId) {
          const dbRoom = await prisma.room.findUnique({ where: { code: roomCodeForTimeout } });
          if (dbRoom) {
            const race = await prisma.race.create({
              data: {
                roomId: dbRoom.id,
                trackId: rs.trackId,
                startedAt: new Date(),
              },
            });
            await redis.set(`room:${roomCodeForTimeout}:raceId`, race.id);
          }
        }

        io.to(roomCodeForTimeout).emit('race-started', {
          startTime: rs.startTime,
          trackText: rs.trackText,
        });
      }, 5000);
    });

    // Update typing progress
    socket.on('typing-progress', (data: { progress: number; wpm: number; accuracy: number }) => {
      if (!currentRoom || !currentUser) return;

      const roomState = rooms.get(currentRoom);
      if (!roomState || roomState.status !== 'racing') return;

      const player = roomState.players.get(socket.id);
      if (!player) return;

      player.progress = Math.min(100, Math.max(0, data.progress));
      player.wpm = Math.max(0, data.wpm);
      player.accuracy = Math.min(100, Math.max(0, data.accuracy));

      // Broadcast to all players in room
      io.to(currentRoom).emit('player-progress', {
        odefinitionPlayerId: socket.id,
        odefinitionUserId: player.odefinitionUserId,
        username: player.username,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy,
      });
    });

    // Player finished race
    socket.on('race-finished', async (data: { wpm: number; accuracy: number }) => {
      if (!currentRoom || !currentUser) return;

      const roomState = rooms.get(currentRoom);
      if (!roomState || roomState.status !== 'racing') return;

      const player = roomState.players.get(socket.id);
      if (!player || player.finished) return;

      player.finished = true;
      player.progress = 100;
      player.wpm = data.wpm;
      player.accuracy = data.accuracy;
      player.finishTime = Date.now() - (roomState.startTime || 0);

      roomState.finishedCount++;
      player.position = roomState.finishedCount;

      // Save result to database
      try {
        const raceId = await redis.get(`room:${currentRoom}:raceId`);
        if (raceId) {
          await prisma.raceResult.create({
            data: {
              raceId,
              userId: player.odefinitionUserId,
              wpm: player.wpm,
              accuracy: player.accuracy,
              position: player.position,
              finishTime: player.finishTime,
            },
          });
        }
      } catch (error) {
        console.error('Failed to save race result:', error);
      }

      io.to(currentRoom).emit('player-finished', {
        odefinitionPlayerId: socket.id,
        username: player.username,
        position: player.position,
        wpm: player.wpm,
        accuracy: player.accuracy,
        finishTime: player.finishTime,
      });

      // Check if all players finished
      const allFinished = Array.from(roomState.players.values()).every((p) => p.finished);
      if (allFinished) {
        await endRace(currentRoom, roomState, io);
      }
    });

    // Chat message
    socket.on('chat-message', (data: { message: string }) => {
      if (!currentRoom || !currentUser) return;

      io.to(currentRoom).emit('chat-message', {
        odefinitionUserId: currentUser.id,
        username: currentUser.username,
        message: data.message.slice(0, 200),
        timestamp: Date.now(),
      });
    });

    // Leave room
    socket.on('leave-room', async () => {
      if (currentRoom && currentUser) {
        await leaveRoom(socket, currentRoom, currentUser.id);
        currentRoom = null;
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (currentRoom && currentUser) {
        await leaveRoom(socket, currentRoom, currentUser.id);
      }
    });
  });

  // Helper function to leave room
  async function leaveRoom(socket: Socket, roomCode: string, odefinitionUserId: string) {
    const roomState = rooms.get(roomCode);
    if (!roomState) return;

    roomState.players.delete(socket.id);
    socket.leave(roomCode);

    await redis.srem(`room:${roomCode}:players`, socket.id);
    await redis.del(`room:${roomCode}:player:${socket.id}`);

    if (roomState.players.size === 0) {
      // Clean up empty room
      rooms.delete(roomCode);
      await redis.del(`room:${roomCode}:status`);
      await redis.del(`room:${roomCode}:raceId`);

      // Update room status in DB
      await prisma.room.update({
        where: { code: roomCode },
        data: { status: 'finished' },
      }).catch(() => {});
    } else {
      // Notify remaining players
      socket.to(roomCode).emit('player-left', {
        odefinitionPlayerId: socket.id,
        odefinitionUserId,
        players: Array.from(roomState.players.values()),
      });
    }
  }

  // Helper function to end race
  async function endRace(roomCode: string, roomState: RoomState, io: Server) {
    roomState.status = 'finished';

    const results = Array.from(roomState.players.values())
      .sort((a, b) => (a.position || 999) - (b.position || 999))
      .map((p) => ({
        odefinitionUserId: p.odefinitionUserId,
        username: p.username,
        position: p.position,
        wpm: p.wpm,
        accuracy: p.accuracy,
        finishTime: p.finishTime,
      }));

    io.to(roomCode).emit('race-ended', { results });

    // Update race record
    try {
      const raceId = await redis.get(`room:${roomCode}:raceId`);
      if (raceId) {
        await prisma.race.update({
          where: { id: raceId },
          data: { finishedAt: new Date() },
        });
      }
    } catch (error) {
      console.error('Failed to update race:', error);
    }

    // Update room status
    await prisma.room.update({
      where: { code: roomCode },
      data: { status: 'waiting' },
    }).catch(() => {});

    // Reset room state for next race after 10 seconds
    setTimeout(() => {
      if (rooms.has(roomCode)) {
        const state = rooms.get(roomCode)!;
        state.status = 'waiting';
        state.startTime = null;
        state.finishedCount = 0;
        state.players.forEach((p) => {
          p.progress = 0;
          p.wpm = 0;
          p.finished = false;
          p.finishTime = null;
          p.position = null;
        });

        io.to(roomCode).emit('room-reset', {
          status: 'waiting',
          players: Array.from(state.players.values()),
        });
      }
    }, 10000);
  }
}
