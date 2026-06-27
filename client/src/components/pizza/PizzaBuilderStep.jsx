import { Check } from 'lucide-react';
import { formatPrice, getImageUrl } from '../../utils/formatter';

const PizzaBuilderStep = ({
  title,
  items,
  selectedIds,
  onSelect,
  multiSelect = false,
  required = true,
}) => {
  const isSelected = (id) =>
    multiSelect
      ? selectedIds?.includes(id)
      : selectedIds === id;

  const handleSelect = (id) => {
    if (multiSelect) {
      const current = selectedIds || [];
      if (current.includes(id)) {
        onSelect(current.filter((i) => i !== id));
      } else {
        onSelect([...current, id]);
      }
    } else {
      onSelect(id === selectedIds ? null : id);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-display font-semibold text-gray-900 text-lg">{title}</h3>
        {required && (
          <span className="badge-danger badge text-xs">Required</span>
        )}
        {multiSelect && (
          <span className="badge-info badge text-xs">Choose multiple</span>
        )}
      </div>

      {items?.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-sm">No items available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items?.map((item) => {
            const selected = isSelected(item._id);
            return (
              <button
                key={item._id}
                onClick={() => handleSelect(item._id)}
                disabled={!item.isAvailable}
                className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${!item.isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}`}
              >
                {/* Selected check */}
                {selected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}

                {/* Image */}
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-50">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=🍕'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🧀
                    </div>
                  )}
                </div>

                <p className={`text-xs font-semibold leading-tight ${selected ? 'text-orange-700' : 'text-gray-800'}`}>
                  {item.name}
                </p>
                <p className={`text-xs mt-0.5 font-medium ${selected ? 'text-orange-500' : 'text-gray-400'}`}>
                  {formatPrice(item.price)}
                </p>

                {!item.isAvailable && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl text-xs font-semibold text-gray-500">
                    Unavailable
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PizzaBuilderStep;