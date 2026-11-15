import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider } from './context/LanguageContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { OfflineSyncProvider } from './context/OfflineSyncContext.js';

import { Navbar } from './components/Navbar.js';
import { LandingPage } from './pages/LandingPage.js';
import { ProfilePickerPage } from './pages/ProfilePickerPage.js';
import { PinEntryPage } from './pages/PinEntryPage.js';
import { ElderTodayPage } from './pages/ElderTodayPage.js';
import { PillboxPage } from './pages/PillboxPage.js';
import { MedicinesPage } from './pages/MedicinesPage.js';
import { ReceiptsPage } from './pages/ReceiptsPage.js';
import { DutyRosterPage } from './pages/DutyRosterPage.js';
import { CheckinPage } from './pages/CheckinPage.js';
import { AppointmentsPage } from './pages/AppointmentsPage.js';
import { PrivacyDialsPage } from './pages/PrivacyDialsPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ActivityAuditPage } from './pages/ActivityAuditPage.js';
import { DemoSimulatorPage } from './pages/DemoSimulatorPage.js';

// Route guard requiring authenticated member
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentMember, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentMember) {
    return <Navigate to="/profiles" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
    </>
  );
};

// Route to handle one-click action from emails
const ActionRedirect: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');

  React.useEffect(() => {
    if (token) {
      window.location.href = `/api/demo/action?token=${encodeURIComponent(token)}`;
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-heading font-bold text-xl">Action link process ho raha hai...</p>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <OfflineSyncProvider>
              <div className="min-h-screen flex flex-col bg-cream dark:bg-zinc-900 text-deepOlive dark:text-cream">
                <Routes>
                  {/* Public Entry Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/profiles" element={<ProfilePickerPage />} />
                  <Route path="/pin/:memberId" element={<PinEntryPage />} />
                  <Route path="/action" element={<ActionRedirect />} />

                  {/* Protected Courtyard Routes */}
                  <Route
                    path="/aaj"
                    element={
                      <ProtectedRoute>
                        <ElderTodayPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pillbox"
                    element={
                      <ProtectedRoute>
                        <PillboxPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/medicines"
                    element={
                      <ProtectedRoute>
                        <MedicinesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts"
                    element={
                      <ProtectedRoute>
                        <ReceiptsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/duty"
                    element={
                      <ProtectedRoute>
                        <DutyRosterPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkin"
                    element={
                      <ProtectedRoute>
                        <CheckinPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/appointments"
                    element={
                      <ProtectedRoute>
                        <AppointmentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dials"
                    element={
                      <ProtectedRoute>
                        <PrivacyDialsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/activity"
                    element={
                      <ProtectedRoute>
                        <ActivityAuditPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/demo"
                    element={
                      <ProtectedRoute>
                        <DemoSimulatorPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </OfflineSyncProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
