// pages/SystemStatus.tsx
import { useState, useEffect } from "react";
// import { useWebSocket } from "../hooks/useWebSocket";
import { API_URL } from "../config";
import SystemStatusCard from "../components/SystemStatusCard";
import { useWS } from "../context/WebSocketContext";
import { useOutletContext } from "react-router-dom"; // ✅ correct
import { useOrganizations } from "../hooks/useOrganizations";
import { useDeleteOrganization } from "../hooks/useDeleteOrganization";
import DeleteOrgConfirmDialog from "../components/DeleteOrgConfirmDialog";
import { useOrg } from "../context/OrgContext";

interface OutletContext {
  selectedOrg: string | null;
  setSelectedOrg: (org: string | null) => void;
}

interface NetworkUsage {
  upload_kbps: number;
  download_kbps: number;
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

interface Disk {
  device: string;
  mount: string;
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

interface PCStatus {
  expired: boolean;
  pc: string;
  ip: string;
  os: string;
  os_version: string;
  user: string;
  timestamp: string;
  cpu: number;
  ram: number;
  disk: number;
  network: NetworkUsage;
  network_interfaces: NetworkInterfaces;
  temperature: number | null;
  uptime: Uptime;
  battery: number | null;
  top_processes: Process[];
  idle_seconds: number;
  disks: Disk[];
  alerts: string[];
  gpu: GPU[];
}

export default function SystemStatus() {
  //   const wsData = useWebSocket(`${WS_URL}/ws/status`);
  const { clients } = useWS();
  //   const [clients, setClients] = useState<{ [key: string]: PCStatus }>({});
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof PCStatus>("pc");

  //   useEffect(() => {
  //     if (wsData?.pc) {
  //       setClients((prev) => ({ ...prev, [wsData.pc]: wsData }));
  //     }
  //   }, [wsData]);

  const connectedClients = Object.values(clients);
  console.log(connectedClients);
  const { orgs } = useOrg();
  const { selectedOrg, setSelectedOrg } = useOutletContext<OutletContext>();

  console.log(selectedOrg, orgs);

  const { deleteOrg } = useOrganizations();
  const {
    showDeleteDialog,
    setShowDeleteDialog,
    pendingDelete,
    setPendingDelete,
    requestDelete,
  } = useDeleteOrganization();

  // Filter clients based on criteria
  // const filteredClients = connectedClients.filter((client) => {
  //   if (filter === "high-load") return client.cpu > 80 || client.ram > 80;
  //   if (filter === "alerts") return client.alerts.length > 0;
  //   if (filter === "windows")
  //     return client.os.toLowerCase().includes("windows");
  //   if (filter === "linux") return client.os.toLowerCase().includes("linux");
  //   if (filter === "mac") return client.os.toLowerCase().includes("mac");
  //   return true;
  // });

  // Auto-select first org if none is selected
  useEffect(() => {
    if (!selectedOrg && orgs.length > 0) {
      setSelectedOrg(orgs[0].id);
    }
  }, [orgs, selectedOrg, setSelectedOrg]);

  // Filter clients based on criteria + selectedOrg
  const filteredClients = connectedClients.filter((client) => {
    if (selectedOrg && client.org_id !== selectedOrg) return false;

    if (filter === "high-load") return client.cpu > 80 || client.ram > 80;
    if (filter === "alerts") return client.alerts.length > 0;
    if (filter === "windows")
      return client.os.toLowerCase().includes("windows");
    if (filter === "linux") return client.os.toLowerCase().includes("linux");
    if (filter === "mac") return client.os.toLowerCase().includes("mac");

    // Show all by default
    return filter === "all" || filter === "not-connected";
  });

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "cpu" || sortBy === "ram" || sortBy === "disk")
      return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);

