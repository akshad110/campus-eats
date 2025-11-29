import { Link } from "react-router-dom";

export const MinimalFooter = () => {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
              🍽️
            </div>
            <span className="font-semibold text-gray-900">CampusEats</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-8 text-sm">
            <Link
              to="/home"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Browse
            </Link>
            <Link
              to="/auth"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/help"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Help
            </Link>
            <Link
              to="/privacy"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Terms
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500">© 2024 CampusEats</div>
        </div>
      </div>
    </footer>
  );
};
