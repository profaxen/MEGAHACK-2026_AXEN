import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import * as Toast from "@radix-ui/react-toast";
import { initializeData } from "@/lib/firebase";
import { Navbar } from "@/components/layout/Navbar";
import { PageWrapper } from "@/components/PageWrapper";
import { Home } from "@/pages/Home";
import { Dashboard } from "@/pages/Dashboard";
import { EventDetail } from "@/pages/EventDetail";
import { Analytics } from "@/pages/Analytics";
import { Reports } from "@/pages/Reports";

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    initializeData();
  }, []);

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PageWrapper>
                <Dashboard />
              </PageWrapper>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <PageWrapper>
                <EventDetail />
              </PageWrapper>
            }
          />
          <Route
            path="/analytics"
            element={
              <PageWrapper>
                <Analytics />
              </PageWrapper>
            }
          />
          <Route
            path="/reports"
            element={
              <PageWrapper>
                <Reports />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <Toast.Provider swipeDirection="right">
      <AppContent />
      <Toast.Viewport
        className="fixed bottom-6 right-6 z-[100]"
        style={{ outline: "none" }}
      />
    </Toast.Provider>
  );
}
