// helpers/liveCardHelpers.ts

export type CommandType = "sleep" | "lock" | "restart" | "shutdown";

/* =========================
   API HELPERS
========================= */

export async function sendMessage(api: string, pc: string, message: string) {
  await fetch(`${api}/send-message?pc_name=${pc}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pc, text: message }),
  });
}

export async function sendMessageToAll(
  api: string,
  pc: string,
  message: string
) {
  await fetch(`${api}/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pc, text: message }),
  });
}

export async function sendCommand(
  api: string,
  pc: string,
  command: CommandType
) {
  await fetch(`${api}/send-command?pc_name=${pc}&command=${command}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // body: JSON.stringify({ pc, command }),
  });
}

/* =========================
   UI HELPERS
========================= */

export function getStatusText(
  connectionStatus: string,
  showVideo: boolean,
  isVideoActive: boolean
) {
  if (connectionStatus === "offline") return "PC OFF";
  if (!showVideo) return "STREAMING OFF";
  if (connectionStatus === "connected" && isVideoActive) return "LIVE";
  if (connectionStatus === "connected") return "READY";
  if (connectionStatus === "connecting") return "CONNECTING";
  return "OFFLINE";
}

export function getStatusColor(
  connectionStatus: string,
  showVideo: boolean,
  isVideoActive: boolean
) {
  if (connectionStatus === "offline") return "bg-red-500";
  if (!showVideo) return "bg-green-500";
  if (connectionStatus === "connected" && isVideoActive) return "bg-green-500";
  if (connectionStatus === "connected") return "bg-yellow-500";
  if (connectionStatus === "connecting") return "bg-blue-500";
  return "bg-gray-500";
}

/* =========================
   FULLSCREEN HELPER
========================= */

export function toggleFullscreen(
  element: HTMLDivElement | null,
  isFullscreen: boolean
) {
  if (!element) return;

  if (!isFullscreen) {
    element.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}
