import { useState } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "./ConfirmDialog";
import MessageModalAll from "./MessageModalAll";

type CommandType = "sleep" | "lock" | "restart" | "shutdown" | "restart_agent" | "message";

interface BroadcastPopupProps {
  isBroadcastOpen: boolean;
  onClose: () => void;
  onLock?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onRestartAgent?: () => void;
  onShutdown?: () => void;
  onSendToAll?: (msg: string) => void;
}

interface Command {
  name: string;
  desc: string;
  bgColor: string;
  iconColor: string;
  type: CommandType;
  action: () => void;
  iconPath: string;
}

export default function BroadcastPopup({
  isBroadcastOpen,
  onClose,
  onLock,
  onSleep,
  onRestart,
  onRestartAgent,
  onShutdown,
  onSendToAll
}: BroadcastPopupProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<{
    type: CommandType;
    action: () => void;
  } | null>(null);

  const commands: Command[] = [
    {
    name: "Send Message",
    desc: "Send popup message",
    bgColor: "bg-yellow-900/30",
    iconColor: "text-yellow-500",
    type: "message",
    action: () => setMsgOpen(true), // open Message modal
    iconPath: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
  },
    { name: "Lock Computer", desc: "Lock the PC screen", bgColor: "bg-yellow-900/30", iconColor: "text-yellow-500", type: "lock", action: onLock!, iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { name: "Sleep Mode", desc: "Put PC to sleep", bgColor: "bg-blue-900/30", iconColor: "text-blue-500", type: "sleep", action: onSleep!, iconPath: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
    { name: "Restart", desc: "Restart the computer", bgColor: "bg-purple-900/30", iconColor: "text-purple-500", type: "restart", action: onRestart!, iconPath: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    { name: "Restart Agent", desc: "Restart the agent", bgColor: "bg-purple-900/30", iconColor: "text-purple-500", type: "restart_agent", action: onRestartAgent!, iconPath: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    { name: "Shutdown", desc: "Turn off the computer", bgColor: "bg-red-900/30", iconColor: "text-red-500", type: "message", action: onShutdown!, iconPath: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  ];

  if (!isBroadcastOpen) return null;

  const handleCommandClick = (cmd: Command) => {
  if (cmd.type === "message") {
    // open the message modal directly
    cmd.action();
  } else {
    // show confirmation for other commands
    setPendingCommand({ type: cmd.type, action: cmd.action });
    setShowConfirmDialog(true);
  }
};

  return createPortal(
    <>
      {/* Command Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="relative bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 w-80 flex flex-col gap-2">
          {/* Close button */}
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">
            ✕
          </button>

          {commands.map((cmd) => (
            <button
              key={cmd.name}
              onClick={() => handleCommandClick(cmd)}
              className="bg-gray-800/50 w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700 transition"
            >
              <div className={`w-8 h-8 rounded-lg ${cmd.bgColor} flex items-center justify-center`}>
                <svg className={`w-4 h-4 ${cmd.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cmd.iconPath} />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{cmd.name}</p>
                <p className="text-xs text-gray-400">{cmd.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        showConfirmDialog={showConfirmDialog}
        pendingCommand={pendingCommand}
        setShowConfirmDialog={setShowConfirmDialog}
        setPendingCommand={setPendingCommand}
        pc="ALL AGENTS"
      />

      <MessageModalAll
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        onSendToAll={(msg) => {
            onSendToAll?.(msg);
            setMsgOpen(false);
            onClose();
        }}
/>

    </>,
    document.body
  );
}
