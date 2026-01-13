import { useState, useRef, useEffect } from "react";
import MessageModal from "./MessageModal";
import { useWebRTC } from "../hooks/useWebRTC";
interface NetworkUsage {
  upload_kbps: number; // kbps
  download_kbps: number; // kbps
}

interface Props {
  pc: string;
  cpu: number;
  ram: number;
  disk: number;
  network: NetworkUsage;
  api: string;
  autoConnect: boolean;
}

export default function LiveCard({
  pc,
  cpu,
  ram,
  disk,
  network,
  api,
  autoConnect,
}: Props) {
  const [msgOpen, setMsgOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<{
    type: string;
    action: () => void;
  } | null>(null);
  const [showControls, setShowControls] = useState(true);
  const commandsMenuRef = useRef<HTMLDivElement>(null);
  const [isStopped, setIsStopped] = useState(false);

  const {
    videoRef,
    showVideo,
    videoLoading,
    videoError,
    isVideoActive,
    setIsVideoActive,
    connectionStatus,
    showPlayButton,
    handleManualPlay,
    toggleVideo,
  } = useWebRTC(pc, autoConnect);

  const handleToggleVideo = () => {
    toggleVideo(); // existing function from useWebRTC
    setIsStopped(!showVideo); // if video was on, now it's stopped
  };

  //send to target pc
  const sendMessage = async (message: string) => {
    await fetch(`${api}/send-message?pc_name=${pc}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pc, text: message }),
    });
  };

  //send to all pc
  const sendMessageToAll = async (message: string) => {
    await fetch(`${api}/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pc, text: message }),
    });
  };

  const sendSleepCommand = async () => {
    try {
      const response = await fetch(
        `${api}/send-command?pc_name=${pc}&command=sleep`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        console.log(`${pc}: Sleep command sent successfully`);
      } else {
        console.error(`${pc}: Failed to send sleep command`);
      }
    } catch (err) {
      console.error(`${pc}: Error sending sleep command:`, err);
    }
  };

  const sendLockCommand = async () => {
    try {
      const response = await fetch(
        `${api}/send-command?pc_name=${pc}&command=lock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        console.log(`${pc}: Lock command sent successfully`);
      } else {
        console.error(`${pc}: Failed to send lock command`);
      }
    } catch (err) {
      console.error(`${pc}: Error sending lock command:`, err);
    }
  };

  const sendShutdownCommand = async () => {
    try {
      const response = await fetch(`${api}/send-command?pc_name=${pc}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pc,
          command: "shutdown",
        }),
      });

      if (response.ok) {
        console.log(`${pc}: Shutdown command sent successfully`);
      } else {
        console.error(`${pc}: Failed to send shutdown command`);
      }
    } catch (err) {
      console.error(`${pc}: Error sending shutdown command:`, err);
    }
  };

  const sendRestartCommand = async () => {
    try {
      const response = await fetch(`${api}/send-command?pc_name=${pc}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pc,
          command: "restart",
        }),
      });

      if (response.ok) {
        console.log(`${pc}: Restart command sent successfully`);
      } else {
        console.error(`${pc}: Failed to send restart command`);
      }
    } catch (err) {
      console.error(`${pc}: Error sending restart command:`, err);
    }
  };

  const confirmCommand = (type: string, action: () => void) => {
    setPendingCommand({ type, action });
    setShowConfirmDialog(true);
    setShowCommandsMenu(false);
  };

  const toggleFullscreen = () => {
    if (!cardRef.current) return;

    if (!isFullscreen) {
      if (cardRef.current.requestFullscreen) {
        cardRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Close commands menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showCommandsMenu &&
        commandsMenuRef.current &&
        !commandsMenuRef.current.contains(event.target as Node)
      ) {
        setShowCommandsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCommandsMenu]);

  const getStatusText = () => {
  if (connectionStatus === "offline") return "PC OFF";
  if (!showVideo) return "STREAMING OFF";
  if (connectionStatus === "connected" && isVideoActive) return "LIVE";
  if (connectionStatus === "connected") return "READY";
  if (connectionStatus === "connecting") return "CONNECTING";
  return "OFFLINE";
};

const getStatusColor = () => {
  if (connectionStatus === "offline") return "bg-red-500"; // PC OFF
  if (!showVideo) return "bg-green-500"; // Streaming OFF
  if (connectionStatus === "connected" && isVideoActive) return "bg-green-500"; // LIVE
  if (connectionStatus === "connected") return "bg-yellow-500"; // READY
  if (connectionStatus === "connecting") return "bg-blue-500"; // CONNECTING
  return "bg-gray-500"; // fallback
};


  // Performance label component for fullscreen
  const PerformanceLabel = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="flex items-center space-x-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
      <div className="text-sm font-medium text-gray-300">{label}</div>
      <div className="flex items-center space-x-2">
        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${value}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <div className="text-sm font-bold text-white w-10 text-right">
          {value}%
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`relative bg-black overflow-hidden ${
        isFullscreen
          ? "fixed inset-0 z-50"
          : "rounded-xl shadow-2xl border border-gray-800 w-full"
      }`}
      // onMouseEnter={() => setShowControls(true)}
      // onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Container */}
      <div
        className="relative w-full"
        style={{ height: isFullscreen ? "100vh" : "400px" }}
      >
        {/* Status indicator */}
        <div
          className={`absolute top-4 left-4 z-30 transition-opacity duration-300 ${
            showControls || isFullscreen ? "opacity-100" : "opacity-70"
          }`}
        >
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}
            />
            <span className="text-xs font-medium text-white">
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* PC Name - Top right */}
        <div
          className={`absolute top-4 right-4 z-30 transition-opacity duration-300 ${
            showControls || isFullscreen ? "opacity-100" : "opacity-70"
          }`}
        >
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold text-white">{pc}</span>
          </div>
        </div>

        {/* System Performance Overlay - Bottom center during fullscreen */}
        {isFullscreen && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex space-x-4">
            <PerformanceLabel label="CPU" value={cpu} color="#ef4444" />
            <PerformanceLabel label="RAM" value={ram} color="#3b82f6" />
            <PerformanceLabel label="DISK" value={disk} color="#10b981" />

            <div className="flex items-center space-x-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
              <div className="text-sm font-medium text-gray-300">NET</div>

              <div className="text-xs space-y-1 w-28">
                {/* Upload */}
                <div className="flex items-center space-x-1 text-red-400">
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
                      d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z"
                    />
                  </svg>
                  <span>{network.upload_kbps} kb/s</span>
                </div>

                {/* Download */}
                <div className="flex items-center space-x-1 text-green-400">
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
                      d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.59-5.58L4 12l8 8 8-8z"
                    />
                  </svg>
                  <span>{network.download_kbps} kb/s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control buttons - Show on hover or always in fullscreen */}
        <div
          className={`absolute top-1/2 right-4 transform -translate-y-1/2 z-30 flex flex-col space-y-3 transition-opacity duration-300 ${
            showControls || isFullscreen ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
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
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25"
                />
              </svg>
            ) : (
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
                />
              </svg>
            )}
          </button>

          {/* Stream toggle */}
          <button
            onClick={handleToggleVideo}
            className={`flex items-center justify-center p-3 backdrop-blur-sm rounded-full transition ${
              showVideo
                ? "bg-red-600/80 hover:bg-red-700/80 text-white"
                : "bg-green-600/80 hover:bg-green-700/80 text-white"
            }`}
            title={showVideo ? "Stop Stream" : "Start Stream"}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              {showVideo ? (
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth={2}
                  stroke="currentColor"
                />
              ) : (
                <polygon points="9,7 17,12 9,17" fill="currentColor" />
              )}
            </svg>
          </button>

          {/* Commands menu - Fixed to use portal-like positioning */}
          <div ref={commandsMenuRef} className="relative commands-menu">
            <button
              onClick={() => setShowCommandsMenu(!showCommandsMenu)}
              className="p-3 bg-black/60 backdrop-blur-sm text-white rounded-full hover:bg-black/80 transition"
              title="Computer Commands"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {showCommandsMenu && (
              <>
                {/* Overlay to capture clicks outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCommandsMenu(false)}
                />

                {/* Commands menu - Positioned absolutely relative to viewport */}
                <div className="fixed right-14 top-0 transform w-56 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl z-50 py-2">
                  <div className="px-3 py-2 border-b border-gray-700">
                    <p className="text-xs font-medium text-gray-300">
                      Computer Commands
                    </p>
                    <p className="text-xs text-gray-400">
                      Send commands to {pc}
                    </p>
                  </div>

                  <div className="space-y-1 px-2 py-2">
                    <button
                      onClick={() => confirmCommand("lock", sendLockCommand)}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition"
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
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition"
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
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition"
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
                        confirmCommand("shutdown", sendShutdownCommand)
                      }
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition"
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
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition"
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
              </>
            )}
          </div>
        </div>

        {/* Video element */}
        {showVideo && (
          <video
            ref={videoRef}
            className={`w-full h-full object-contain ${
              isVideoActive ? "block" : "hidden"
            }`}
            autoPlay
            playsInline
            muted
            onPlaying={() => setIsVideoActive(true)}
            onPause={() => setIsVideoActive(false)}
          />
        )}

        {/* Play button overlay for autoplay */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <button
              onClick={handleManualPlay}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center space-x-2 transition-transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Click to Start Live Stream</span>
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {videoLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <div className="text-white text-sm font-medium">
              Connecting to live stream...
            </div>
            <div className="text-gray-300 text-xs mt-1">
              {connectionStatus === "connecting"
                ? "Establishing connection..."
                : "Waiting for video..."}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {videoError && !videoLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 z-20">
            <svg
              className="w-12 h-12 text-white mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-white text-sm font-medium text-center px-4">
              Reconnecting...
            </div>
          </div>
        )}

        {/* Placeholder when video is off */}
        {!showVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
            <svg
              className="w-16 h-16 mb-2 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
            </svg>
            <span className="text-sm text-gray-400">{connectionStatus === "offline" ? "PC Offline" : "Monitoring is OFF"}</span>
          </div>
        )}

        {/* Connected but waiting for play */}
        {showVideo &&
          connectionStatus === "connected" &&
          !isVideoActive &&
          !videoLoading &&
          !showPlayButton && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20">
              <div className="text-white text-sm font-medium">
                Stream connected
              </div>
              <div className="text-gray-300 text-xs mt-1">
                Click anywhere to start playing
              </div>
            </div>
          )}
      </div>

      {/* Non-fullscreen mode - Performance stats below video */}
      {!isFullscreen && (
        <div className="p-6 bg-gray-900 border-t border-gray-800">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-400"
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
              System Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPU Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-400">
                        CPU
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Processor
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                    style={{ width: `${cpu}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{cpu}%</span>
                  <span>Load</span>
                  <span>100%</span>
                </div>
              </div>

              {/* RAM Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">
                        RAM
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Memory
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                    style={{ width: `${ram}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{ram}%</span>
                  <span>Usage</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Disk Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-400">
                        DISK
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Storage
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                    style={{ width: `${disk}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{disk}%</span>
                  <span>Space</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Network Card */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-400">
                        NET
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Network
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Upload</span>
                    <span className="font-semibold text-red-500">
                      {network.upload_kbps} kb/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Download</span>
                    <span className="text-green-500 font-semibold">
                      {network.download_kbps} kb/s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingCommand && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  pendingCommand.type === "sleep"
                    ? "bg-blue-900/30"
                    : pendingCommand.type === "lock"
                    ? "bg-yellow-900/30"
                    : pendingCommand.type === "restart"
                    ? "bg-purple-900/30"
                    : "bg-red-900/30"
                }`}
              >
                {pendingCommand.type === "sleep" ? (
                  <svg
                    className="w-6 h-6 text-blue-400"
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
                ) : pendingCommand.type === "lock" ? (
                  <svg
                    className="w-6 h-6 text-yellow-400"
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
                ) : pendingCommand.type === "restart" ? (
                  <svg
                    className="w-6 h-6 text-purple-400"
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
                ) : (
                  <svg
                    className="w-6 h-6 text-red-400"
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
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {pendingCommand.type === "sleep"
                    ? "Put to Sleep"
                    : pendingCommand.type === "lock"
                    ? "Lock Computer"
                    : pendingCommand.type === "restart"
                    ? "Restart Computer"
                    : "Shutdown Computer"}
                </h3>
                <p className="text-sm text-gray-400">Confirm action</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to{" "}
              <span className="font-semibold text-white">
                {pendingCommand.type === "sleep"
                  ? "put"
                  : pendingCommand.type === "lock"
                  ? "lock"
                  : pendingCommand.type === "restart"
                  ? "restart"
                  : "shutdown"}
              </span>
              <span className="font-bold text-white">{pc}</span>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingCommand(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  pendingCommand.action();
                  setShowConfirmDialog(false);
                  setPendingCommand(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition text-white ${
                  pendingCommand.type === "sleep"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : pendingCommand.type === "lock"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : pendingCommand.type === "restart"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Yes,{" "}
                {pendingCommand.type === "sleep"
                  ? "Put to Sleep"
                  : pendingCommand.type === "lock"
                  ? "Lock"
                  : pendingCommand.type === "restart"
                  ? "Restart"
                  : "Shutdown"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      <MessageModal
        pc={pc}
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        onSend={sendMessage}
        onSendToAll={sendMessageToAll}
      />
    </div>
  );
}
