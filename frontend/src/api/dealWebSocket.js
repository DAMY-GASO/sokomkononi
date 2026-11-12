/**
 * Deal Room WebSocket client.
 *
 * Inashughulikia:
 *  - Kuunganisha na kujiongeza upya (reconnect) kwa exponential backoff
 *  - Heartbeat (ping/pong) ili Cloudflare isikate muunganisho
 *  - Kutuma na kupokea ujumbe wa JSON
 */

const WS_BASE =
  import.meta.env.VITE_WS_BASE_URL || "wss://api.sokomkononi.co.tz";

export class DealWebSocket {
  constructor({ roomId, token, onMessage, onStatusChange }) {
    this.roomId = roomId;
    this.token = token;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;

    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 8;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.closedByUser = false;
  }

  get url() {
    return `${WS_BASE}/ws/deal/${this.roomId}/?token=${encodeURIComponent(this.token)}`;
  }

  connect() {
    this.closedByUser = false;
    this._setStatus("connecting");

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error("[DealWS] failed to construct WebSocket:", err);
      this._setStatus("error");
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._setStatus("open");
      this._startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === "ping") {
        this._send({ type: "pong" });
        return;
      }
      if (data.type === "pong") return;

      this.onMessage?.(data);
    };

    this.ws.onerror = () => this._setStatus("error");

    this.ws.onclose = (event) => {
      this._stopHeartbeat();
      this._setStatus("closed");

      // 4001 = haijathibitishwa, 4003 = si mshiriki — usijaribu tena
      if (event.code === 4001 || event.code === 4003) {
        this.closedByUser = true;
        return;
      }

      if (!this.closedByUser) this._scheduleReconnect();
    };
  }

  sendMessage(text) {
    this._send({ type: "message", text });
  }

  sendTyping(isTyping) {
    this._send({ type: "typing", is_typing: isTyping });
  }

  close() {
    this.closedByUser = true;
    this._stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) {
      this.ws.close(1000, "client closed");
    }
    this.ws = null;
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  _setStatus(status) {
    this.onStatusChange?.(status);
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this._send({ type: "ping" });
    }, 25000);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._setStatus("failed");
      return;
    }
    const delay = Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}