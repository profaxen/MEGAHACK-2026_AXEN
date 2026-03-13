import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import { initializeData } from "./lib/firebase";
import { useEffect } from "react";

export function App(): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    void initializeData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default App;

