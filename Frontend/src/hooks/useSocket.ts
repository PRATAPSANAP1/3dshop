import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Singleton socket — shared across all hook instances
let globalSocket: Socket | null = null;
let refCount = 0;

const getSocket = (): Socket => {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return globalSocket;
};

export const useSocket = (room?: string) => {
  const [connected, setConnected] = useState(false);
  const roomRef = useRef(room);

  useEffect(() => {
    refCount++;
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      if (roomRef.current) socket.emit('join_room', roomRef.current);
    };

    const onDisconnect = () => setConnected(false);

    if (socket.connected) {
      setConnected(true);
      if (roomRef.current) socket.emit('join_room', roomRef.current);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      refCount--;
      // Only disconnect when no components are using the socket
      if (refCount === 0) {
        socket.disconnect();
        globalSocket = null;
      }
    };
  }, []);

  const emitEvent = (event: string, data: any) => {
    globalSocket?.emit(event, data);
  };

  const onEvent = (event: string, callback: (data: any) => void) => {
    globalSocket?.on(event, callback);
  };

  return { socket: globalSocket, connected, emitEvent, onEvent };
};
