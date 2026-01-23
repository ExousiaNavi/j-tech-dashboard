// src/pages/Login.tsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(username, password);
    if (!success) {
      setError("Invalid credentials. Please check your username and password.");
    } else {
      navigate("/");
    }
  };

  const handleDemoLogin = (role: "admin" | "instructor" | "student") => {
    const demoCredentials = {
      admin: { username: "admin@jptech", password: "admin123" },
      instructor: { username: "instructor@jptech", password: "instructor123" },
      student: { username: "student-assistant@jptech", password: "student123" },
    };

    setUsername(demoCredentials[role].username);
    setPassword(demoCredentials[role].password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>

      {/* Network lines animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-px h-32 bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-px h-40 bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-pulse delay-100"></div>
      </div>

      {/* Main login container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Login card */}
        <div className="backdrop-blur-xl bg-gray-900/80 border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            {/* Brand header */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                    JP-Technology
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Computer Lab Monitoring System
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Monitor and manage computer labs across organization
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3 flex items-center gap-2 animate-shake">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Username
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-800 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="relative w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-900/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password field with toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-800 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="relative w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-900/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  required
                  autoComplete="current-password"
                />
                {/* Password toggle button */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
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
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Quick login buttons for demo */}
            <div className="space-y-3">
              <p className="text-xs text-gray-400 text-center">
                School Quick Access (Demo):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  className="px-3 py-2 text-xs bg-red-900/30 hover:bg-red-900/50 border border-red-800/30 rounded-lg text-red-300 hover:text-red-200 transition-colors duration-200"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("instructor")}
                  className="px-3 py-2 text-xs bg-red-900/20 hover:bg-red-900/40 border border-red-800/20 rounded-lg text-red-300 hover:text-red-200 transition-colors duration-200"
                >
                  Instructor
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("student")}
                  className="px-3 py-2 text-xs bg-red-900/10 hover:bg-red-900/30 border border-red-800/10 rounded-lg text-red-300 hover:text-red-200 transition-colors duration-200"
                >
                  Student Assistant
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 text-white font-medium py-3.5 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
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
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Access Dashboard</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-500 text-xs">
              Secure access to JP-Technology Computer Monitoring Platform
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-xs text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1"></span>
                Live monitoring
              </span>
              <span className="text-xs text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Version 1.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}