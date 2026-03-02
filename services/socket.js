import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChat = (chatId, callback) => {
  if (!socket) return;
  socket.emit('join_chat', { chatId }, callback);
};

export const sendSocketMessage = (chatId, messageText, callback) => {
  if (!socket) return;
  socket.emit('send_message', { chatId, message_text: messageText }, callback);
};

export const emitTypingStart = (chatId) => {
  if (!socket) return;
  socket.emit('typing_start', { chatId });
};

export const emitTypingStop = (chatId) => {
  if (!socket) return;
  socket.emit('typing_stop', { chatId });
};

export const emitMarkRead = (chatId, callback) => {
  if (!socket) return;
  socket.emit('mark_read', { chatId }, callback);
};

export const getOnlineUsers = (callback) => {
  if (!socket) return;
  socket.emit('get_online_users', callback);
};
