import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import {
  MdMenu,
  MdDashboard,
  MdShowChart,
  MdNotifications,
  MdBarChart,
  MdDns,
  MdSettings,
  MdInfo,
  // MdFullscreen,
  // MdFullscreenExit,
} from "react-icons/md";
// import { GoBell } from "react-icons/go";
import { IoIosSearch } from "react-icons/io";
import { useTotalPC } from "../hooks/useTotalPC";
// import logo from "../assets/logo.png";

export default function Layout() {
  // const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalPC = useTotalPC();
  const location = useLocation(); // <-- get current path
  // Check if we are on the dashboard page
  const isDashboard = location.pathname === "/";

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
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-64 md:translate-x-0"
          }
        `}
      >
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

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
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
                <MdDashboard className="text-lg" />
                <span className="text-sm font-medium">Live Dashboard</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/system-status"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                <MdShowChart className="text-lg" />
                <span className="text-sm font-medium">System Performance</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/alerts"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                <MdNotifications className="text-lg" />
                <span className="text-sm font-medium">System Alerts</span>
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                <MdBarChart className="text-lg" />
                <span className="text-sm font-medium">Analytics</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/network-status"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                <MdDns className="text-lg" />
                <span className="text-sm font-medium">Network Status</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  }`
                }
              >
                <MdSettings className="text-lg" />
                <span className="text-sm font-medium">Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>

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
              System Monitor Dashboard
            </h1>
            <div className="hidden md:block relative">
              <input
                placeholder="Search computers, systems..."
                className="w-80 pl-10 pr-4 py-2 text-sm bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400"
                type="text"
              />
              <IoIosSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* <div className="relative">
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                <GoBell className="text-xl" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
            </div> */}

            <div className="relative">
              <button className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">AD</span>
                </div>
                <div className="text-left hidden md:flex md:flex-col">
                  <p className="text-sm font-medium text-white">
                    Admin Dashboard
                  </p>
                  {/* <p className="text-xs text-gray-400">System Administrator</p> */}
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

        {/* Stats Bar */}
        {/* Stats Bar: only show on dashboard */}
        {isDashboard && (
          <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-300">Online Systems:</span>
                <span className="text-white font-semibold">{totalPC}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">Streaming:</span>
                <span className="text-white font-semibold">{totalPC}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-300">Offline:</span>
                <span className="text-white font-semibold">0</span>
              </div>
              {/* <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-300">Last Updated:</span>
              <span className="text-white font-semibold">Just now</span>
            </div> */}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <div className="p-2 max-w-[1800px] mx-auto">
            {/* Dashboard Header */}

            {/* Grid Container */}
            <div className="">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
