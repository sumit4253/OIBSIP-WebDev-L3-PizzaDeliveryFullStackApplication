import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Shield, Star, Truck, Pizza, ChevronRight } from 'lucide-react';
import pizzaService from '../../services/pizzaService';
import PizzaCard from '../../components/pizza/PizzaCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ── Hero Section ──
const Hero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-10">
      {[...Array(20)].map((_, i) => (
        <span
          key={i}
          className="absolute text-4xl select-none"
          style={{
            top:  `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          🍕
        </span>
      ))}
    </div>

    <div className="container-custom relative z-10 py-20 md:py-28">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-white/30">
          🔥 Hot & Fresh — Order Now
        </span>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
          Pizza Made
          <br />
          <span className="text-yellow-300">Your Way</span>
        </h1>

        <p className="text-xl md:text-2xl text-orange-100 mb-10 leading-relaxed">
          Build your perfect pizza from scratch or choose from our chef's favourites.
          Delivered fresh in under 45 minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/menu"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            🍕 Order Now
            <ArrowRight size={20} />
          </Link>
          <Link
            to="/build"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/25 transition-all duration-200"
          >
            🔨 Build Pizza
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 mt-12">
          {[
            { value: '50+',   label: 'Pizza varieties' },
            { value: '45min', label: 'Avg delivery'    },
            { value: '4.8★',  label: 'Customer rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-display font-bold text-yellow-300">{stat.value}</p>
              <p className="text-sm text-orange-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Wave bottom */}
    <div className="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" fill="#f9fafb" />
      </svg>
    </div>
  </section>
);

// ── Features Section ──
const Features = () => {
  const features = [
    {
      icon:  <Truck size={28} className="text-orange-500" />,
      title: 'Fast Delivery',
      desc:  'Hot pizza at your door in 45 minutes or less, guaranteed.',
      bg:    'bg-orange-50',
    },
    {
      icon:  <Pizza size={28} className="text-green-500" />,
      title: 'Fresh Ingredients',
      desc:  'We use only the freshest, locally sourced ingredients daily.',
      bg:    'bg-green-50',
    },
    {
      icon:  <Star size={28} className="text-yellow-500" />,
      title: 'Build Your Own',
      desc:  'Customise every ingredient to make your perfect pizza.',
      bg:    'bg-yellow-50',
    },
    {
      icon:  <Shield size={28} className="text-blue-500" />,
      title: 'Secure Payment',
      desc:  'Pay safely with Razorpay — UPI, cards, net banking all accepted.',
      bg:    'bg-blue-50',
    },
  ];

  return (
    <section className="section bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">Why Choose Pizza App?</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            We're not just another pizza place. We're your pizza partner.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 text-center hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── How It Works ──
const HowItWorks = () => {
  const steps = [
    { step: '01', icon: '🍕', title: 'Choose Your Pizza', desc: 'Pick from our menu or build your own' },
    { step: '02', icon: '🛒', title: 'Add to Cart',       desc: 'Select size and add to your cart'     },
    { step: '03', icon: '💳', title: 'Pay Securely',      desc: 'Multiple payment options available'    },
    { step: '04', icon: '🛵', title: 'Get Delivered',     desc: 'Track in real-time to your door'       },
  ];

  return (
    <section className="section bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">How It Works</h2>
          <p className="text-gray-500">Order in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-orange-100 z-0" />

          {steps.map((s, i) => (
            <div key={s.step} className="relative z-10 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl mx-auto border-2 border-orange-100">
                  {s.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Featured Pizzas ──
const FeaturedPizzas = ({ pizzas, loading }) => (
  <section className="section bg-gray-50">
    <div className="container-custom">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="section-title mb-1">⭐ Featured Pizzas</h2>
          <p className="text-gray-500 text-sm">Our most loved pizzas</p>
        </div>
        <Link
          to="/menu"
          className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors"
        >
          View all <ChevronRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading pizzas..." />
        </div>
      ) : pizzas.length === 0 ? (
        <div className="empty-state">
          <p className="text-5xl mb-4">🍕</p>
          <p className="empty-state-title">No featured pizzas yet</p>
          <p className="empty-state-text">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pizzas.map((pizza) => (
            <PizzaCard key={pizza._id} pizza={pizza} />
          ))}
        </div>
      )}
    </div>
  </section>
);

// ── Build Pizza CTA ──
const BuildCTA = () => (
  <section className="section">
    <div className="container-custom">
      <div className="bg-gradient-pizza rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-20 text-[180px] select-none pr-4">
          🍕
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Can't find what you want?
          </h2>
          <p className="text-orange-100 text-lg mb-8">
            Build your dream pizza from scratch! Choose your base, sauce,
            cheese and vegetables — exactly how you like it.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all duration-200 hover:shadow-lg"
          >
            🔨 Start Building
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// ── Main Home Component ──
const Home = () => {
  const [featuredPizzas, setFeaturedPizzas] = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    pizzaService.getFeaturedPizzas()
      .then((res) => setFeaturedPizzas(res.data?.pizzas || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <Hero />
      <Features />
      <HowItWorks />
      <FeaturedPizzas pizzas={featuredPizzas} loading={loading} />
      <BuildCTA />
    </div>
  );
};

export default Home;