import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
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
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Clock,
      title: "Skip the Queue",
      description:
        "Order ahead and get a pickup time. No more waiting in long food court lines.",
    },
    {
      icon: Smartphone,
      title: "Smart Ordering",
      description:
        "Browse menus from all campus shops in one place. Easy mobile ordering.",
    },
    {
      icon: Users,
      title: "Real-Time Crowds",
      description:
        "See which shops are busy and get suggestions for faster service.",
    },
    {
      icon: CheckCircle,
      title: "Token System",
      description:
        "Get a unique token number and estimated pickup time for every order.",
    },
  ];

  const stats = [
    { number: "30+", label: "Campus Shops" },
    { number: "5k+", label: "Happy Students" },
    { number: "15min", label: "Avg. Wait Time" },
    { number: "98%", label: "On-Time Pickup" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full animate-bounce blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-orange-500 to-red-400 rounded-full animate-ping blur-lg"></div>
          <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse blur-xl"></div>
        </div>

        <div className="relative text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 animate-bounce shadow-lg hover:shadow-orange-200/50 transition-all duration-300 transform hover:scale-105">
            <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
            Revolutionizing Campus Dining
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent leading-tight animate-fade-in transform hover:scale-105 transition-transform duration-500">
            Skip the Queue,
            <br />
            <span className="relative">
              Savor the Food
              <div className="absolute -bottom-4 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-30 animate-pulse"></div>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed animate-fade-in-delay">
            Order from any campus food shop, get a token, and pick up your meal
            when it's ready. No more waiting in crowded food courts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
            <Link to="/home">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  Browse Shops
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
                  Join as Shopkeeper
                  <TrendingUp className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center mt-8 text-sm text-gray-500 animate-fade-in-delay-3">
            <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <Star className="h-4 w-4 text-yellow-500 mr-2 animate-pulse" />
              <span>Trusted by 5,000+ students across campus</span>
            </div>
          </div>

          {/* Floating food emojis */}
          <div className="absolute top-10 left-1/4 text-4xl animate-bounce opacity-70">
            🍕
          </div>
          <div className="absolute top-32 right-1/4 text-3xl animate-pulse opacity-70">
            🍔
          </div>
          <div className="absolute bottom-20 left-1/3 text-3xl animate-bounce delay-1000 opacity-70">
            🥗
          </div>
          <div className="absolute bottom-32 right-1/5 text-4xl animate-pulse delay-2000 opacity-70">
            🍜
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Why Choose CampusEats?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built specifically for university food courts to eliminate wait
            times and improve your dining experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-0 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 bg-white/80 backdrop-blur-sm transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 text-center relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

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

                {/* Hover effect border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-200 rounded-lg transition-all duration-300"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, fast, and designed for busy students.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-bold mb-6">
              1
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              Browse & Order
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Choose from 30+ campus food shops. Add items to cart and place
              your order in seconds.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-bold mb-6">
              2
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              Get Your Token
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Receive a unique token number and estimated pickup time. Track
              your order status in real-time.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-2xl font-bold mb-6">
              3
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              Skip & Pickup
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Skip the queue entirely. Just show your token at pickup time and
              enjoy your meal.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Skip the Queue?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students who've made their campus dining
            experience better.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Today
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
