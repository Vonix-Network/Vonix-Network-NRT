import { WS_URL } from '../config/appConfig';

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null; // browser setTimeout returns number
  private messageHandlers: ((message: any) => void)[] = [];
  private isConnecting: boolean = false;

  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    
    try {
      console.log('Attempting to connect to WebSocket:', WS_URL);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully to', WS_URL);
        this.isConnecting = false;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('📨 WebSocket message received:', event.data);
          const message = JSON.parse(event.data);
          console.log('📨 Parsed message:', message);
          console.log('📨 Number of handlers:', this.messageHandlers.length);
          this.messageHandlers.forEach((handler, index) => {
            console.log(`Calling handler ${index}`);
            handler(message);
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        // Reconnect after 5 seconds
        if (!this.reconnectTimeout) {
          console.log('Will reconnect in 5 seconds...');
          this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const chatWebSocket = new ChatWebSocket();
