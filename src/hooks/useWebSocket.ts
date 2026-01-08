import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
    const ws = useRef<WebSocket | null>(null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        function connect() {
            ws.current = new WebSocket(url);

            ws.current.onopen = () => console.log("[WS] Connected:", url);
            ws.current.onmessage = (event) => setData(JSON.parse(event.data));
            ws.current.onclose = () => {
                console.log("[WS] Disconnected. Reconnecting...");
                setTimeout(connect, 2000);
            };
            ws.current.onerror = () => ws.current?.close();
        }

        connect();
        return () => ws.current?.close();
    }, [url]);

    return data;
}
