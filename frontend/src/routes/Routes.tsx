import Login from "@/auth/Login";
import MainLayout from "@/components/MainLayout";
import OrganizationAccessGuard from "@/components/OrganizationAccessGuard";
import ProtectedRoute from "@/auth/ProtectedRoute";
import TrialBlocker from "@/components/TrialBlocker";
import AcceptInvitation from "@/pages/AcceptInvitation";
import AIResponsePage from "@/pages/AIResponsePage";
import DetectFoodPage from "@/pages/DetectFoodPage";
import EnterpriseDashboardRedesign from "@/pages/EnterpriseDashboard";
import ForgotPassword from "@/auth/ForgotPassword";
import HistoryPage from "@/pages/History";
import HistoryDetailPage from "@/pages/HistoryDetailPage";
import Index from "@/pages/Index";
import LogoutAndLogin from "@/auth/LogoutAndLogin";
import Onboarding from "@/auth/Onboarding";
import Payment from "@/pages/Payment";
import Profile from "@/pages/Profile";
import ResetPassword from "@/auth/ResetPassword";
import Signup from "@/auth/Signup";
import WelcomePage from "@/pages/WelcomePage";
import { Settings } from "lucide-react";
import { Navigate } from "react-router-dom";

const MEALLENS_AI_ROUTES = [
  {
    path: "",
    element: <WelcomePage/>,
    children:[
      {
        path: "/",
        element: <WelcomePage/>
      }
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/logout-and-login",
    element: <LogoutAndLogin />
  },
  {
    path: "/onboarding",
    element: <Onboarding />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/reset-password",
    element: <ResetPassword />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute fallback={<WelcomePage />}>
        <Navigate to="/ai-kitchen" replace />
      </ProtectedRoute>
    )
  },
  {
    path: "/landing",
    element: <WelcomePage />
  },
  {
    path: "/ai-kitchen",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <AIResponsePage />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/detected",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <DetectFoodPage />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/planner",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <Index />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/history",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <HistoryPage />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/history/:id",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <HistoryDetailPage />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/payment",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <Payment />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <Profile />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <TrialBlocker>
          <MainLayout>
            <Settings />
          </MainLayout>
        </TrialBlocker>
      </ProtectedRoute>
    )
  },
  {
    path: "/organization/dashboard",
    element: (
      <ProtectedRoute>
        <OrganizationAccessGuard>
          <EnterpriseDashboardRedesign />
        </OrganizationAccessGuard>
      </ProtectedRoute>
    )
  },
  {
    path: "/accept-invitation",
    element: <AcceptInvitation />
  },
  {
    path: "/member",
    element: ""
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]
export default MEALLENS_AI_ROUTES