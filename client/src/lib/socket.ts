import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('⚡ Socket.IO disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚡ Socket.IO connection error:', err.message);
    });
  }

  return socketInstance;
}

export function joinMatchRoom(matchId: string): void {
  const socket = getSocket();
  socket.emit('join:match', matchId);
}

export function leaveMatchRoom(matchId: string): void {
  const socket = getSocket();
  socket.emit('leave:match', matchId);
}

export function joinTournamentRoom(tournamentId: string): void {
  const socket = getSocket();
  socket.emit('join:tournament', tournamentId);
}

export function leaveTournamentRoom(tournamentId: string): void {
  const socket = getSocket();
  socket.emit('leave:tournament', tournamentId);
}
