import { useState, useEffect } from 'react';
import { useNavigate, Link }   from 'react-router-dom';
import {
  ShoppingCart, ChevronRight, ChevronLeft,
  Check, RotateCcw, Lock, ArrowRight,
} from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import PizzaBuilderStep from '../../components/pizza/PizzaBuilderStep';
import LoadingSpinner   from '../../components/common/LoadingSpinner';
import useCart          from '../../hooks/useCart';
import useAuth          from '../../hooks/useAuth';
import { PIZZA_SIZES }  from '../../utils/constants';
import { formatPrice }  from '../../utils/formatter';
import toast            from 'react-hot-toast';

// ── Steps ──
const STEPS = [
  { id: 0, title: 'Choose Base',       icon: '🫓', category: 'base',      required: true,  multi: false },
  { id: 1, title: 'Choose Sauce',      icon: '🍅', category: 'sauce',     required: true,  multi: false },
  { id: 2, title: 'Choose Cheese',     icon: '🧀', category: 'cheese',    required: true,  multi: false },
  { id: 3, title: 'Choose Vegetables', icon: '🥦', category: 'vegetable', required: false, multi: true  },
];

// ── Login Gate ──
const LoginGate = () => {
  const handleLogin = () =>
    document.dispatchEvent(new CustomEvent('openAuthModal', { detail: 'login' }));
  const handleSignup = () =>
    document.dispatchEvent(new CustomEvent('openAuthModal', { detail: 'signup' }));

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto">
            <span className="text-5xl">🍕</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
            <Lock size={18} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">
          Login to Build Your Pizza
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Create your perfect custom pizza. You need an account to order.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button onClick={handleLogin}  className="btn-primary btn-lg">🔑 Sign In</button>
          <button onClick={handleSignup} className="btn-outline btn-lg">✨ Create Free Account</button>
        </div>
        <p className="text-sm text-gray-400">
          Just browsing?{' '}
          <Link to="/menu" className="text-orange-500 font-semibold hover:text-orange-600">
            View our menu →
          </Link>
        </p>
      </div>
    </div>
  );
};

