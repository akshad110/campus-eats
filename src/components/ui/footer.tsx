import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Heart,
  Coffee,
  Users,
  Star,
} from "lucide-react";

export const Footer = () => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    alert("Thanks for subscribing to our newsletter!");
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-500 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-amber-500 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-500 rounded-full animate-ping delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-14 h-14 bg-orange-400 rounded-full animate-pulse delay-3000"></div>
      </div>

      {/* Main footer content */}
      <div className="relative container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
          {/* Brand section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl transform hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-orange-500/50">
                  🍽️
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-50 animate-ping"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                CampusEats
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Revolutionizing campus dining with smart ordering, real-time
              tokens, and queue-free pickup. Making student life deliciously
              convenient.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <button
                  key={index}
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 flex items-center justify-center transform hover:scale-110 hover:rotate-12 transition-all duration-300 shadow-lg hover:shadow-orange-500/50"
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-orange-400 flex items-center">
              <Coffee className="h-5 w-5 mr-2" />
              Quick Links
            </h3>
            <div className="space-y-3">
              {[
                { name: "How It Works", href: "#how-it-works" },
                { name: "Browse Shops", href: "/home" },
                { name: "Student Portal", href: "/auth" },
                { name: "Shopkeeper Login", href: "/auth" },
                { name: "Support Center", href: "#support" },
                { name: "Campus Locations", href: "#locations" },
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-gray-300 hover:text-orange-400 hover:translate-x-2 transition-all duration-300 flex items-center group"
                >
                  <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Categories */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-orange-400 flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Popular Categories
            </h3>
            <div className="space-y-3">
              {[
                "Italian Cuisine",
                "Healthy Options",
                "Fast Food",
                "Asian Delights",
                "Coffee & Beverages",
                "Quick Snacks",
              ].map((category) => (
                <div
                  key={category}
                  className="text-gray-300 hover:text-orange-400 cursor-pointer hover:translate-x-2 transition-all duration-300 flex items-center group"
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 group-hover:animate-pulse"></div>
                  {category}
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter & Contact */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-orange-400 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Stay Connected
            </h3>
            <p className="text-gray-300">
              Get updates on new shops, special offers, and campus dining news.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500 pr-24"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-300"
                >
                  Subscribe
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="flex items-center text-gray-300 hover:text-orange-400 transition-colors duration-300">
                <Phone className="h-4 w-4 mr-3 text-orange-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-orange-400 transition-colors duration-300">
                <Mail className="h-4 w-4 mr-3 text-orange-500" />
                <span>support@campuseats.com</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-orange-400 transition-colors duration-300">
                <MapPin className="h-4 w-4 mr-3 text-orange-500" />
                <span>University Campus, Student Center</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 pt-8 border-t border-gray-700">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "5,000+", label: "Happy Students", icon: Users },
              { number: "30+", label: "Campus Shops", icon: Coffee },
              { number: "50K+", label: "Orders Delivered", icon: Heart },
              { number: "4.9", label: "Average Rating", icon: Star },
            ].map((stat, index) => (
              <div
                key={index}
                className="group transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="h-6 w-6 text-orange-500 mr-2 group-hover:animate-bounce" />
                  <span className="text-2xl font-bold text-orange-400">
                    {stat.number}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 mx-2 text-red-500 animate-pulse" />
              <span>for hungry students everywhere</span>
            </div>

            <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-400">
              <Link
                to="/privacy"
                className="hover:text-orange-400 transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-orange-400 transition-colors duration-300"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="hover:text-orange-400 transition-colors duration-300"
              >
                Cookie Policy
              </Link>
              <Link
                to="/accessibility"
                className="hover:text-orange-400 transition-colors duration-300"
              >
                Accessibility
              </Link>
            </div>

            <div className="text-gray-400 text-sm">
              © 2024 CampusEats. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Floating scroll-to-top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-full shadow-lg hover:shadow-orange-500/50 flex items-center justify-center transform hover:scale-110 transition-all duration-300 z-50"
        aria-label="Scroll to top"
      >
        <ArrowRight className="h-5 w-5 text-white rotate-[-90deg]" />
      </button>
    </footer>
  );
};
