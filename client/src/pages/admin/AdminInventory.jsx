import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Filter, RefreshCw } from 'lucide-react';
import InventoryTable from '../../components/admin/InventoryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import inventoryService from '../../services/inventoryService';
import { INVENTORY_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

// ── Add/Edit Modal ──
const InventoryModal = ({ item, onClose, onSave }) => {
  const isEdit = !!item?._id;

  const [form, setForm] = useState({
    name:               item?.name               || '',
    category:           item?.category           || 'base',
    description:        item?.description        || '',
    price:              item?.price              || '',
    quantity:           item?.quantity           || '',
    unit:               item?.unit               || 'pieces',
    threshold:          item?.threshold          || 10,
    consumptionPerPizza: item?.consumptionPerPizza || 1,
    displayOrder:       item?.displayOrder       || 0,
    isAvailable:        item?.isAvailable !== undefined ? item.isAvailable : true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview,   setPreview]   = useState(item?.image || '');
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim())  newErrors.name     = 'Name is required';
    if (!form.price)        newErrors.price    = 'Price is required';
    if (form.price < 0)     newErrors.price    = 'Price must be positive';
    if (form.quantity === '') newErrors.quantity = 'Quantity is required';
    if (!form.unit)         newErrors.unit     = 'Unit is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });
      if (imageFile) formData.append('image', imageFile);

      if (isEdit) {
        await inventoryService.updateItem(item._id, formData);
        toast.success('Item updated successfully!');
      } else {
        await inventoryService.createItem(formData);
        toast.success('Item created successfully!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const UNITS = ['kg', 'grams', 'liters', 'ml', 'pieces', 'packets'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-gray-900 text-xl">
            {isEdit ? '✏️ Edit Item' : '➕ Add Inventory Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-dashed border-gray-300">
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
              )}
            </div>
            <div>
              <label className="btn-secondary btn-sm cursor-pointer">
                📷 Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP • Max 5MB</p>
            </div>
          </div>

          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">Item Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Tomato Sauce"
                className={`input-field ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <p className="input-error-msg">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="input-label">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input-field"
              >
                {INVENTORY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Price + Quantity + Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="input-label">Price (₹) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className={`input-field ${errors.price ? 'input-error' : ''}`}
              />
              {errors.price && <p className="input-error-msg">{errors.price}</p>}
            </div>
            <div className="form-group">
              <label className="input-label">Quantity *</label>
              <input
                name="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                className={`input-field ${errors.quantity ? 'input-error' : ''}`}
              />
              {errors.quantity && <p className="input-error-msg">{errors.quantity}</p>}
            </div>
            <div className="form-group">
              <label className="input-label">Unit *</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="input-field"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Threshold + Consumption + Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="input-label">Low Stock Threshold</label>
              <input
                name="threshold"
                type="number"
                min="0"
                value={form.threshold}
                onChange={handleChange}
                className="input-field"
              />
              <p className="input-hint">Alert when qty drops below this</p>
            </div>
            <div className="form-group">
              <label className="input-label">Per Pizza Usage</label>
              <input
                name="consumptionPerPizza"
                type="number"
                min="0"
                step="0.1"
                value={form.consumptionPerPizza}
                onChange={handleChange}
                className="input-field"
              />
              <p className="input-hint">Units used per pizza</p>
            </div>
            <div className="form-group">
              <label className="input-label">Display Order</label>
              <input
                name="displayOrder"
                type="number"
                value={form.displayOrder}
                onChange={handleChange}
                className="input-field"
              />
              <p className="input-hint">Lower = shown first</p>
            </div>
          </div>

          {/* Available toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={form.isAvailable}
              onChange={handleChange}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
              Available for ordering
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              isEdit ? '💾 Update Item' : '➕ Create Item'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Update Stock Modal ──
const UpdateStockModal = ({ item, onClose, onSave }) => {
  const [qty,       setQty]       = useState('');
  const [operation, setOperation] = useState('set');
  const [saving,    setSaving]    = useState(false);

  const handleUpdate = async () => {
    if (!qty || qty < 0) { toast.error('Enter a valid quantity'); return; }
    setSaving(true);
    try {
      await inventoryService.updateStock(item._id, parseInt(qty), operation);
      toast.success('Stock updated!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900">Update Stock</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Item info */}
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="font-semibold text-orange-800">{item.name}</p>
            <p className="text-sm text-orange-600">
              Current stock: <strong>{item.quantity} {item.unit}</strong>
            </p>
          </div>

          {/* Operation */}
          <div className="form-group">
            <label className="input-label">Operation</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'set',      label: 'Set to'  },
                { value: 'add',      label: '+ Add'   },
                { value: 'subtract', label: '- Remove' },
              ].map((op) => (
                <button
                  key={op.value}
                  onClick={() => setOperation(op.value)}
                  className={`py-2 text-xs font-semibold rounded-xl border-2 transition-all ${
                    operation === op.value
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="input-label">Quantity ({item.unit})</label>
            <input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Enter quantity"
              className="input-field"
              autoFocus
            />
          </div>

          {/* Preview */}
          {qty && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <span className="text-gray-600">New stock: </span>
              <strong className="text-gray-900">
                {operation === 'set'
                  ? `${qty} ${item.unit}`
                  : operation === 'add'
                  ? `${item.quantity + parseInt(qty)} ${item.unit}`
                  : `${Math.max(0, item.quantity - parseInt(qty))} ${item.unit}`
                }
              </strong>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose}    className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleUpdate} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Updating...' : '✅ Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──
const DeleteModal = ({ item, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up p-6">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🗑️</div>
        <h2 className="font-display font-bold text-gray-900 text-xl mb-2">Delete Item?</h2>
        <p className="text-gray-500 text-sm">
          Are you sure you want to delete <strong>{item?.name}</strong>?
          This action cannot be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose}   className="btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
      </div>
    </div>
  </div>
);

// ── Main AdminInventory ──
const AdminInventory = () => {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(null);
  // modal: null | { type: 'add'|'edit'|'stock'|'delete', item? }

  const fetchInventory = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await inventoryService.getAllInventory();
      setItems(res.data?.items || []);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleDelete = async () => {
    try {
      await inventoryService.deleteItem(modal.item._id);
      toast.success('Item deleted');
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setModal(null);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch   = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Stats
  const totalItems   = items.length;
  const lowStockCount = items.filter((i) => i.quantity <= i.threshold).length;
  const outOfStock    = items.filter((i) => i.quantity === 0).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="subtitle mt-1">Manage ingredients and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInventory(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 btn-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items',    value: totalItems,    icon: '📦', color: 'bg-blue-50   text-blue-700'   },
          { label: 'In Stock',       value: totalItems - outOfStock, icon: '✅', color: 'bg-green-50  text-green-700'  },
          { label: 'Low Stock',      value: lowStockCount, icon: '⚠️', color: lowStockCount ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700' },
          { label: 'Out of Stock',   value: outOfStock,    icon: '❌', color: outOfStock    ? 'bg-red-50    text-red-700'    : 'bg-gray-50 text-gray-700' },
        ].map((stat) => (
          <div key={stat.label} className={`card p-4 ${stat.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs opacity-75">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({items.length})
            </button>
            {INVENTORY_CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeCategory === cat.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Inventory Table ── */}
      <div className="card overflow-hidden">
        <InventoryTable
          items={filteredItems}
          onEdit={(item) => setModal({ type: 'edit', item })}
          onDelete={(id) => setModal({ type: 'delete', item: items.find((i) => i._id === id) })}
          onUpdateStock={(item) => setModal({ type: 'stock', item })}
        />
      </div>

      {/* ── Modals ── */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <InventoryModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={fetchInventory}
        />
      )}

      {modal?.type === 'stock' && (
        <UpdateStockModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={fetchInventory}
        />
      )}

      {modal?.type === 'delete' && (
        <DeleteModal
          item={modal.item}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default AdminInventory;