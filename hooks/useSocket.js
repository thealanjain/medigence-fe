'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/services/socket';

/**
 * Hook to easily subscribe to socket events.
 * Auto-cleans up on unmount.
 */
export function useSocketEvent(eventName, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let attached = false;
    let timer = null;

    const tryAttach = () => {
      const socket = getSocket();
      if (socket) {
        const listener = (...args) => handlerRef.current(...args);
        socket.on(eventName, listener);
        attached = true;
        
        if (timer) clearInterval(timer);
        return listener;
      }
      return null;
    };

    let currentListener = tryAttach();

    if (!attached) {
      timer = setInterval(() => {
        currentListener = tryAttach();
      }, 500);
    }

    return () => {
      if (timer) clearInterval(timer);
      const socket = getSocket();
      if (socket && currentListener) {
        socket.off(eventName, currentListener);
      }
    };
  }, [eventName]);
}

/**
 * Emit a socket event.
 */
export function useSocketEmit() {
  return useCallback((event, data, callback) => {
    let retries = 0;
    const maxRetries = 10;
    
    const tryEmit = () => {
      const socket = getSocket();
      if (socket) {
        socket.emit(event, data, callback);
        return true;
      }
      return false;
    };

    if (!tryEmit()) {
      const timer = setInterval(() => {
        retries++;
        if (tryEmit() || retries >= maxRetries) {
          clearInterval(timer);
        }
      }, 500);
    }
  }, []);
}
