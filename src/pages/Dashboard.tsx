// pages/Dashboard.tsx
import { useEffect, useState, useMemo } from "react";
import LiveCard from "../components/LiveCard";
import { useWS } from "../context/WebSocketContext";
import { API_URL } from "../config";
import { useOrg } from "../context/OrgContext";

export default function Dashboard() {
  const { clients } = useWS();
  const { orgs: savedOrgs, addOrg, refreshOrgs } = useOrg();
  const [newOrgName, setNewOrgName] = useState("");
  const [visiblePCs, setVisiblePCs] = useState<string[]>([]);
  const [autoConnectVideo, setAutoConnectVideo] = useState(true);
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [recentlyCreatedOrgs, setRecentlyCreatedOrgs] = useState<Set<string>>(
    new Set(),
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const OFFLINE_CPU = 0;
  const OFFLINE_RAM = 0;
  const OFFLINE_DISK = 0;

  const OFFLINE_NETWORK = {
    upload_kbps: 0,
    download_kbps: 0,
    latency: 0,
  };

  console.log(clients);
  console.log(savedOrgs)
  useEffect(() => {
    setAutoConnectVideo(true);
  });
  // Clear error/success messages after timeout
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Add newly connected PCs to visible list automatically
  useEffect(() => {
    Object.keys(clients).forEach((pc) => {
      if (!visiblePCs.includes(pc)) setVisiblePCs((prev) => [...prev, pc]);
    });
  }, [clients, visiblePCs]);

  // Generate orgs dynamically from connected PCs + saved orgs
  const dynamicOrgs = useMemo(() => {
    const orgsFromClients = Object.values(clients).map(
      (c) => c.org_id || "Unassigned",
    );
    const orgsFromSaved = savedOrgs.map((o) => o.id);

    // Combine all sources and deduplicate
    const allOrgs = Array.from(
      new Set([
        ...orgsFromClients,
        ...orgsFromSaved,
        ...Array.from(recentlyCreatedOrgs),
      ]),
    );

    // Sort with "Unassigned" last and recently created orgs first
    return allOrgs.sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      if (recentlyCreatedOrgs.has(a) && !recentlyCreatedOrgs.has(b)) return -1;
      if (!recentlyCreatedOrgs.has(a) && recentlyCreatedOrgs.has(b)) return 1;
      return a.localeCompare(b);
    });
  }, [clients, savedOrgs, recentlyCreatedOrgs]);

  // Set default org filter to first org if available
  useEffect(() => {
    if (dynamicOrgs.length > 0 && !orgFilter) {
      setOrgFilter(dynamicOrgs[0]);
    }
  }, [dynamicOrgs, orgFilter]);

  // Filter clients to only show visible ones and match org filter
  const displayClients = useMemo(() => {
    return Object.values(clients).filter((pc) => {
      const isVisible = visiblePCs.includes(pc.pc);
      const matchesOrg = orgFilter === "" || pc.org_id === orgFilter;
      const matchesSearch =
        searchQuery === "" ||
        pc.pc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pc.org_id || "").toLowerCase().includes(searchQuery.toLowerCase());
      return isVisible && matchesOrg && matchesSearch;
    });
  }, [clients, visiblePCs, orgFilter, searchQuery]);

  console.log(displayClients);
  // Get device count for an organization
  const getOrgDeviceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(clients).forEach((client) => {
      const org = client.org_id || "Unassigned";
      counts[org] = (counts[org] || 0) + 1;
    });
    return counts;
  }, [clients]);

  // Normalize org name for comparison
  const normalizeOrgName = (name: string) =>
    name.toLowerCase().replace(/\s+/g, ""); // remove all spaces and lowercase

  // Handle new org creation
  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || isCreating) return;

    const trimmedName = newOrgName.trim();
    const normalizedName = normalizeOrgName(trimmedName);

    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");

    // Check if org already exists (using normalized names)
    const exists = dynamicOrgs.some(
      (org) => normalizeOrgName(org) === normalizedName,
    );

    // Check if org already exists
    if (exists) {
      setErrorMessage(`Organization "${trimmedName}" already exists!`);
      setNewOrgName("");
      return;
    }

    setIsCreating(true);
    try {
      // Add to recently created orgs immediately for UI responsiveness
      setRecentlyCreatedOrgs((prev) => new Set([...prev, trimmedName]));

      // Call the API to create org
      const created = await addOrg(trimmedName);
      console.log("Created org response:", created);

      if (created) {
        // Refresh orgs from backend to ensure consistency
        if (refreshOrgs) await refreshOrgs();

        setNewOrgName("");
        // Switch to the newly created org
        setOrgFilter(trimmedName);

        // Show success message
        setSuccessMessage(
          `Organization "${trimmedName}" created successfully!`,
        );

        // Remove from recently created after 10 seconds (when backend sync should be complete)
        setTimeout(() => {
          setRecentlyCreatedOrgs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(trimmedName);
            return newSet;
          });
        }, 10000);
      } else {
        // If org already exists in backend, remove from recently created
        setRecentlyCreatedOrgs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(trimmedName);
          return newSet;
        });
        setErrorMessage(
          `Organization "${trimmedName}" already exists in the system!`,
        );
      }
    } catch (error) {
      // Remove from recently created on error
      setRecentlyCreatedOrgs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trimmedName);
        return newSet;
      });

      console.error("Error creating org:", error);
      setErrorMessage(
        `Error creating organization: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Total registered PCs (all orgs)
const totalPCs = savedOrgs.reduce(
  (sum, org) => sum + (org.agents?.length ?? 0),
  0
);

// Currently connected PCs (from websocket)
const onlinePCs = Object.keys(clients).length;

// Offline PCs (never go below 0)
const offlinePCs = Math.max(totalPCs - onlinePCs, 0);

  // const onlinePCs = Object.values(clients).filter(c => c.online).length;

  const registeredAgents = savedOrgs
  .filter(org => !orgFilter || org.id === orgFilter)
  .flatMap(org =>
    (org.agents ?? []).map(agent => ({
      pc: agent,
      org: org.id,
    }))
  );


const allRenderedClients = registeredAgents.map(regAgent => {
  const liveClient = displayClients.find(
    c => c.pc === regAgent.pc
  );

  if (liveClient) {
    return {
      ...liveClient,
      user: liveClient.user ?? regAgent.pc, // ✅ GUARANTEED STRING
      isOffline: false,
    };
  }

  return {
    pc: regAgent.pc,
    org: regAgent.org,
    user: regAgent.pc,
    expired: false,
    license: false,
    isOffline: true,
    // status: "offline",

    cpu: OFFLINE_CPU,
    ram: OFFLINE_RAM,
    disk: OFFLINE_DISK,
    network: OFFLINE_NETWORK,
  };
});

const finalClients = allRenderedClients.filter(pc =>
  pc.pc.toLowerCase().includes(searchQuery.toLowerCase())
);

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-900 to-black min-h-screen">
      {/* --- Compact Dashboard Header --- */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl overflow-hidden shadow-lg border border-gray-700 backdrop-blur-sm">
        <div className="h-1 bg-gradient-to-r from-red-600 to-red-800"></div>

        <div className="p-4">
          {/* Compact Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            {/* Left: Title with Stats */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-md">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Computer Devices
                </h1>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">{totalPCs} total</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="text-green-400">{onlinePCs} online</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="text-red-400">{offlinePCs} offline</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="text-gray-400">
                    {dynamicOrgs.length} orgs
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 w-full md:w-48"
                />
              </div>
            </div>
          </div>

          {/* Organization Management */}
          <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="w-full lg:w-auto">
                <span className="text-base text-gray-400 font-medium whitespace-nowrap">
                  Livestream Organization:
                </span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {/* Show first 3 orgs as buttons */}
                  {dynamicOrgs.slice(0, 3).map((org) => {
                    const count = getOrgDeviceCount[org] || 0;
                    const isRecentlyCreated = recentlyCreatedOrgs.has(org);

                    return (
                      <button
                        key={org}
                        onClick={() => setOrgFilter(org)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 min-w-[100px] justify-between group ${
                          orgFilter === org
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        } ${isRecentlyCreated ? "ring-1 ring-red-500/50" : ""}`}
                        title={isRecentlyCreated ? "Recently created" : org}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="truncate text-left">{org}</span>
                          {isRecentlyCreated && (
                            <span
                              className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"
                              title="New"
                            ></span>
                          )}
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${
                            count > 0
                              ? "bg-white/20 text-green-500"
                              : orgFilter === org
                                ? "bg-white/20 text-white"
                                : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Dropdown for remaining orgs */}
                  {dynamicOrgs.length > 3 && (
                    <select
                      value={orgFilter}
                      onChange={(e) => setOrgFilter(e.target.value)}
                      className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-red-500/30 border border-gray-700 min-w-[120px]"
                    >
                      <option value="" disabled>
                        Select org...
                      </option>
                      {dynamicOrgs.slice(3).map((org) => {
                        const count = getOrgDeviceCount[org] || 0;
                        const isRecentlyCreated = recentlyCreatedOrgs.has(org);
                        return (
                          <option
                            key={org}
                            value={org}
                            className={isRecentlyCreated ? "bg-red-900/20" : ""}
                          >
                            {org} {isRecentlyCreated && "🆕"} ({count})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* Create Org - Same width as filter buttons */}
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="relative flex items-center w-full lg:w-[200px]">
                  <div className="absolute left-3">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Create new organization..."
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      // Clear error when user starts typing
                      if (errorMessage) setErrorMessage("");
                    }}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !isCreating && handleCreateOrg()
                    }
                    className="pl-9 pr-20 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 w-full"
                  />
                  <button
                    onClick={handleCreateOrg}
                    disabled={!newOrgName.trim() || isCreating}
                    className="absolute right-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded text-xs font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isCreating ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin h-3 w-3 mr-1 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Adding
                      </span>
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {(errorMessage || successMessage) && (
              <div className="flex flex-col gap-1">
                {errorMessage && (
                  <div className="flex items-center gap-2 text-xs text-red-300 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 animate-fadeIn">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
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
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-center gap-2 text-xs text-green-300 bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2 animate-fadeIn">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{successMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Info message about new orgs */}
            {recentlyCreatedOrgs.size > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  New organizations:{" "}
                  {Array.from(recentlyCreatedOrgs).join(", ")}. Device count
                  updates when PCs are assigned to them.
                </span>
              </div>
            )}

            {/* Active Filters */}
            {(searchQuery ||
              (orgFilter &&
                dynamicOrgs.length > 0 &&
                orgFilter !== dynamicOrgs[0])) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {orgFilter &&
                    dynamicOrgs.length > 0 &&
                    orgFilter !== dynamicOrgs[0] && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-900/30 border border-red-800/30 text-red-200">
                        Org: {orgFilter}
                        <button
                          onClick={() => setOrgFilter(dynamicOrgs[0] || "")}
                          className="text-red-300 hover:text-white ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-800 border border-gray-700 text-gray-300">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-white ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(searchQuery ||
                    (orgFilter &&
                      dynamicOrgs.length > 0 &&
                      orgFilter !== dynamicOrgs[0])) && (
                    <button
                      onClick={() => {
                        setOrgFilter(dynamicOrgs[0] || "");
                        setSearchQuery("");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-300 underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- PC Cards Grid --- */}
      {displayClients.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {finalClients.map((pc) => (
            <LiveCard
              {...pc}
              // expired={pc.expired}
              // user={pc.user}
              key={pc.pc}
              api={API_URL}
              autoConnect={autoConnectVideo}
            />

          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-block p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17h4.5M4.5 4.5h15a.75.75 0 01.75.75v11.25a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75V5.25a.75.75 0 01.75-.75zM2.25 18h19.5a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75v-.75a.75.75 0 01.75-.75z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery || orgFilter !== ""
              ? "No Matching Devices"
              : "No Connected Devices"}
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            {searchQuery || orgFilter !== ""
              ? "Try adjusting your filters"
              : "Waiting for remote devices to connect"}
          </p>
          {(searchQuery || orgFilter !== "") && (
            <button
              onClick={() => {
                setOrgFilter(dynamicOrgs[0] || "");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Add CSS animation for fade in */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
