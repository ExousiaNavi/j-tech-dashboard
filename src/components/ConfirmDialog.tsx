type PendingCommand = {
  type: "sleep" | "lock" | "restart" | "shutdown" | "restart_agent";
  action: () => void;
};

interface Props {
  showConfirmDialog: boolean;
  pendingCommand: PendingCommand | null;
  setShowConfirmDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingCommand: React.Dispatch<
    React.SetStateAction<PendingCommand | null>
  >;
  pc: string;
}

export default function ConfirmDialog({
  showConfirmDialog,
  pendingCommand,
  setShowConfirmDialog,
  setPendingCommand,
  pc,
}: Props) {
  // return if null
  if (!showConfirmDialog || !pendingCommand) return null;

  return (
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
                : pendingCommand.type === "shutdown"
                ? "bg-red-900/30"
                : "bg-indigo-900/30" // restart_agent color
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
            ) : pendingCommand.type === "shutdown" ? (
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
                : pendingCommand.type === "shutdown"
                ? "Shutdown Computer"
                : "Restart Agent"}
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
              : pendingCommand.type === "shutdown"
              ? "shutdown"
              : "restart"}
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
                : pendingCommand.type === "shutdown"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Yes,{" "}
            {pendingCommand.type === "sleep"
              ? "Put to Sleep"
              : pendingCommand.type === "lock"
              ? "Lock"
              : pendingCommand.type === "restart"
              ? "Restart"
              : pendingCommand.type === "shutdown"
              ? "Shutdown"
              : "Restart Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
