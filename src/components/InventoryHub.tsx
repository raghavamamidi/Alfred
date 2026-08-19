import React, { useState } from 'react';
import { 
  Plus, Search, Filter, AlertTriangle, CheckCircle2, Clock, 
  Trash2, ShoppingCart, RefreshCw, Upload, Scan, Refrigerator,
  Archive, Flame, Sparkles, Tag, ChevronDown
} from 'lucide-react';
import { InventoryItem, ItemCategory, StorageLocation, ItemStatus } from '../types';

interface InventoryHubProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onOpenScanModal: () => void;
  onOpenOrderModal: () => void;
  onAddDirectToRestock: (item: InventoryItem) => void;
}

export const InventoryHub: React.FC<InventoryHubProps> = ({
  inventory,
  setInventory,
  onOpenScanModal,
  onOpenOrderModal,
  onAddDirectToRestock,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('Produce & Veggies');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<string>('kg');
  const [newItemLocation, setNewItemLocation] = useState<StorageLocation>('pantry');
  const [newItemDays, setNewItemDays] = useState<number>(7);
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Stats calculation
  const totalCount = inventory.length;
  const criticalItems = inventory.filter((i) => i.status === 'critical' || i.quantity <= 0);
  const depletingItems = inventory.filter((i) => i.status === 'depleting');
  const freshItems = inventory.filter((i) => i.status === 'fresh');

  const filteredInventory = inventory.filter((item) => {
    const matchesLoc = selectedLocation === 'all' || item.storageLocation === selectedLocation;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'low' && (item.status === 'critical' || item.status === 'depleting')) ||
      item.status === selectedStatus;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLoc && matchesStatus && matchesSearch;
  });

  const handleUpdateQuantity = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, Math.round((item.quantity + delta) * 10) / 10);
          let newStatus: ItemStatus = item.status;
          if (newQty === 0) newStatus = 'out_of_stock';
          else if (newQty <= 1 && item.unit !== 'kg') newStatus = 'critical';
          else if (newQty <= 0.5 && item.unit === 'kg') newStatus = 'critical';
          else if (item.status === 'critical' && newQty > 1) newStatus = 'fresh';
          return {
            ...item,
            quantity: newQty,
            status: newStatus,
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit,
      storageLocation: newItemLocation,
      status: newItemDays <= 2 ? 'depleting' : 'fresh',
      estimatedDaysLeft: Number(newItemDays) || 7,
      brand: newItemBrand.trim() || undefined,
      notes: newItemNotes.trim() || undefined,
      lastUpdated: 'Just now',
    };

    setInventory((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    // Reset
    setNewItemName('');
    setNewItemBrand('');
    setNewItemNotes('');
    setNewItemQty(1);
  };

  const locationTabs = [
    { id: 'all', label: 'All Provisions', icon: Archive },
    { id: 'fridge', label: 'Fridge & Chiller', icon: Refrigerator },
    { id: 'produce_basket', label: 'Produce Basket', icon: Tag },
    { id: 'pantry', label: 'Pantry & Dry Staples', icon: Archive },
    { id: 'spice_rack', label: 'Spice Drawer', icon: Flame },
    { id: 'cleaning_shelf', label: 'Hygiene & Cleaners', icon: Sparkles },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="bg-[#f5f9fc] border border-brand-950/10 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-700" />
              <h2 className="text-xl font-serif font-semibold text-stone-900">Household Inventory Ledger</h2>
            </div>
            <p className="text-sm text-stone-600 mt-1">
              Alfred maintains a continuous estimation of your kitchen staples, spices, and fresh produce.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="inv-scan-btn"
              type="button"
              onClick={onOpenScanModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-brand-900 text-brand-50 hover:bg-brand-950 transition-colors shadow-xs"
            >
              <Scan className="w-4 h-4 text-brand-300" />
              <span>Scan Fridge Photo</span>
            </button>
            <button
              id="inv-import-order-btn"
              type="button"
              onClick={onOpenOrderModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-stone-500" />
              <span>Import Quick-Commerce Order</span>
            </button>
            <button
              id="inv-add-item-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-brand-800 text-white hover:bg-brand-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-brand-950/10">
          <div className="bg-white/80 border border-stone-200/80 rounded-xl p-3.5">
            <div className="text-xs text-stone-500 font-medium">Total Provisions</div>
            <div className="text-2xl font-serif font-bold text-stone-900 mt-0.5">{totalCount} items</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Across pantry & chillers</div>
          </div>
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5">
            <div className="text-xs text-rose-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Critical / Run Out</span>
            </div>
            <div className="text-2xl font-serif font-bold text-rose-900 mt-0.5">{criticalItems.length}</div>
            <div className="text-[11px] text-rose-600 mt-0.5">Requires immediate restock</div>
          </div>
          <div className="bg-brand-50/70 border border-brand-200/80 rounded-xl p-3.5">
            <div className="text-xs text-brand-800 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Depleting Soon</span>
            </div>
            <div className="text-2xl font-serif font-bold text-brand-900 mt-0.5">{depletingItems.length}</div>
            <div className="text-[11px] text-brand-700 mt-0.5">~1 to 2 days consumption left</div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
            <div className="text-xs text-emerald-800 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Well Stocked</span>
            </div>
            <div className="text-2xl font-serif font-bold text-emerald-900 mt-0.5">{freshItems.length}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Adequate household supply</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="space-y-3">
        {/* Storage Location Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {locationTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedLocation === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedLocation(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-brand-800 text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Status filter row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search staples, spices, veggies, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-stone-500 hidden sm:inline">Status Filter:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'low', label: 'Needs Restock' },
                { id: 'fresh', label: 'Stocked' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStatus(st.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    selectedStatus === st.id
                      ? 'bg-brand-100 text-brand-950 font-semibold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredInventory.map((item) => {
          const isLow = item.status === 'critical' || item.quantity <= 0;
          const isDepleting = item.status === 'depleting';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-sm flex flex-col justify-between ${
                isLow
                  ? 'border-rose-300 bg-rose-50/20'
                  : isDepleting
                  ? 'border-brand-300 bg-brand-50/20'
                  : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-semibold text-stone-900 mt-0.5 leading-snug">{item.name}</h3>
                    {item.brand && (
                      <span className="text-xs text-stone-500 font-medium">Brand: {item.brand}</span>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      isLow
                        ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                        : isDepleting
                        ? 'bg-brand-100 text-brand-800 border border-brand-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isLow ? 'Critical' : isDepleting ? 'Depleting' : 'Fresh'}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-stone-600 mt-2 bg-stone-50/80 p-2 rounded-lg border border-stone-200/60 font-sans italic">
                    "{item.notes}"
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <span className="capitalize">📍 {item.storageLocation.replace('_', ' ')}</span>
                  <span>⏳ ~{item.estimatedDaysLeft}d supply remaining</span>
                </div>
              </div>

              {/* Controls Footer */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                {/* Quantity adjuster */}
                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.id, -0.5)}
                    className="w-6 h-6 rounded-md bg-white hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold text-stone-900 px-1 min-w-[50px] text-center">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.id, 0.5)}
                    className="w-6 h-6 rounded-md bg-white hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {(isLow || isDepleting) && (
                    <button
                      type="button"
                      onClick={() => onAddDirectToRestock(item)}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-brand-100 hover:bg-brand-200 text-brand-900 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Add to restocking proposal"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Restock</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove from inventory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredInventory.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Refrigerator className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-serif font-semibold text-stone-800">No provisions matched your filter</h3>
          <p className="text-xs text-stone-500 mt-1">Try resetting your search query or storage location filter.</p>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-semibold text-stone-900">Add Household Provision</h3>
                <p className="text-xs text-stone-500">Record a new grocery staple, spice, or fresh item</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Kissan Jam, Fresh Mint / Pudina"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-brand-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="Produce & Veggies">Produce & Veggies</option>
                    <option value="Dairy & Bakery">Dairy & Bakery</option>
                    <option value="Staples & Grains">Staples & Grains</option>
                    <option value="Spices & Masalas">Spices & Masalas</option>
                    <option value="Condiments & Sauces">Condiments & Sauces</option>
                    <option value="Snacks & Beverages">Snacks & Beverages</option>
                    <option value="Household & Cleaning">Household & Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Storage Location</label>
                  <select
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value as StorageLocation)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="fridge">Fridge & Chiller</option>
                    <option value="pantry">Pantry & Dry Shelf</option>
                    <option value="produce_basket">Produce Basket</option>
                    <option value="spice_rack">Spice Drawer</option>
                    <option value="cleaning_shelf">Cleaning Shelf</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="bunch">bunch</option>
                    <option value="pack">pack</option>
                    <option value="pouch">pouch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Est. Days Supply</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemDays}
                    onChange={(e) => setNewItemDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Brand (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Aashirvaad, Amul, Kissan, Vim"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Steward Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Best used for dal tadka garnish"
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-brand-800 text-white hover:bg-brand-700"
                >
                  Save Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
