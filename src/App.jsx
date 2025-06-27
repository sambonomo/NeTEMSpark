import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import Dashboard from "./pages/Dashboard";
import ContractsPage from "./pages/ContractsPage";
import InventoryPage from "./pages/InventoryPage";
import AdvisoryPage from "./pages/AdvisoryPage";
import MacRequestsPage from "./pages/MacRequestsPage";
import BillingPage from "./pages/BillingPage";
import TeamPage from "./pages/TeamPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import SettingsPage from "./pages/SettingsPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import { Box } from "@mui/material";

function AppShell() {
  const location = useLocation();
  // Only show sidebar/navbar for private routes
  if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/pricing") {
    return (
      <>
        <Navbar showSidebar={false} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </>
    );
  }
  // Authenticated routes with sidebar/navbar
  return (
    <PrivateRoute>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <Navbar showSidebar={true} />
          <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/advisory" element={<AdvisoryPage />} />
              <Route path="/mac-requests" element={<MacRequestsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/audit-trail" element={<AuditTrailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
