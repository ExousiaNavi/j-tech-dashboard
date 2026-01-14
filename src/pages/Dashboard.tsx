// pages/Dashboard.tsx
import LiveCard from "../components/LiveCard";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";
import { WS_URL, API_URL } from "../config";
import Layout from "../components/Layout";

interface PCStatus {
  pc: string;
  ip: string;
  cpu: number;
  ram: number;
  disk: number;
  network: {
    upload_kbps: number;
    download_kbps: number;
  };
}

export default function Dashboard() {
  const wsData = useWebSocket(`${WS_URL}/ws/status`);
  const [clients, setClients] = useState<{ [key: string]: PCStatus }>({});
  const [visiblePCs, setVisiblePCs] = useState<string[]>([]);
  const [autoConnectVideo, setAutoConnectVideo] = useState(true);

  useEffect(() => {
    if (wsData?.pc) {
      setClients((prev) => ({
        ...prev,
        [wsData.pc]: wsData,
      }));

      // Add to visible PCs if not already there
      if (!visiblePCs.includes(wsData.pc)) {
        setVisiblePCs((prev) => [...prev, wsData.pc]);
      }
    }
  }, [wsData]);

  // Function to show/hide a PC's video
  // const togglePCVisibility = useCallback((pc: string) => {
  //   setVisiblePCs((prev) =>
  //     prev.includes(pc) ? prev.filter((p) => p !== pc) : [...prev, pc]
  //   );
  // }, []);

  // Filter clients to only show visible ones
  const displayClients = Object.values(clients).filter((pc) =>
    visiblePCs.includes(pc.pc)
  );

  console.log(displayClients);
  useEffect(() => {
    localStorage.setItem("total-pc", displayClients.length.toString());
  }, [displayClients.length]);

  return (
    <div>
      {/* <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Active Systems Monitor
          </h2>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-emerald-700">
              Live Monitoring
            </span>
          </div>
        </div>
        <p className="text-slate-600 text-sm">
          Real-time system performance and remote control
        </p>
      </div> */}

      {/* PC Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2  gap-6">
        {displayClients.map((pc) => (
          <LiveCard
            key={pc.pc}
            {...pc}
            api={API_URL}
            autoConnect={autoConnectVideo}
          />
        ))}
      </div>

      {/* No PCs connected message */}
      {Object.keys(clients).length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17h4.5M4.5 4.5h15a.75.75 0 01.75.75v11.25a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75V5.25a.75.75 0 01.75-.75zM2.25 18h19.5a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75v-.75a.75.75 0 01.75-.75z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No PCs Connected
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Waiting for agent PCs to connect. Make sure the agent software is
            running on your computers.
          </p>
        </div>
      )}
    </div>
  );
}
