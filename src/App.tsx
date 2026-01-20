// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import SystemStatus from "./pages/SystemStatus";
import { WebSocketProvider } from "./context/WebSocketContext";
import { OrgProvider } from "./context/OrgContext"; // <-- import OrgProvider

function App() {
  return (
    <WebSocketProvider>
      <OrgProvider> {/* <-- wrap everything that needs useOrg */}
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="system-status" element={<SystemStatus />} />
            </Route>
          </Routes>
        </Router>
      </OrgProvider>
    </WebSocketProvider>
  );
}

export default App;



