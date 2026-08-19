import React, { useState } from 'react';
import { Upload, Sparkles, RefreshCw, CheckCircle2, FileText, ArrowRight, Store } from 'lucide-react';
import { InventoryItem } from '../types';

interface OrderParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParsedItems: (items: Partial<InventoryItem>[]) => void;
}

export const OrderParserModal: React.FC<OrderParserModalProps> = ({
  isOpen,
  onClose,
  onAddParsedItems,
}) => {
  const [orderText, setOrderText] = useState('');
  const [platform, setPlatform] = useState('Blinkit');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResults, setParsedResults] = useState<any[]>([]);

  if (!isOpen) return null;

  const sampleReceipts = [
    {
      title: 'Blinkit Restock Haul',
      platform: 'Blinkit',
      text: `Blinkit Order #BL-98124
Delivered in 11 mins to Sector 42
Items:
1. Aashirvaad Superior MP Atta 5kg - ₹265
2. Amul Taaza Toned Milk 500ml (Pack of 2) - ₹54
3. Hybrid Tomatoes 1kg - ₹42
4. Mother Dairy Classic Paneer 200g - ₹90
5. Kissan Fresh Tomato Ketchup 500g - ₹135
6. Vim Dishwash Liquid Gel Lemon 750ml Refill - ₹185
Total Paid: ₹771`,
    },
    {
      title: 'Zepto Dairy & Veggies Quick Run',
      platform: 'Zepto',
      text: `Zepto Order Delivered
Order ID: ZEP-44219
Items:
- Fresh Palak Spinach 1 Bunch (250g)
- Fresh Green Chillies 100g
- Fresh Coriander / Dhaniya 100g
- Amul Pure Ghee 500ml Carton
- Tata Sampann Toor Dal 1kg
- Brooke Bond Red Label Tea 250g`,
    },
  ];

  const handleParseOrder = async () => {
    if (!orderText.trim()) return;
    setIsLoading(true);
    setParsedResults([]);

    try {
      const response = await fetch('/api/gemini/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderText,
          platform,
        }),
      });

      const data = await response.json();
      if (data.items) {
        setParsedResults(data.items.map((it: any) => ({ ...it, isSelected: true })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    const selected = parsedResults.filter((i) => i.isSelected);
    if (selected.length === 0) return;

    const formatted: Partial<InventoryItem>[] = selected.map((item) => {
      const match = (item.quantity || '').match(/([\d.]+)/);
      const parsedQty = match ? parseFloat(match[1]) : 1;

      return {
        name: item.name,
        category: item.category || 'Staples & Grains',
        brand: item.brand,
        quantity: parsedQty,
        unit: item.unit || 'pack',
        storageLocation: item.storageLocation || 'pantry',
        status: 'fresh',
        estimatedDaysLeft: item.estimatedDaysSupply || 10,
        notes: `Imported from ${platform} delivery`,
        lastUpdated: 'Just imported',
      };
    });

    onAddParsedItems(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-900 text-amber-50 flex items-center justify-center font-bold text-xs">
              <Upload className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-serif font-semibold text-stone-900">
                Import Quick-Commerce Delivery
              </h3>
              <p className="text-xs text-stone-500">
                Paste order confirmation text or SMS from Blinkit, Zepto, Swiggy Instamart, BigBasket, or Amazon Fresh.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-700 font-bold">
            ✕
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Quick Test Samples:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleReceipts.map((sample, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  setOrderText(sample.text);
                  setPlatform(sample.platform);
                  setParsedResults([]);
                }}
                className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-lg text-stone-700 transition-colors text-left"
              >
                📋 {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700">Paste Order Text / Receipt / SMS</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500">Platform:</span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="text-xs px-2 py-1 bg-stone-50 border border-stone-200 rounded-md"
              >
                <option value="Blinkit">Blinkit</option>
                <option value="Zepto">Zepto</option>
                <option value="Swiggy Instamart">Swiggy Instamart</option>
                <option value="BigBasket">BigBasket</option>
                <option value="Amazon Fresh">Amazon Fresh</option>
              </select>
            </div>
          </div>

          <textarea
            rows={5}
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
            placeholder="Paste raw text here... e.g. '1x Aashirvaad Atta 5kg, 2x Amul Milk 500ml, 1x Vim Gel 750ml...'"
            className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-800 font-mono"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!orderText.trim() || isLoading}
            onClick={handleParseOrder}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Alfred is cataloguing order...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Parse Provisions</span>
              </>
            )}
          </button>
        </div>

        {/* Parsed Items Review */}
        {parsedResults.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                Recognized Provisions ({parsedResults.filter((i) => i.isSelected).length} items):
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {parsedResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    setParsedResults((prev) =>
                      prev.map((it, iIdx) => (iIdx === idx ? { ...it, isSelected: !it.isSelected } : it))
                    )
                  }
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                    item.isSelected
                      ? 'border-emerald-300 bg-emerald-50/40 text-stone-900'
                      : 'border-stone-200 bg-stone-50 opacity-50'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{item.name}</span>
                    <span className="text-[11px] text-stone-500">
                      {item.quantity} • {item.category}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.isSelected}
                    onChange={() => {}}
                    className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Replenish Inventory ({parsedResults.filter((i) => i.isSelected).length} items)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
