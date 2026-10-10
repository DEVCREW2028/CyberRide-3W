import React from "react";
import { NavLink, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Car, 
  BarChart3, 
  Settings, 
  Shield, 
  Zap, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Fingerprint,
  Bluetooth
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { resetFleetToInitial } from "../logic/storage";

export function Sidebar({ isOpen, onClose }) {
  const { addToast } = useToast();

  const handleResetData = () => {
    if (window.confirm("Reset all fleet vehicles and assessment results back to default demo data?")) {
      resetFleetToInitial();
      addToast("Demo data successfully reset to initial baseline.", "info");
      window.location.reload();
    }
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/vehicles", label: "Vehicle Fleet", icon: Car },
    { to: "/fleet", label: "Fleet Security Overview", icon: BarChart3 },
    { to: "/whitelist", label: "Device Whitelisting", icon: Fingerprint },
    { to: "/pairing", label: "Strong BLE Pairing", icon: Bluetooth },
    { to: "/settings", label: "Settings & Disclaimers", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out no-print ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="p-5 border-b border-slate-800">
            <Link to="/dashboard" onClick={onClose} className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight text-white">CyberRide</span>
                  <span className="bg-blue-500/20 text-blue-400 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">3W</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  E-Rickshaw BMS Readiness
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">
              Menu
            </p>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Demo Jump */}
          <div className="px-4 pt-2">
            <div className="bg-slate-850 rounded-xl p-3.5 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Quick Demo
                </span>
                <span className="text-[10px] text-slate-400 font-mono">2-min flow</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-tight mb-2.5">
                Inspect high-risk profile:
              </p>
              <Link
                to="/assessment/CR3W-003"
                onClick={onClose}
                className="w-full py-2 px-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center justify-between transition-colors"
              >
                <span>Assess CR3W-003</span>
                <span className="text-[10px] font-mono bg-rose-500/30 px-1.5 py-0.2 rounded text-rose-200">HIGH RISK</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            type="button"
            onClick={handleResetData}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            title="Reset to default mock vehicles"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>

          <div className="text-[11px] text-slate-400 text-center leading-relaxed">
            Sustainable e-Micromobility Hackathon
          </div>
        </div>
      </aside>
    </>
  );
}
