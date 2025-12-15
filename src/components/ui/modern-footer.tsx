import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin, Mail, ExternalLink } from "lucide-react";

export const ModernFooter = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/WhatsApp Image 2025-12-14 at 10.21.27 AM.jpeg" 
                alt="TakeAway Logo" 
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold text-gray-900">
                TakeAway
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              The smart way to order food on campus. Skip the lines, track your
              order, and enjoy your meal without the wait.
            </p>
            <div className="flex items-center space-x-4">
              {[
                {
                  icon: Twitter,
                  href: "https://twitter.com",
                  label: "Twitter",
                },
                { icon: Github, href: "https://github.com", label: "GitHub" },
                {
                  icon: Linkedin,
                  href: "https://linkedin.com",
                  label: "LinkedIn",
                },
                {
                  icon: Mail,
                  href: "mailto:hello@takeaway.com",
                  label: "Email",
                },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  className="w-10 h-10 rounded-lg bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 flex items-center justify-center text-gray-600 hover:text-orange-600 transition-all duration-200 group"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <div className="space-y-3">
              {[
                { name: "Browse Shops", href: "/home" },
                { name: "How It Works", href: "/#how-it-works" },
                { name: "For Students", href: "/auth" },
                { name: "For Shopkeepers", href: "/auth" },
                { name: "Pricing", href: "/#pricing" },
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Support links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <div className="space-y-3">
              {[
                { name: "Help Center", href: "/help" },
                { name: "Contact Us", href: "/contact" },
                { name: "Campus Locations", href: "/locations" },
                { name: "System Status", href: "/status", external: true },
                { name: "Report Issue", href: "/report" },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="flex items-center text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200"
                >
                  {link.name}
                  {link.external && <ExternalLink className="h-3 w-3 ml-1" />}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
              © 2024 TakeAway, Inc. All rights reserved.
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Link
                to="/privacy"
                className="text-gray-600 hover:text-orange-600 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-600 hover:text-orange-600 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="text-gray-600 hover:text-orange-600 transition-colors duration-200"
              >
                Cookies
              </Link>
              <Link
                to="/accessibility"
                className="text-gray-600 hover:text-orange-600 transition-colors duration-200"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
