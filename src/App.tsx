import {
  createBrowserRouter,
  RouterProvider,
  Navigate
} from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import DetectFoodPage from "./pages/DetectFoodPage"
import AIResponsePage from "./pages/AIResponsePage"
import Index from "./pages/Index"
import ProtectedRoute from "./components/ProtectedRoute"
import MainLayout from "./components/MainLayout"
import { Toaster } from "@/components/ui/toaster"
import "./App.css"
import HistoryPage from "./pages/History"
import HistoryDetailPage from "./pages/HistoryDetailPage"
import { AuthProvider } from "@/lib/AuthProvider"
import Payment from "./pages/Payment";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import TrialBlocker from "./components/TrialBlocker";
import WelcomePage from "./pages/WelcomePage";

// Create router with future flags to eliminate deprecation warnings
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
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
    path: "*",
    element: <Navigate to="/" replace />
  }
])

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <RouterProvider router={router} />
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App
