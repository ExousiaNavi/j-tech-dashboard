// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import SystemStatus from "./pages/SystemStatus";
import Login from "./pages/Login";
import { WebSocketProvider } from "./context/WebSocketContext";
import { OrgProvider } from "./context/OrgContext";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Reports from "./pages/Report";

// Disable all logs in production
if (!import.meta.env.DEV) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
}



function App() {
  return (
    <Router>
      <WebSocketProvider>
        <AuthProvider>
          <OrgProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="system-status" element={<SystemStatus />} />
                <Route path="report" element={<Reports />} />
              </Route>
            </Routes>
          </OrgProvider>
        </AuthProvider>
      </WebSocketProvider>
    </Router>
  );
}


export default App;




