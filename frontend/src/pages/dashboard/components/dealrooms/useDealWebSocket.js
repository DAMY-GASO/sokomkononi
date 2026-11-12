import { useEffect, useRef, useState, useCallback } from "react";
import { DealWebSocket } from "../../../../api/dealWebSocket";

/**
 * Hook ya kuunganisha DealRoom na WebSocket.
 *
 * @param {number} roomId
 * @param {string} token  — JWT access token
 * @param {function} onIncoming — callback kwa ujumbe mpya (message, offer, typing, n.k.)
 * @returns { status, sendMessage, sendTyping }
 */
export function useDealWebSocket({ roomId, token, onIncoming }) {
  const [status, setStatus] = useState("idle");
  const clientRef = useRef(null);
  const incomingRef = useRef(onIncoming);

  useEffect(() => {
    incomingRef.current = onIncoming;
  }, [onIncoming]);

  useEffect(() => {
    if (!roomId || !token) {
      setStatus("idle");
      return;
    }

    const client = new DealWebSocket({
      roomId,
      token,
      onMessage: (data) => incomingRef.current?.(data),
      onStatusChange: setStatus,
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [roomId, token]);

  const sendMessage = useCallback((text) => {
    clientRef.current?.sendMessage(text);
  }, []);

  const sendTyping = useCallback((isTyping) => {
    clientRef.current?.sendTyping(isTyping);
  }, []);

  return { status, sendMessage, sendTyping };
}