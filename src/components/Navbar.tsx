import { Link } from "react-router-dom"

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex justify-center space-x-4">
        <li>
          <Link to="/" className="hover:text-gray-300">
            Landing Page
          </Link>
        </li>
        <li>
          <Link to="/ai-detect" className="hover:text-gray-300">
            AI Detect Page
          </Link>
        </li>
        <li>
          <Link to="/meal-planner" className="hover:text-gray-300">
            Meal Planner
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