// ── Step Indicator ──
const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
    {STEPS.map((step, i) => {
      const done   = i < currentStep;
      const active = i === currentStep;
      return (
        <div key={step.id} className="flex items-center gap-1 sm:gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
            active ? 'bg-orange-500 text-white shadow-md'
            : done  ? 'bg-green-100 text-green-700'
            :          'bg-gray-100 text-gray-400'
          }`}>
            <span>{done ? '✓' : step.icon}</span>
            <span className="hidden sm:inline">{step.title.replace('Choose ', '')}</span>
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
          )}
        </div>
      );
    })}
    {/* Review step indicator */}
    <div className="flex items-center gap-1 sm:gap-2">
      <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
        currentStep >= STEPS.length
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-400'
      }`}>
        <span>📋</span>
        <span className="hidden sm:inline">Review</span>
      </div>
    </div>
  </div>
);

// ── Sidebar Price ──
const PriceSidebar = ({ selections, inventory, size }) => {
  const getItem = (category, id) =>
    inventory[category]?.find((i) => i._id === id);

  const selectedItems = [
    getItem('base',      selections.base),
    getItem('sauce',     selections.sauce),
    getItem('cheese',    selections.cheese),
    ...(selections.vegetables || []).map((id) => getItem('vegetable', id)),
  ].filter(Boolean);

  const basePrice = selectedItems.reduce((s, i) => s + (i?.price || 0), 0);
  const mult = { small: 1, medium: 1.5, large: 2 };
  const total = Math.round(basePrice * (mult[size] || 1));

  return (
    <div className="space-y-4">
      {/* Price box */}
      <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
        <h3 className="font-bold text-gray-900 mb-3 text-sm">🧾 Price Breakdown</h3>
        {selectedItems.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">
            Select ingredients to see price
          </p>
        ) : (
          <>
            <div className="space-y-1.5 mb-3">
              {selectedItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-2">{item.name}</span>
                  <span className="font-medium text-gray-700 flex-shrink-0">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-orange-200 pt-2 space-y-1 mb-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Base price</span>
                <span>{formatPrice(basePrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Size ({size})</span>
                <span>×{mult[size]}</span>
              </div>
            </div>
            <div className="flex justify-between font-display font-bold text-orange-500">
              <span>Total</span>
              <span className="text-xl">{formatPrice(total)}</span>
            </div>
          </>
        )}
      </div>

      {/* Selections summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3 text-sm">📋 Your Selections</h3>
        <div className="space-y-2">
          {STEPS.map((s) => {
            const isEmpty = s.category === 'vegetable'
              ? !selections.vegetables?.length
              : !selections[s.category];

            const value = s.category === 'vegetable'
              ? selections.vegetables
                  ?.map((id) => inventory.vegetable?.find((i) => i._id === id)?.name)
                  .filter(Boolean).join(', ') || 'None'
              : inventory[s.category]?.find((i) => i._id === selections[s.category])?.name;

            return (
              <div key={s.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-xl">
                <span className="text-base flex-shrink-0">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">{s.title}</p>
                  <p className={`text-sm font-medium truncate ${
                    isEmpty ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {value || 'Not selected'}
                  </p>
                </div>
                {!isEmpty && (
                  <Check size={13} className="text-green-500 flex-shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
        <h3 className="font-semibold text-orange-800 text-sm mb-2">💡 Tips</h3>
        <ul className="space-y-1 text-xs text-orange-700">
          <li>• Base, sauce &amp; cheese are required</li>
          <li>• Vegetables are optional</li>
          <li>• Larger sizes = more value!</li>
        </ul>
      </div>
    </div>
  );
};

// ── Review Panel ──
const ReviewPanel = ({
  selections, inventory, selectedSize,
  setSelectedSize, pizzaName, setPizzaName,
  onReset, onAddToCart, calculatePrice,
}) => {
  const getItemName = (category, id) =>
    inventory[category]?.find((i) => i._id === id)?.name || null;

  const vegNames = (selections.vegetables || [])
    .map((id) => inventory.vegetable?.find((i) => i._id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const isReady = selections.base && selections.sauce && selections.cheese;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Check size={20} className="text-green-600" />
        </div>
        <div>
          <h2 className="font-display font-bold text-gray-900 text-xl">
            Review Your Pizza
          </h2>
          <p className="text-sm text-gray-500">Almost done! Name it and pick a size.</p>
        </div>
      </div>

      {/* Pizza name */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Give Your Pizza a Name
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={pizzaName}
          onChange={(e) => setPizzaName(e.target.value)}
          placeholder="e.g. My Spicy Delight 🌶️"
          maxLength={50}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm outline-none"
        />
      </div>

      {/* Ingredients summary */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Your Ingredients</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '🫓', label: 'Base',       value: getItemName('base',   selections.base)   },
            { icon: '🍅', label: 'Sauce',      value: getItemName('sauce',  selections.sauce)  },
            { icon: '🧀', label: 'Cheese',     value: getItemName('cheese', selections.cheese) },
            { icon: '🥦', label: 'Vegetables', value: vegNames || 'None'                       },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs text-gray-500 font-medium">{item.label}</span>
              </div>
              <p className={`text-sm font-semibold truncate ${
                item.value && item.value !== 'None'
                  ? 'text-gray-900'
                  : item.label === 'Vegetables'
                  ? 'text-gray-400'
                  : 'text-red-400'
              }`}>
                {item.value || 'Not selected ⚠️'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Choose Size</p>
        <div className="grid grid-cols-3 gap-3">
          {PIZZA_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => setSelectedSize(size.value)}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                selectedSize === size.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300 bg-white'
              }`}
            >
              <p className={`font-display font-bold text-lg ${
                selectedSize === size.value ? 'text-orange-600' : 'text-gray-900'
              }`}>
                {size.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{size.description}</p>
              <p className={`text-sm font-semibold mt-1 ${
                selectedSize === size.value ? 'text-orange-500' : 'text-gray-500'
              }`}>
                ×{size.multiplier}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Total price */}
      <div className="bg-orange-50 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Price</p>
          <p className="text-xs text-gray-400 capitalize">
            {selectedSize} size
          </p>
        </div>
        <p className="text-3xl font-display font-bold text-orange-500">
          {formatPrice(calculatePrice())}
        </p>
      </div>

      {/* Warning if missing required */}
      {!isReady && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
          <p className="text-sm text-red-700 font-medium">
            Please go back and select Base, Sauce and Cheese
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm transition-all"
        >
          <RotateCcw size={15} />
          Start Over
        </button>
        <button
          onClick={onAddToCart}
          disabled={!isReady}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            isReady
              ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm hover:shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingCart size={18} />
          Add to Cart — {formatPrice(calculatePrice())}
        </button>
      </div>
    </div>
  );
};

// ── Main BuildPizza ──
const BuildPizza = () => {
  const navigate            = useNavigate();
  const { addToCart }       = useCart();
  const { isAuthenticated } = useAuth();

  const [currentStep,  setCurrentStep]  = useState(0);
  const [showReview,   setShowReview]   = useState(false); // ← separate state
  const [inventory,    setInventory]    = useState({
    base: [], sauce: [], cheese: [], vegetable: [],
  });
  const [loading,      setLoading]      = useState(true);
  const [selections,   setSelections]   = useState({
    base: null, sauce: null, cheese: null, vegetables: [],
  });
  const [selectedSize, setSelectedSize] = useState('medium');
  const [pizzaName,    setPizzaName]    = useState('');

  // ── Fetch inventory ──
  useEffect(() => {
    const fetch = async () => {
      try {
        const res     = await inventoryService.getAllInventory({ available: true });
        const grouped = res.data?.grouped || {};
        setInventory({
          base:      grouped.base      || [],
          sauce:     grouped.sauce     || [],
          cheese:    grouped.cheese    || [],
          vegetable: grouped.vegetable || [],
        });
      } catch (err) {
        toast.error('Failed to load ingredients');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Auth gate ──
  if (!isAuthenticated) return <LoginGate />;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading ingredients..." />
      </div>
    );
  }

  const step = STEPS[currentStep];

  const getCurrentSelection = () =>
    step.category === 'vegetable' ? selections.vegetables : selections[step.category];

  const handleSelect = (value) => {
    if (step.category === 'vegetable') {
      setSelections((p) => ({ ...p, vegetables: value }));
    } else {
      setSelections((p) => ({ ...p, [step.category]: value }));
    }
  };

  const canProceed = () => {
    if (!step.required || step.category === 'vegetable') return true;
    return !!selections[step.category];
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error(`Please select a ${step.title.replace('Choose ', '')}`);
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      // Last step → show review
      setShowReview(true);
    }
  };

  const handleBack = () => {
    if (showReview) {
      setShowReview(false);   // go back from review to last step
    } else if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
    }
  };

  const calculatePrice = () => {
    const items = [
      inventory.base.find((i)      => i._id === selections.base),
      inventory.sauce.find((i)     => i._id === selections.sauce),
      inventory.cheese.find((i)    => i._id === selections.cheese),
      ...(selections.vegetables || []).map((id) =>
        inventory.vegetable.find((i) => i._id === id)
      ),
    ].filter(Boolean);

    const base = items.reduce((s, i) => s + (i?.price || 0), 0);
    const mult = { small: 1, medium: 1.5, large: 2 };
    return Math.round(base * (mult[selectedSize] || 1));
  };

  const handleAddToCart = () => {
    if (!selections.base || !selections.sauce || !selections.cheese) {
      toast.error('Please select base, sauce and cheese');
      return;
    }

    const name  = pizzaName.trim() || 'My Custom Pizza';
    const price = calculatePrice();

    addToCart({
      cartId:   `custom_${Date.now()}_${Math.random()}`,
      itemType: 'custom',
      name,
      size:     selectedSize,
      price,
      image:    '',
      customPizza: {
        base:       selections.base,
        sauce:      selections.sauce,
        cheese:     selections.cheese,
        vegetables: selections.vegetables || [],
      },
    });

    toast.success(`${name} added to cart! 🍕`);
    navigate('/cart');
  };

  const handleReset = () => {
    setSelections({ base: null, sauce: null, cheese: null, vegetables: [] });
    setCurrentStep(0);
    setShowReview(false);
    setPizzaName('');
    setSelectedSize('medium');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            🍕 Build Your Pizza
          </h1>
          <p className="text-orange-100">
            Customise every ingredient to your taste
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step indicator */}
        <StepIndicator currentStep={showReview ? STEPS.length : currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main Panel ── */}
          <div className="lg:col-span-2">

            {/* ── Show Review ── */}
            {showReview ? (
              <ReviewPanel
                selections={selections}
                inventory={inventory}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                pizzaName={pizzaName}
                setPizzaName={setPizzaName}
                onReset={handleReset}
                onAddToCart={handleAddToCart}
                calculatePrice={calculatePrice}
              />
            ) : (
              /* ── Builder Step ── */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {/* Step header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-gray-900 text-xl">
                      Step {currentStep + 1}: {step.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {step.multi
                        ? 'Select as many as you like'
                        : 'Select one option'}
                      {step.required && (
                        <span className="text-red-500 ml-1 font-bold">*</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Ingredient grid */}
                <PizzaBuilderStep
                  title=""
                  items={inventory[step.category] || []}
                  selectedIds={getCurrentSelection()}
                  onSelect={handleSelect}
                  multiSelect={step.multi}
                  required={step.required}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>

                  <span className="text-sm text-gray-400 font-medium">
                    {currentStep + 1} of {STEPS.length}
                  </span>

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    {currentStep === STEPS.length - 1 ? (
                      <>Review Pizza <Check size={16} /></>
                    ) : (
                      <>Next <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Back button when in review */}
            {showReview && (
              <button
                onClick={handleBack}
                className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                <ChevronLeft size={16} />
                Back to ingredients
              </button>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div>
            <PriceSidebar
              selections={selections}
              inventory={inventory}
              size={selectedSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildPizza;