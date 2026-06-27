import { Link } from 'react-router-dom';
import { Pizza, Phone, Mail, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🍕</span>
              <span className="font-display font-bold text-xl text-white">
                Pizza<span className="text-orange-400">App</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Fresh, hot pizzas delivered to your door in 45 minutes or less.
              Made with love and the finest ingredients.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Instagram size={18} />, href: '#' },
                { icon: <Twitter size={18} />,   href: '#' },
                { icon: <Facebook size={18} />,  href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-9 h-9 bg-gray-800 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/',       label: 'Home'      },
                { to: '/menu',   label: 'Our Menu'  },
                { to: '/build',  label: 'Build Pizza'},
                { to: '/orders', label: 'My Orders' },
                { to: '/cart',   label: 'Cart'      },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-white mb-4">Account</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/login',    label: 'Login'    },
                { to: '/register', label: 'Register' },
                { to: '/profile',  label: 'Profile'  },
                { to: '/orders',   label: 'Orders'   },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">123 Pizza Street, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-orange-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-orange-400 flex-shrink-0" />
                <span className="text-sm text-gray-400">support@pizzaapp.com</span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-gray-800 rounded-xl">
              <p className="text-xs font-semibold text-white mb-1">🕐 Working Hours</p>
              <p className="text-xs text-gray-400">Mon–Sun: 10:00 AM – 11:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {year} PizzaApp. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Made with ❤️ and 🍕 for pizza lovers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;