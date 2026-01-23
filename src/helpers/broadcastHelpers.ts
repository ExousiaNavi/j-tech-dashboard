export type CommandType =
  | "sleep"
  | "lock"
  | "restart"
  | "shutdown"
  | "restart_agent";

/* =========================
   API HELPERS
========================= */

export async function broadcastCommand(api: string, command: CommandType) {
  await fetch(`${api}/broadcast-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
}

export async function sendMessageToAll(
  api: string,
  message: string
) {
  await fetch(`${api}/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pc: "all", text: message }),
  });
}