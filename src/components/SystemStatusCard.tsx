import { useState, useEffect } from "react";
import ConfirmDialog from "./ConfirmDialog";
import MessageModal from "./MessageModal";
import {
  sendMessage,
  sendMessageToAll,
  sendCommand,
} from "../helpers/liveCardHelpers";

interface NetworkUsage {
  upload_kbps: number;
  download_kbps: number;
}

interface Disk {
  device: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_percent: number;
}

interface Process {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
}

interface GPU {
  name: string;
  driver_version: string;
  memory_total_mb: number;
}

interface NetworkInterfaces {
  [key: string]: {
    up: boolean;
    speed: number;
  };
}

interface Uptime {
  boot_time: string;
  uptime_hours: number;
}

interface Props {
  pc: string;
  ip: string;
  os: string;
  os_version: string;
  user: string;
  cpu: number;
  ram: number;
  disk: number;
  network: NetworkUsage;
  network_interfaces: NetworkInterfaces;
  uptime: Uptime;
  top_processes: Process[];
  disks: Disk[];
  alerts: string[];
  gpu: GPU[];
  api: string;
}

export default function SystemStatusCard({
  pc,
  ip,
  os,
  os_version,
  user,
  cpu,
  ram,
  disk,
  network,
  network_interfaces,
  uptime,
  top_processes,
  disks,
  alerts,
  gpu,
  api,
}: Props) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<{
    type: "sleep" | "lock" | "restart" | "shutdown" | "restart_agent";
    action: () => void;
  } | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const [hasCriticalAlert, setHasCriticalAlert] = useState(false);

  useEffect(() => {
    // Check for critical alerts
    const critical = alerts.some(
      (alert) =>
        alert.toLowerCase().includes("critical") ||
        alert.toLowerCase().includes("low disk") ||
        ram >= 90 ||
        cpu >= 90,
    );
    setHasCriticalAlert(critical);
  }, [alerts, cpu, ram]);

  const confirmCommand = (
    type: "sleep" | "lock" | "restart" | "shutdown" | "restart_agent",
    action: () => void,
  ) => {
    setPendingCommand({ type, action });
    setShowConfirmDialog(true);
  };

  // Commands
  const sendSleepCommand = () => sendCommand(api, pc, "sleep");
  const sendLockCommand = () => sendCommand(api, pc, "lock");
  const sendRestartCommand = () => sendCommand(api, pc, "restart");
  const sendShutdownCommand = () => sendCommand(api, pc, "shutdown");
  const sendRestartAgentCommand = () => sendCommand(api, pc, "restart_agent");

  // Messages
  const handleSendMessage = (message: string) => sendMessage(api, pc, message);
  const handleSendMessageToAll = (message: string) =>
    sendMessageToAll(api, pc, message);

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full overflow-hidden">
      {/* ALERT BANNER - Immediately visible */}
      {alerts.length > 0 && showAlerts && (
        <div
          className={`${
            hasCriticalAlert
              ? "bg-gradient-to-r from-red-900/40 to-red-800/20 border-b border-red-500/30"
              : "bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border-b border-yellow-500/30"
          }`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full ${
                    hasCriticalAlert ? "bg-red-500/20" : "bg-yellow-500/20"
                  } flex items-center justify-center`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      hasCriticalAlert ? "text-red-400" : "text-yellow-400"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-bold ${
                        hasCriticalAlert ? "text-red-300" : "text-yellow-300"
                      }`}
                    >
                      {alerts.length} ALERT{alerts.length > 1 ? "S" : ""}
                    </span>
                    {hasCriticalAlert && (
                      <span className="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs rounded-full animate-pulse">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    {alerts[0]}{" "}
                    {alerts.length > 1 && `+${alerts.length - 1} more`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PC Header */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start">
          <div className="w-full">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-white font-bold text-xl shrink-0">{pc}</h1>
              {(ram >= 90 || cpu >= 90 || alerts.length > 0) && (
                <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                  CRITICAL
                </span>
              )}
            </div>
            <div className="text-gray-400 text-sm">
              User: {user}
              <span className="block">
                OS: {os} {os_version}
              </span>
            </div>
            <div className="text-gray-400 text-sm">IP Address: {ip}</div>
          </div>
          <div className="flex gap-2 mt-2 w-full justify-end">
            {/* <div className="flex items-center space-x-2">
              {!showAlerts && alerts.length > 0 && (
              <button
                onClick={() => setShowAlerts(true)}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Show {alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
              </button>
            )}
            </div> */}
            <div className="flex flex-row md:flex-col  gap-2">
              <button
                onClick={() => setShowAlerts(true)}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Show alert</span>
              </button>

              <div className="relative group">
                <button className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                  <span>Actions</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => confirmCommand("lock", sendLockCommand)}
                    className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/70 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Lock Computer</p>
                      <p className="text-xs text-gray-400">
                        Lock the PC screen
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => confirmCommand("sleep", sendSleepCommand)}
                    className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/70 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Sleep Mode</p>
                      <p className="text-xs text-gray-400">Put PC to sleep</p>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      confirmCommand("restart", sendRestartCommand)
                    }
                    className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/70 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Restart</p>
                      <p className="text-xs text-gray-400">
                        Restart the computer
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      confirmCommand("restart_agent", sendRestartAgentCommand)
                    }
                    className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/70 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Restart</p>
                      <p className="text-xs text-gray-400">Restart the agent</p>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      confirmCommand("shutdown", sendShutdownCommand)
                    }
                    className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/70 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Shutdown</p>
                      <p className="text-xs text-gray-400">
                        Turn off the computer
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setMsgOpen(true)}
                    className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/70 rounded-lg transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-900/30 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-pink-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Send Message</p>
                      <p className="text-xs text-gray-400">
                        Send popup message
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats - Keeping your exact design */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 border-t border-gray-800/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Performance Stats
              </h3>
              <p className="text-sm text-gray-400">Real-time system metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <span className="text-xs text-gray-300">Live</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Your exact design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-800 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"></div>
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    CPU
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {cpu.toFixed(1)}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-900/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Utilization</span>
                <span>{cpu.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 transition-all duration-700"
                  style={{ width: `${cpu}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Top process: {top_processes[1]?.name || "Idle"}
            </div>
          </div>

          {/* RAM */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-800 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Memory
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {ram.toFixed(1)}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Usage</span>
                <span>{ram.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 transition-all duration-700"
                  style={{ width: `${ram}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {ram >= 80 ? "High usage" : "Normal operation"}
            </div>
          </div>

          {/* Disk */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-800 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Storage
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{disk}%</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-900/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Space used</span>
                <span>{disk}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${disk}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {disks.length} drive{disks.length !== 1 ? "s" : ""} available
            </div>
          </div>

          {/* Network */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Network
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {Math.max(network.upload_kbps, network.download_kbps) > 1000
                    ? `${(
                        Math.max(network.upload_kbps, network.download_kbps) /
                        1000
                      ).toFixed(1)} MB/s`
                    : `${Math.max(
                        network.upload_kbps,
                        network.download_kbps,
                      )} KB/s`}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-900/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Download
                  </span>
                  <span className="font-semibold text-green-400">
                    {network.download_kbps} KB/s
                  </span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (network.download_kbps / 10000) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Upload
                  </span>
                  <span className="font-semibold text-red-400">
                    {network.upload_kbps} KB/s
                  </span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-pink-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        (network.upload_kbps / 10000) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Uptime Information */}
            <div className="flex flex-col gap-2 lg:flex-row items-start">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-1">
                  Uptime
                </div>
                <div className="text-sm text-gray-300">
                  {(() => {
                    // Convert total hours to hours + minutes
                    const totalMinutes = Math.floor(uptime.uptime_hours * 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours}h ${minutes}m`;
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started: {new Date(uptime.boot_time).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Network Interfaces */}
            <div className="flex flex-col gap-2 lg:flex-row items-start">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-1">
                  Network
                </div>
                <div className="text-sm text-gray-300">
                  {
                    Object.values(network_interfaces).filter((ni) => ni.up)
                      .length
                  }{" "}
                  active interfaces
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Object.values(network_interfaces).find(
                    (ni) => ni.up && ni.speed > 0,
                  )?.speed || 0}{" "}
                  Mbps max
                </div>
              </div>
            </div>

            {/* GPU Information */}
            <div className="flex flex-col gap-2 lg:flex-row items-start">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-orange-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 mb-1">
                  GPU
                </div>
                <div className="text-sm text-gray-300">
                  {gpu.length > 0 ? (
                    <>
                      {gpu[0].name}
                      <div className="text-xs text-gray-500 mt-1">
                        Driver: {gpu[0].driver_version}
                      </div>
                    </>
                  ) : (
                    "No GPU detected"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional System Information */}
        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disk Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z"
                    clipRule="evenodd"
                  />
                </svg>
                Disk Information
              </h4>
              <div className="space-y-2">
                {disks.map((d) => (
                  <div
                    key={d.device}
                    className="text-sm p-2 rounded-lg bg-gray-800/30"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-gray-300 font-medium">
                        {d.device}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          d.usage_percent >= 90
                            ? "bg-red-500/20 text-red-300"
                            : d.usage_percent >= 80
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {d.usage_percent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full ${
                          d.usage_percent >= 90
                            ? "bg-gradient-to-r from-red-600 to-red-400"
                            : d.usage_percent >= 80
                              ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
                              : "bg-gradient-to-r from-green-600 to-green-400"
                        }`}
                        style={{ width: `${d.usage_percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{d.used_gb.toFixed(1)} GB used</span>
                      <span>
                        {d.free_gb.toFixed(1)} GB free of {d.total_gb} GB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Processes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Top Processes
              </h4>
              <div className="space-y-2">
                {top_processes.slice(1, 4).map((process) => (
                  <div
                    key={process.pid}
                    className="flex flex-col justify-between items-start text-sm p-2 rounded-lg bg-gray-800/30"
                  >
                    <span className="text-gray-300 truncate max-w-[50%]">
                      {process.name}
                    </span>
                    <div className="flex space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          process.cpu_percent > 30
                            ? "bg-red-500/20 text-red-300"
                            : process.cpu_percent > 10
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        CPU: {process.cpu_percent.toFixed(1)}%
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                        RAM: {process.memory_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      {/* <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-400">Live updating</span>
            </div>
            <div className="text-gray-500">
              Last update: {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!showAlerts && alerts.length > 0 && (
              <button
                onClick={() => setShowAlerts(true)}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Show {alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div> */}

      {/* Message Modal */}
      <MessageModal
        pc={pc}
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        onSend={handleSendMessage}
        onSendToAll={handleSendMessageToAll}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog}
        pendingCommand={pendingCommand}
        setShowConfirmDialog={setShowConfirmDialog}
        setPendingCommand={setPendingCommand}
        pc={pc}
      />
    </div>
  );
}
