import { useState } from 'react';
import { ShoppingCart, Star, Clock } from 'lucide-react';
import { formatPrice, getImageUrl } from '../../utils/formatter';
import { PIZZA_SIZES } from '../../utils/constants';
import useCart from '../../hooks/useCart';
import toast from 'react-hot-toast';

const PizzaCard = ({ pizza }) => {
  const [selectedSize, setSelectedSize] = useState('medium');
  const { addToCart } = useCart();

  const price = pizza.price?.[selectedSize] || 0;

  const handleAddToCart = () => {
    addToCart({
      itemType: 'preset',
      pizza,
      name:     pizza.name,
      size:     selectedSize,
      price,
      image:    pizza.image,
    });
    toast.success(`${pizza.name} added to cart! 🍕`);
  };

  return (
    <div className="card-hover group">
      {/* Image */}
      <div className="relative overflow-hidden h-48">
        <img
          src={getImageUrl(pizza.image)}
          alt={pizza.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=🍕'; }}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {pizza.isFeatured && (
            <span className="badge-orange badge text-xs">⭐ Featured</span>
          )}
          <span className={`badge text-xs ${pizza.category === 'veg' ? 'bg-green-100 text-green-700' : pizza.category === 'vegan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {pizza.category === 'veg' ? '🟢 Veg' : pizza.category === 'vegan' ? '🌱 Vegan' : '🔴 Non-Veg'}
          </span>
        </div>
        {!pizza.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-semibold text-sm px-3 py-1.5 rounded-xl">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight line-clamp-1">
            {pizza.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-600">
              {pizza.ratings?.average?.toFixed(1) || '4.5'}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {pizza.description}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <Clock size={12} />
          <span>~{pizza.preparationTime || 20} mins</span>
        </div>

        {/* Size Selector */}
        <div className="flex gap-1.5 mb-3">
          {PIZZA_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => setSelectedSize(size.value)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all duration-200 ${
                selectedSize === size.value
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">Starting from</p>
            <p className="text-xl font-display font-bold text-orange-500">
              {formatPrice(price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!pizza.isAvailable}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;