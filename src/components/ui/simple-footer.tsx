import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Heart,
} from "lucide-react";

export const SimpleFooter = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
          {/* Brand and copyright */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <img 
                src="/WhatsApp Image 2025-12-14 at 10.21.27 AM.jpeg" 
                alt="TakeAway Logo" 
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="text-lg font-bold text-gray-900">
                TakeAway
              </span>
            </div>
            <p className="text-sm text-gray-600">
              © 2024 TakeAway. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/home"
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Browse Shops
            </Link>
            <Link
              to="/auth"
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/support"
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Support
            </Link>
          </div>

          {/* Social links */}
          <div className="flex items-center space-x-3">
            {[
              { icon: Twitter, href: "https://twitter.com/takeaway" },
              { icon: Facebook, href: "https://facebook.com/takeaway" },
              { icon: Instagram, href: "https://instagram.com/takeaway" },
              {
                icon: Linkedin,
                href: "https://linkedin.com/company/takeaway",
              },
              { icon: Github, href: "https://github.com/takeaway" },
            ].map(({ icon: Icon, href }, index) => (
              <a
                key={index}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-orange-100 flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom divider with love message (optional) */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-red-500" />
            <span>for hungry students</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
