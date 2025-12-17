import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Users,
  ShoppingCart,
  Smartphone,
  CheckCircle,
  Star,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const Landing = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLanguageButton, setShowLanguageButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    // Find the actual scroll container
    const findScrollContainer = () => {
      // Check if there's a custom scroll container
      const root = document.getElementById('root');
      if (root && root.scrollHeight > root.clientHeight) {
        return root;
      }
      return window;
    };

    const scrollContainer = findScrollContainer();
    
    const handleScroll = () => {
      let scrollY = 0;
      if (scrollContainer === window) {
        scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      } else {
        scrollY = (scrollContainer as HTMLElement).scrollTop;
      }
      
      // Show/hide scroll to top button
      if (scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Hide language button when scrolling down, show when scrolling up or at top
      if (scrollY < 10) {
        // Always show at the top
        setShowLanguageButton(true);
      } else if (scrollY > lastScrollY && scrollY > 100) {
        // Scrolling down - hide
        setShowLanguageButton(false);
      } else if (scrollY < lastScrollY) {
        // Scrolling up - show
        setShowLanguageButton(true);
      }
      
      setLastScrollY(scrollY);
    };

    // Check initial scroll position
    handleScroll();
    
    if (scrollContainer === window) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      (scrollContainer as HTMLElement).addEventListener("scroll", handleScroll, { passive: true });
      return () => (scrollContainer as HTMLElement).removeEventListener("scroll", handleScroll);
    }
  }, [lastScrollY]);

  const scrollToTop = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the actual scroll container
    const root = document.getElementById('root');
    const html = document.documentElement;
    const body = document.body;
    
    // Check which element is actually scrollable
    const isRootScrollable = root && root.scrollHeight > root.clientHeight;
    const isHtmlScrollable = html.scrollHeight > html.clientHeight;
    const isBodyScrollable = body.scrollHeight > body.clientHeight;
    
    // Use smooth scroll behavior
    const smoothScroll = (element: HTMLElement | Window) => {
      if (element === window) {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } else {
        (element as HTMLElement).scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    };
    
    // Scroll the appropriate container(s)
    if (isRootScrollable && root) {
      smoothScroll(root);
    } else if (isHtmlScrollable) {
      smoothScroll(html);
    } else if (isBodyScrollable) {
      smoothScroll(body);
    } else {
      // Default to window scroll
      smoothScroll(window);
    }
    
    // Also ensure smooth scroll on window as backup
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };
  const features = [
    {
      icon: Clock,
      title: t("feature1Title"),
      description: t("feature1Desc"),
    },
    {
      icon: Smartphone,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: Users,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
    {
      icon: CheckCircle,
      title: t("feature4Title"),
      description: t("feature4Desc"),
    },
  ];

  const stats = [
    { number: "30+", label: t("stats1") },
    { number: "5k+", label: t("stats2") },
    { number: "15min", label: t("stats3") },
    { number: "98%", label: t("stats4") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      {/* Language Selector - Fixed Position - Hidden when scrolling down */}
      <div 
        className={`fixed top-20 right-4 sm:right-6 z-50 transition-opacity duration-300 ${
          showLanguageButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse blur-xl"></div>
          <div className="absolute top-40 right-20 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-bounce blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-r from-orange-500 to-red-400 rounded-full animate-ping blur-lg"></div>
          <div className="absolute bottom-40 right-1/3 w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse blur-xl"></div>
        </div>

        <div className="relative text-center max-w-4xl mx-auto px-2">
          <Badge className="mb-4 sm:mb-6 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 animate-bounce shadow-lg hover:shadow-orange-200/50 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-pulse" />
            {t("badge")}
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent leading-tight animate-fade-in transform hover:scale-105 transition-transform duration-500 px-2">
            {t("title1")}
            <br />
            <span className="relative">
              {t("title2")}
              <div className="absolute -bottom-2 sm:-bottom-4 left-0 right-0 h-1 sm:h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-30 animate-pulse"></div>
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed animate-fade-in-delay px-2 sm:px-4">
            {t("subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            <Link to="/home">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  {t("browseShops")}
                  <ShoppingCart className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </span>
              </Button>
            </Link>

            <Link to="/auth">
              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-orange-200 text-orange-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 hover:text-white hover:border-transparent px-8 py-4 text-lg font-semibold transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center">
                  {t("joinShopkeeper")}
                  <TrendingUp className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center mt-8 text-sm text-gray-500 animate-fade-in-delay-3">
            <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <Star className="h-4 w-4 text-yellow-500 mr-2 animate-pulse" />
              <span>{t("trustedBy")}</span>
            </div>
          </div>

          {/* Floating food emojis - hidden on mobile */}
          <div className="hidden sm:block absolute top-10 left-1/4 text-2xl sm:text-3xl md:text-4xl animate-bounce opacity-70">
            🍕
          </div>
          <div className="hidden sm:block absolute top-32 right-1/4 text-xl sm:text-2xl md:text-3xl animate-pulse opacity-70">
            🍔
          </div>
          <div className="hidden sm:block absolute bottom-20 left-1/3 text-xl sm:text-2xl md:text-3xl animate-bounce delay-1000 opacity-70">
            🥗
          </div>
          <div className="hidden sm:block absolute bottom-32 right-1/5 text-2xl sm:text-3xl md:text-4xl animate-pulse delay-2000 opacity-70">
            🍜
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">
                {stat.number}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
            {t("whyChoose")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            {t("whyChooseDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group !border-2 !border-transparent hover:!border-orange-200 !shadow-lg hover:!shadow-2xl hover:!shadow-orange-500/20 transition-all duration-500 bg-white/80 transform hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background gradient effect - covers full card */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-400/8 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none"></div>

              <CardContent className="p-6 text-center relative z-10">
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white mb-4 group-hover:animate-pulse shadow-lg group-hover:shadow-orange-500/50 transform group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-7 w-7 group-hover:animate-bounce" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
            {t("howItWorks")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            {t("howItWorksDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-2">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-bold mb-6">
              1
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              {t("step1Title")}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t("step1Desc")}
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-bold mb-6">
              2
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              {t("step2Title")}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t("step2Desc")}
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-bold mb-6">
              3
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              {t("step3Title")}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t("step3Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[280px] sm:h-[320px] md:h-[360px]">
          {/* Swiper Carousel */}
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !bg-white/50",
              bulletActiveClass: "swiper-pagination-bullet-active !bg-white",
            }}
            loop={true}
            className="absolute inset-0 w-full h-full"
          >
            <SwiperSlide>
              <div className="w-full h-full">
                <img
                  src="/320750059_11258578.jpg"
                  alt="Food Image 1"
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full">
                <img
                  src="/40778968_8810185.jpg"
                  alt="Food Image 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full">
                <img
                  src="/40778973_8810174.jpg"
                  alt="Food Image 3"
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
          </Swiper>

          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/60"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4 sm:p-6 md:p-8 z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
              {t("ctaTitle")}
          </h2>
            <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-5 opacity-95 px-2 drop-shadow-md max-w-2xl">
              {t("ctaDesc")}
          </p>
          <Link to="/auth">
            <Button
              size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 px-5 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-xl transform hover:scale-105 transition-all duration-200"
            >
                {t("getStarted")}
                <Zap className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-full shadow-lg hover:shadow-orange-500/50 flex items-center justify-center transform hover:scale-110 transition-all duration-300 z-[100] cursor-pointer"
          aria-label="Scroll to top"
          type="button"
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  );
};

export default Landing;
