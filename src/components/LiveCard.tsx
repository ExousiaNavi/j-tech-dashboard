import { useState, useRef, useEffect } from "react";
import MessageModal from "./MessageModal";
import { useWebRTC } from "../hooks/useWebRTC";
// import SystemPerformance from "./SystemPerformance";
import ConfirmDialog from "./ConfirmDialog";
import StreamControls from "./Controls";
import {
  sendMessage,
  sendMessageToAll,
  sendCommand,
  getStatusText,
  getStatusColor,
  toggleFullscreen,
} from "../helpers/liveCardHelpers";

interface NetworkUsage {
  upload_kbps: number; // kbps
  download_kbps: number; // kbps
}

interface Props {
  expired: boolean;
  isOffline: boolean;
  pc: string;
  user: string;
  cpu: number;
  ram: number;
  disk: number;
  network: NetworkUsage;
  api: string;
  autoConnect: boolean;
}

export default function LiveCard({
  expired,
  isOffline,
  pc,
  user,
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
    type: "sleep" | "lock" | "restart" | "shutdown" | "restart_agent";
    action: () => void;
  } | null>(null);
  const [showControls, setShowControls] = useState(true);
  const commandsMenuRef = useRef<HTMLDivElement>(null);
  // const [isStopped, setIsStopped] = useState(false);

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
  } = useWebRTC(pc, autoConnect && !expired && !isOffline);

  const handleToggleVideo = () => {
    toggleVideo(); // existing function from useWebRTC
    // setIsStopped(!showVideo); // if video was on, now it's stopped
  };

  const guardExpired = (fn: () => void) => {
    if (expired) return;
    fn();
  };

  //send to target pc
  const handleSendMessage = (message: string) => sendMessage(api, pc, message);

  //send to all pc
  const handleSendMessageToAll = (message: string) =>
    sendMessageToAll(api, pc, message);

  const sendSleepCommand = () =>
    guardExpired(() => sendCommand(api, pc, "sleep"));
  const sendLockCommand = () =>
    guardExpired(() => sendCommand(api, pc, "lock"));
  const sendRestartCommand = () =>
    guardExpired(() => sendCommand(api, pc, "restart"));
  const sendShutdownCommand = () =>
    guardExpired(() => sendCommand(api, pc, "shutdown"));
  const sendRestartAgentCommand = () =>
    guardExpired(() => sendCommand(api, pc, "restart_agent"));

  const confirmCommand = (
    type: "sleep" | "lock" | "restart" | "shutdown" | "restart_agent",
    action: () => void,
  ) => {
    console.log("CLIKED");
    setPendingCommand({ type, action });
    setShowConfirmDialog(true);
    setShowCommandsMenu(false);
  };

  const handleToggleFullscreen = () =>
    toggleFullscreen(cardRef.current, isFullscreen);

  useEffect(() => {
    setShowControls(true);
  });

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

  const statusText = getStatusText(connectionStatus, showVideo, isVideoActive);

  const statusColor = getStatusColor(
    connectionStatus,
    showVideo,
    isVideoActive,
  );

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
        style={{ height: isFullscreen ? "100vh" : "310px" }}
      >
        {isOffline && (
          <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center">
            <svg
              className="w-14 h-14 text-red-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <div className="text-red-400 text-2xl font-bold">
              Agent is Offline
            </div>

            <div className="text-gray-300 text-sm mt-1">
              Please run the agent on the {user}
            </div>
          </div>
        )}
        {expired && (
          <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center">
            <svg
              className="w-14 h-14 text-red-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <div className="text-red-400 text-2xl font-bold">
              License Expired
            </div>

            <div className="text-gray-300 text-sm mt-1">
              Please renew to regain access
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div
          className={`absolute top-4 left-4 z-30 transition-opacity duration-300 ${
            showControls || isFullscreen ? "opacity-100" : "opacity-70"
          }`}
        >
          <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div
              className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`}
            />
            <span className="text-xs font-medium text-white">{statusText}</span>
          </div>
        </div>

        {/* PC Name - Top right */}
        <div
          className={`absolute top-4 right-4 z-30 transition-opacity duration-300 ${
            showControls || isFullscreen ? "opacity-100" : "opacity-70"
          }`}
        >
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold text-white">{user}</span>
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
        <StreamControls
          showControls={showControls}
          isFullscreen={isFullscreen}
          showVideo={showVideo}
          showCommandsMenu={showCommandsMenu}
          setShowCommandsMenu={setShowCommandsMenu}
          setMsgOpen={setMsgOpen}
          toggleFullscreen={handleToggleFullscreen}
          handleToggleVideo={handleToggleVideo}
          confirmCommand={confirmCommand}
          sendLockCommand={sendLockCommand}
          sendSleepCommand={sendSleepCommand}
          sendRestartCommand={sendRestartCommand}
          sendShutdownCommand={sendShutdownCommand}
          sendRestartAgentCommand={sendRestartAgentCommand}
          commandsMenuRef={commandsMenuRef}
          pc={pc}
        />

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
            <span className="text-sm text-gray-400">
              {connectionStatus === "offline"
                ? "PC Offline"
                : "Monitoring is OFF"}
            </span>
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
      {/* <SystemPerformance
        cpu={cpu}
        ram={ram}
        disk={disk}
        network={{
          upload_kbps: network.upload_kbps,
          download_kbps: network.download_kbps,
        }}
        isFullscreen={isFullscreen}
      /> */}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog}
        pendingCommand={pendingCommand}
        setShowConfirmDialog={setShowConfirmDialog}
        setPendingCommand={setPendingCommand}
        pc={pc}
      />

      {/* Message Modal */}
      <MessageModal
        pc={pc}
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        onSend={handleSendMessage}
        onSendToAll={handleSendMessageToAll}
      />
    </div>
  );
}
