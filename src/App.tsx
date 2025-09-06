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
import TrialBlocker from "./components/TrialBlocker";
import TrialTest from "./pages/TrialTest";
import Profile from "./pages/Profile";

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
      <ProtectedRoute>
        <MainLayout>
          <Index />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/ai-kitchen",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AIResponsePage />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/detected",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <DetectFoodPage />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/planner",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Index />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/history",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <HistoryPage />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/history/:id",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <HistoryDetailPage />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/payment",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Payment />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Profile />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Settings />
        </MainLayout>
      </ProtectedRoute>
    )
  },
  {
    path: "/trial-test",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <TrialTest />
        </MainLayout>
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
      <TrialBlocker>
        <div className="App">
          <RouterProvider router={router} />
          <Toaster />
        </div>
      </TrialBlocker>
    </AuthProvider>
  )
}

export default App
