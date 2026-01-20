import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { WS_URL } from "../config";

interface PCStatus {
  pc: string;
  ip: string;
  cpu: number;
  ram: number;
  disk: number;
  org_id?: string; // Add org_id
  network: {
    upload_kbps: number;
    download_kbps: number;
  };
  [key: string]: any; // for SystemStatus fields
}

interface WebSocketContextValue {
  clients: { [key: string]: PCStatus };
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined,
);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<{ [key: string]: PCStatus }>({});

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws/status`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.pc) return;

        // setClients((prev) => ({ ...prev, [data.pc]: data }));
        setClients((prev) => ({
          ...prev,
          [data.pc]: { ...prev[data.pc], ...data }, // merge updates
        }));
        
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onclose = () => console.log("WebSocket disconnected");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ clients }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWS = () => {
  const context = useContext(WebSocketContext);
  if (!context)
    throw new Error("useWS must be used within a WebSocketProvider");
  return context;
};
