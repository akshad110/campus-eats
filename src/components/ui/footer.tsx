import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleBrowseShopsClick = (e: React.MouseEvent) => {
    // If user is a shopkeeper, redirect to login page to login as student
    if (user?.role === 'shopkeeper') {
      e.preventDefault();
      navigate('/auth');
    }
    // Otherwise, let the Link component handle navigation normally
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/send-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackForm),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send feedback");
      }

      alert(t("footer.thankYouFeedback"));
      setFeedbackForm({ name: "", email: "", message: "" });
      setIsFeedbackOpen(false);
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert(t("footer.feedbackError"));
    } finally {
      setIsSubmitting(false);
    }
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
                <img 
                  src="/WhatsApp Image 2025-12-14 at 10.21.27 AM.jpeg" 
                  alt="TakeAway Logo" 
                  className="h-12 w-12 rounded-full object-cover transform hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-orange-500/50"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-50 animate-ping"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                TakeAway
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {t("footer.description")}
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
              {t("footer.quickLinks")}
            </h3>
            <div className="space-y-3">
              {[
                { name: t("footer.howItWorks"), href: "/how-it-works" },
                { name: t("footer.browseShops"), href: "/home", isBrowseShops: true },
                { name: t("footer.studentPortal"), href: "/auth" },
                { name: t("footer.shopkeeperLogin"), href: "/auth" },
                { name: t("footer.supportCenter"), href: "#support", isSupportCenter: true },
              ].map((link) => {
                if (link.isSupportCenter) {
                  return (
                    <button
                      key={link.name}
                      onClick={() => setIsFeedbackOpen(true)}
                      className="block w-full text-left text-gray-300 hover:text-orange-400 hover:translate-x-2 transition-all duration-300 flex items-center group"
                    >
                      <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {link.name}
                    </button>
                  );
                }
                return (
                <Link
                  key={link.name}
                  to={link.href}
                    onClick={link.isBrowseShops ? handleBrowseShopsClick : undefined}
                  className="block text-gray-300 hover:text-orange-400 hover:translate-x-2 transition-all duration-300 flex items-center group"
                >
                  <ArrowRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {link.name}
                </Link>
                );
              })}
            </div>
          </div>

          {/* Popular Categories */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-orange-400 flex items-center">
              <Star className="h-5 w-5 mr-2" />
              {t("footer.popularCategories")}
            </h3>
            <div className="space-y-3">
              {[
                t("footer.italianCuisine"),
                t("footer.healthyOptions"),
                t("footer.fastFood"),
                t("footer.asianDelights"),
                t("footer.coffeeBeverages"),
                t("footer.quickSnacks"),
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

          {/* Feedback & Contact */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-orange-400 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              {t("footer.stayConnected")}
            </h3>
            <p className="text-gray-300">
              {t("footer.feedbackPrompt")}
            </p>

            <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transform hover:scale-105 transition-all duration-300"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("footer.sendFeedback")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {t("footer.feedbackTitle")}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    {t("footer.feedbackDescription")}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">
                      {t("footer.name")} *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t("footer.namePlaceholder")}
                      value={feedbackForm.name}
                      onChange={(e) =>
                        setFeedbackForm({ ...feedbackForm, name: e.target.value })
                      }
                      className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      {t("footer.email")} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("footer.emailPlaceholder")}
                      value={feedbackForm.email}
                      onChange={(e) =>
                        setFeedbackForm({ ...feedbackForm, email: e.target.value })
                      }
                      className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700">
                      {t("footer.message")} *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder={t("footer.messagePlaceholder")}
                      value={feedbackForm.message}
                      onChange={(e) =>
                        setFeedbackForm({ ...feedbackForm, message: e.target.value })
                      }
                      className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[120px]"
                      required
                    />
              </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsFeedbackOpen(false)}
                      disabled={isSubmitting}
                    >
                      {t("footer.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("footer.sending") : t("footer.submit")}
                    </Button>
                  </DialogFooter>
            </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              <div className="flex items-center text-gray-300 hover:text-orange-400 transition-colors duration-300">
                <Phone className="h-4 w-4 mr-3 text-orange-500" />
                <span>+91 7875538084</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-orange-400 transition-colors duration-300">
                <Mail className="h-4 w-4 mr-3 text-orange-500" />
                <span>akshadvengurlekar35@gmail.com</span>
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
              { number: "5,000+", label: t("footer.happyStudents"), icon: Users },
              { number: "30+", label: t("footer.campusShops"), icon: Coffee },
              { number: "50K+", label: t("footer.ordersDelivered"), icon: Heart },
              { number: "4.9", label: t("footer.averageRating"), icon: Star },
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-sm text-gray-400">
              <Link
                to="/privacy"
                className="hover:text-orange-400 transition-colors duration-300 whitespace-nowrap"
              >
                {t("footer.privacyPolicy")}
              </Link>
              <Link
                to="/terms"
                className="hover:text-orange-400 transition-colors duration-300 whitespace-nowrap"
              >
                {t("footer.termsOfService")}
              </Link>
              <Link
                to="/cookies"
                className="hover:text-orange-400 transition-colors duration-300 whitespace-nowrap"
              >
                {t("footer.cookiePolicy")}
              </Link>
              <Link
                to="/accessibility"
                className="hover:text-orange-400 transition-colors duration-300 whitespace-nowrap"
              >
                {t("footer.accessibility")}
              </Link>
            </div>

            <div className="text-gray-400 text-sm text-center md:text-left whitespace-nowrap">
              {t("footer.copyright")}
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
