import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import {
  MdMenu,
  MdDashboard,
  MdRefresh,
  MdInfo,
  MdBusiness,
  MdMonitor,
} from "react-icons/md";
// import { IoMdRefreshCircle } from "react-icons/io";
import { useTotalPC } from "../hooks/useTotalPC";
import { useOrg } from "../context/OrgContext";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalPC = useTotalPC();
  const { orgs: savedOrgs, refreshOrgs } = useOrg();
  const location = useLocation();

  // NEW: selected org - default to first org if on system-status page
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const isSystemStatusPage = location.pathname === "/system-status";

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-select first org when savedOrgs changes and we're on system-status page
  useEffect(() => {
    if (isSystemStatusPage && !selectedOrg && savedOrgs.length > 0) {
      setSelectedOrg(savedOrgs[0].id);
    }
  }, [savedOrgs, selectedOrg, isSystemStatusPage]);

  const handleRefresh = async () => {
    setIsRefreshing(true); // start spinning

    // Ensure a minimum spin duration
    const minDuration = new Promise((res) => setTimeout(res, 600));

    // Call refreshOrgs (could be sync or async)
    const refreshResult = refreshOrgs();
    if (refreshResult instanceof Promise) await refreshResult;

    await minDuration; // wait at least 600ms
    setIsRefreshing(false); // stop spinning
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        <MdMenu className="text-xl" />
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed md:static top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 text-white flex flex-col z-40
          transform transition-transform duration-300
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-64 md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">JP</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">JP-TECHNOLOGY</h2>
              <p className="text-xs text-gray-400">System Monitoring</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* <ul className="space-y-2">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                <MdMonitor className="text-lg" />
                <span className="text-sm font-medium">Live Monitoring</span>
              </NavLink>
            </li>
          </ul> */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdDashboard className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase">
                  Dashboard
                </h3>
              </div>
            </div>

            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `w-full flex items-center bg-gray-800/10 justify-between px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                        : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                    }`
                  }
                  title={`System Monitoring`}
                >
                  <div className="flex items-center gap-2">
                    <MdMonitor className="text-white" />
                    <span className="text-sm truncate">System Monitoring</span>
                  </div>
                  
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Organization List - Each org links to System Performance */}
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdBusiness className="text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase">
                  Organizations
                </h3>
              </div>

              {/* Refresh Icon Button */}
              <button
                onClick={handleRefresh}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                title="Refresh Organizations"
              >
                <MdRefresh
                  className={`text-lg transition-transform duration-500 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            {savedOrgs.length === 0 ? (
              <p className="text-xs text-gray-500">No organizations found</p>
            ) : (
              <ul className="space-y-1">
                {savedOrgs.map((org) => (
                  <li key={org.id}>
                    <NavLink
                      to="/system-status"
                      state={{ orgId: org.id }}
                      className={({ isActive }) =>
                        `w-full flex items-center bg-gray-800/10 justify-between px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          isActive && selectedOrg === org.id
                            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                        }`
                      }
                      title={`${org.agents?.length || 0} agents`}
                      onClick={() => setSelectedOrg(org.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            (org.agents?.length ?? 0) > 0
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />

                        <span className="text-sm truncate">{org.name}</span>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          selectedOrg === org.id ? "bg-white/20" : "bg-gray-800"
                        }`}
                      >
                        {org.agents?.length || 0}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* System Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <MdInfo className="text-white text-sm" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-200">
                  System Status
                </span>
                <p className="text-xs text-gray-400">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Live Connections</span>
              <span className="text-xs font-bold text-green-400">
                {totalPC} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BACKDROP on MOBILE only */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
        {/* HEADER */}
        <nav className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-white">
              System Monitoring Dashboard
            </h1>
            {selectedOrg && isSystemStatusPage && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-lg">
                <MdBusiness className="text-red-400 text-sm" />
                <span className="text-sm text-gray-200">
                  {savedOrgs.find((o) => o.id === selectedOrg)?.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">AD</span>
                </div>
                <div className="text-left hidden md:flex md:flex-col">
                  <p className="text-sm font-medium text-white">
                    Admin Dashboard
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400"
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
              </button>
            </div>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-2 max-w-[1800px] mx-auto">
            {/* Pass selectedOrg as prop to the outlet pages */}
            <Outlet context={{ selectedOrg, setSelectedOrg }} />
          </div>
        </main>
      </div>
    </div>
  );
}
