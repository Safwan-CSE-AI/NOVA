import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlanPage } from './pages/PlanPage';
import { CoachPage } from './pages/CoachPage';
import { LearnPage } from './pages/LearnPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navbar } from './components/Navbar';

// Loading spinner component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#080B11] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-600/30" />
        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
      </div>
      <p className="text-zinc-400 text-sm font-medium animate-pulse">Initializing NOVA...</p>
    </div>
  </div>
);

// Protected route that requires auth
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Onboarding guard - redirect to onboarding if not onboarded
const OnboardedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

// Guest-only route (redirect to dashboard if logged in)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user?.isOnboarded) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-[#080B11]">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Guest only */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Auth required, onboarding not required */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* Fully authenticated + onboarded */}
        <Route path="/dashboard" element={<OnboardedRoute><DashboardPage /></OnboardedRoute>} />
        <Route path="/plan" element={<OnboardedRoute><PlanPage /></OnboardedRoute>} />
        <Route path="/coach" element={<OnboardedRoute><CoachPage /></OnboardedRoute>} />
        <Route path="/learn" element={<OnboardedRoute><LearnPage /></OnboardedRoute>} />
        <Route path="/settings" element={<OnboardedRoute><SettingsPage /></OnboardedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
