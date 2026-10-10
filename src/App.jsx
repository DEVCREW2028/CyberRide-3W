import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { DemoBanner } from "./components/DemoBanner";
import { Dashboard } from "./pages/Dashboard";
import { Vehicles } from "./pages/Vehicles";
import { VehicleDetails } from "./pages/VehicleDetails";
import { Assessment } from "./pages/Assessment";
import { Results } from "./pages/Results";
import { Remediation } from "./pages/Remediation";
import { Report } from "./pages/Report";
import { Fleet } from "./pages/Fleet";
import { Settings } from "./pages/Settings";
import { Whitelist } from "./pages/Whitelist";
import { Pairing } from "./pages/Pairing";
import { EmptyState } from "./components/EmptyState";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <EmptyState
        title="Page Not Found"
        description="The requested page route does not exist in CyberRide 3W."
        actionLabel="Back to Dashboard"
        onAction={() => navigate("/dashboard")}
      />
    </div>
  );
}

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Persistent Demo Disclaimer Banner */}
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-[calc(100vh-37px)]">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/vehicles/:id" element={<VehicleDetails />} />
              <Route path="/assessment/:id" element={<Assessment />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/remediation/:id" element={<Remediation />} />
              <Route path="/report/:id" element={<Report />} />
              <Route path="/fleet" element={<Fleet />} />
              <Route path="/whitelist" element={<Whitelist />} />
              <Route path="/pairing" element={<Pairing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