    const aStr = (a[sortBy] ?? "").toString();
    const bStr = (b[sortBy] ?? "").toString();
    return aStr.localeCompare(bStr);
  });

  // Calculate dashboard stats
  const totalClients = filteredClients.length;

  const avgCPU =
    filteredClients.reduce((sum, client) => sum + client.cpu, 0) /
      totalClients || 0;
  const avgRAM =
    filteredClients.reduce((sum, client) => sum + client.ram, 0) /
      totalClients || 0;
  const systemsWithAlerts = filteredClients.filter(
    (c) => c.alerts.length > 0,
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="w-full">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-2">
              System Monitoring
              {/* <span className="w-fit ml-4 text-sm px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full font-normal">
                {totalClients} active system{totalClients !== 1 ? "s" : ""}
              </span> */}
            </h1>
            <p className="text-gray-400">
              Real-time monitoring and management of connected systems
            </p>
          </div>

          <div className="flex items-center justify-end space-x-4 w-full">
            <button
              disabled={!selectedOrg || selectedOrg === "Unassigned"}
              onClick={() => {
                if (!selectedOrg) return;

                requestDelete(selectedOrg, async () => {
                  const res = await deleteOrg(selectedOrg);

                  if (res.last_org) {
                    setSelectedOrg(res.last_org);
                  } else {
                    setSelectedOrg("Unassigned");
                  }
                });
              }}
              className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium
              bg-red-600 hover:bg-red-700 text-white transition-colors
              disabled:bg-red-400 disabled:cursor-not-allowed
            `}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Delete Organization
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-800 hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {totalClients}
                </div>
                <div className="text-sm text-gray-400">Connected Systems</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                style={{ width: `${(totalClients / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-800 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {avgCPU.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Avg CPU Usage</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500"
                style={{ width: `${avgCPU}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-800 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {avgRAM.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Avg RAM Usage</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                </svg>
              </div>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                style={{ width: `${avgRAM}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {systemsWithAlerts}
                </div>
                <div className="text-sm text-gray-400">Systems with Alerts</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-400"
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
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-orange-500"
                style={{
                  width: `${(systemsWithAlerts / totalClients) * 100 || 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="w-full flex flex-col md:flex-row items-center gap-2">
            <span className="text-sm text-gray-400 shrink-0">Filter by:</span>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                All Systems
              </button>
              <button
                onClick={() => setFilter("high-load")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "high-load"
                    ? "bg-red-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                High Load
              </button>
              <button
                onClick={() => setFilter("alerts")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "alerts"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                With Alerts
              </button>

              <button
                onClick={() => setFilter("not-connected")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "not-connected"
                    ? "bg-red-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Not Connected
              </button>
            </div>
            <div className="relative w-full">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof PCStatus)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-8"
              >
                <option value="pc">Sort by: Name</option>
                <option value="cpu">Sort by: CPU Usage</option>
                <option value="ram">Sort by: RAM Usage</option>
                <option value="disk">Sort by: Disk Usage</option>
                <option value="user">Sort by: User</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-400">Live updates active</span>
            </div>
            <div className="text-sm text-gray-400">
              Last update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Systems Grid */}
      {/* {sortedClients.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No systems found
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === "all"
                ? "Waiting for agent PCs to connect..."
                : "No systems match the current filter"}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Show All Systems
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedClients.map((pc) => (
            <SystemStatusCard
              key={pc.pc}
              pc={pc.pc}
              ip={pc.ip}
              os={pc.os}
              os_version={pc.os_version}
              user={pc.user}
              cpu={pc.cpu}
              ram={pc.ram}
              disk={pc.disk}
              network={pc.network}
              network_interfaces={pc.network_interfaces}
              uptime={pc.uptime}
              top_processes={pc.top_processes}
              disks={pc.disks}
              alerts={pc.alerts}
              gpu={pc.gpu}
              api={API_URL}
            />
          ))}
        </div>
      )} */}
      {/* Systems Grid */}
      {(() => {
        if (!selectedOrg) return null;

        // Find the org object
        const org = orgs.find((o) => o.id === selectedOrg);
        if (!org) return null;

        const hasConnectedClients = sortedClients.length > 0;
        const hasOrgAgents = (org.agents || []).length > 0;

        // Show "No systems found" only if both are empty
        if (!hasConnectedClients && !hasOrgAgents) {
          return (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  No systems found
                </h3>
                <p className="text-gray-500 mb-6">
                  {filter === "all"
                    ? "Waiting for agent PCs to connect..."
                    : "No systems match the current filter"}
                </p>
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Show All Systems
                  </button>
                )}
              </div>
            </div>
          );
        }

        // Otherwise, show all agents (connected or placeholder)
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(org.agents || []).map((agentName) => {
              const client = sortedClients.find((c) => c.pc === agentName);
              const status = client ? "Connected" : "Not Connected";
              // Filter: if user wants Not Connected only
              if (filter === "not-connected" && status !== "Not Connected")
                return null;
              if (filter !== "not-connected" && filter !== "all" && !client)
                return null;

              if (client) {
                return (
                  <SystemStatusCard
                    expired={client.expired}
                    key={client.pc}
                    pc={client.pc}
                    ip={client.ip}
                    os={client.os}
                    os_version={client.os_version}
                    user={client.user}
                    cpu={client.cpu}
                    ram={client.ram}
                    disk={client.disk}
                    network={client.network}
                    network_interfaces={client.network_interfaces}
                    uptime={client.uptime}
                    top_processes={client.top_processes}
                    disks={client.disks}
                    alerts={client.alerts}
                    gpu={client.gpu}
                    api={API_URL}
                    status={status}
                  />
                );
              }

              // Placeholder card
              return (
                <SystemStatusCard
                  expired={false}
                  key={agentName}
                  pc={agentName}
                  ip="N/A"
                  os="Unknown"
                  os_version="Unknown"
                  user="N/A"
                  cpu={0}
                  ram={0}
                  disk={0}
                  network={{ upload_kbps: 0, download_kbps: 0 }}
                  network_interfaces={{}}
                  uptime={{ boot_time: "-", uptime_hours: 0 }}
                  top_processes={[]}
                  disks={[]}
                  alerts={[]}
                  gpu={[]}
                  api={API_URL}
                  status={status}
                  // isPlaceholder={true} // optional
                />
              );
            })}
          </div>
        );
      })()}

      {/* Footer Stats */}
      <div className="mt-8 pt-6 border-t border-gray-800/50">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
          <div>
            Showing {sortedClients.length} of {totalClients} system
            {totalClients !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>
                Normal (
                {
                  connectedClients.filter((c) => c.cpu < 80 && c.ram < 80)
                    .length
                }
                )
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>
                Warning (
                {connectedClients.filter((c) => c.alerts.length > 0).length})
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>
                Critical (
                {
                  connectedClients.filter((c) => c.cpu >= 80 || c.ram >= 80)
                    .length
                }
                )
              </span>
            </div>
          </div>
        </div>
      </div>

      <DeleteOrgConfirmDialog
        show={showDeleteDialog}
        orgId={pendingDelete?.orgId || null}
        onCancel={() => {
          setShowDeleteDialog(false);
          setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) pendingDelete.action();
          setShowDeleteDialog(false);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
