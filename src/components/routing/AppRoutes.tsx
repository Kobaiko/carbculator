import { Routes, Route, Navigate } from "react-router-dom";
import { AuthMiddleware } from "../auth/AuthMiddleware";
import { LoginPage } from "../auth/LoginPage";
import { SignUpPage } from "../auth/SignUpPage";
import { OnboardingPage } from "../auth/OnboardingPage";
import Index from "../../pages/Index";
import { useSession } from '@supabase/auth-helpers-react';

const EmptyPage = () => <div className="p-4">Coming soon...</div>;

export const AppRoutes = () => {
  const session = useSession();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!session ? <LoginPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/signup" 
        element={!session ? <SignUpPage /> : <Navigate to="/onboarding" replace />} 
      />
      <Route
        path="/onboarding"
        element={
          <AuthMiddleware>
            <OnboardingPage />
          </AuthMiddleware>
        }
      />
      <Route
        path="/"
        element={
          <AuthMiddleware>
            <Index />
          </AuthMiddleware>
        }
      />
      <Route
        path="/meals"
        element={
          <AuthMiddleware>
            <EmptyPage />
          </AuthMiddleware>
        }
      />
      <Route
        path="/goals"
        element={
          <AuthMiddleware>
            <EmptyPage />
          </AuthMiddleware>
        }
      />
      <Route
        path="/calendar"
        element={
          <AuthMiddleware>
            <EmptyPage />
          </AuthMiddleware>
        }
      />
      <Route
        path="/water"
        element={
          <AuthMiddleware>
            <EmptyPage />
          </AuthMiddleware>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};