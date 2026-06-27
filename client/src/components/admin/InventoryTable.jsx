import { Edit2, Trash2, TrendingDown, Package } from 'lucide-react';

const InventoryTable = ({ items, onEdit, onDelete, onUpdateStock }) => {
  const getStockBadge = (item) => {
    if (item.quantity === 0)
      return <span className="badge-danger badge">Out of Stock</span>;
    if (item.quantity <= item.threshold)
      return <span className="badge-warning badge">Low Stock</span>;
    return <span className="badge-success badge">In Stock</span>;
  };

  if (!items?.length) {
    return (
      <div className="empty-state">
        <Package size={48} className="text-gray-300 mb-4" />
        <p className="empty-state-title">No inventory items found</p>
        <p className="empty-state-text">Add ingredients to get started</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Threshold</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      📦
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.unit}</p>
                  </div>
                </div>
              </td>
              <td>
                <span className="capitalize text-sm">{item.category}</span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${item.quantity <= item.threshold ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.quantity}
                  </span>
                  {item.quantity <= item.threshold && (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                </div>
              </td>
              <td className="text-sm text-gray-500">{item.threshold}</td>
              <td className="text-sm font-medium text-gray-900">₹{item.price}</td>
              <td>{getStockBadge(item)}</td>
              <td>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateStock(item)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Update Stock"
                  >
                    <Package size={15} />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;