import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./components/LandingPage"
import AIResponsePage from "./components/AIResponsePage"
import DetectFoodPage from "./components/DetectFoodPage"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ai-response" element={<AIResponsePage />} />
          <Route path="/detect-food" element={<DetectFoodPage />} />
          <Route path="/meal-planner" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
