type CommandType = "sleep" | "lock" | "restart" | "shutdown";

interface ControlsProps {
  /* UI state */
  showControls: boolean;
  isFullscreen: boolean;
  showVideo: boolean;
  showCommandsMenu: boolean;

  /* State setters */
  setShowCommandsMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setMsgOpen: React.Dispatch<React.SetStateAction<boolean>>;

  /* Actions */
  toggleFullscreen: () => void;
  handleToggleVideo: () => void;

  /* Commands */
  confirmCommand: (type: CommandType, action: () => void) => void;

  sendLockCommand: () => void;
  sendSleepCommand: () => void;
  sendRestartCommand: () => void;
  sendShutdownCommand: () => void;

  /* Refs */
  commandsMenuRef: React.RefObject<HTMLDivElement | null>;

  /* Data */
  pc: string;
}

export default function StreamControls({
  showControls,
  isFullscreen,
  showVideo,
  showCommandsMenu,
  setShowCommandsMenu,
  setMsgOpen,
  toggleFullscreen,
  handleToggleVideo,
  confirmCommand,
  sendLockCommand,
  sendSleepCommand,
  sendRestartCommand,
  sendShutdownCommand,
  commandsMenuRef,
  pc,
}: ControlsProps) {
  return (
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
                <p className="text-xs text-gray-400">Send commands to {pc}</p>
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
                    <p className="text-xs text-gray-400">Lock the PC screen</p>
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
                  onClick={() => confirmCommand("restart", sendRestartCommand)}
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
                    <p className="text-xs text-gray-400">Send popup message</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
