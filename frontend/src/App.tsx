import { createBrowserRouter, RouterProvider,} from "react-router-dom"
import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/AuthProvider"
import { Analytics } from "@/lib/analytics";
import { ROUTE_SEO, updateMeta } from "@/lib/seo";
import MEALLENS_AI_ROUTEE from "./routes/Routes"



const router = createBrowserRouter([
  ...MEALLENS_AI_ROUTEE,
  
])

function App() {
  // Initialize analytics once
  useEffect(() => {
    Analytics.initialize()
    try {
      const path = typeof window !== 'undefined' ? (window.location?.pathname || '/') : '/'
      Analytics.pageview(path)
      const match = ROUTE_SEO[path] || {}
      updateMeta(match)
    } catch (_) { }
  }, [])

  // Listen to route changes for pageviews + SEO
  useEffect(() => {
    const unsubs = router.subscribe(({ location }) => {
      try {
        const path = location.pathname
        Analytics.pageview(path)
        const match = ROUTE_SEO[path] || {}
        updateMeta(match)
      } catch (_) { }
    })
    return () => {
      try { unsubs && (unsubs as any)() } catch (_) { }
    }
  }, [])

  return (
    <AuthProvider>
      <div className="App">
        <RouterProvider router={router}>

        </RouterProvider>
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App
