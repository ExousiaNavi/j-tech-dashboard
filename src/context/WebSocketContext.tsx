import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { WS_URL } from "../config";

interface PCStatus {
  license: boolean;
  expired: boolean
  pc: string;
  ip: string;
  cpu: number;
  ram: number;
  disk: number;
  org_id?: string;
  network: { upload_kbps: number; download_kbps: number };
  [key: string]: any;
}

interface WebSocketContextValue {
  clients: { [key: string]: PCStatus };
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<{ [key: string]: PCStatus }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);

  useEffect(() => {
    let closedManually = false;

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/ws/status`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(data)
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }
          if (!data.pc) return;
          setClients(prev => ({ ...prev, [data.pc]: { ...prev[data.pc], ...data } }));
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      ws.onerror = (err) => console.error("WebSocket error:", err);

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        if (!closedManually) {
          const timeout = Math.min(5000, 1000 * 2 ** reconnectRef.current);
          reconnectRef.current += 1;
          setTimeout(connect, timeout);
        }
      };
    };

    connect();

    return () => {
      closedManually = true;
      wsRef.current?.close();
    };
  }, []);

  return <WebSocketContext.Provider value={{ clients }}>{children}</WebSocketContext.Provider>;
};

export const useWS = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWS must be used within WebSocketProvider");
  return context;
};
