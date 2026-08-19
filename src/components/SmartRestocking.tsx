import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Sparkles, RefreshCw, CheckCircle2, ArrowRight, 
  ExternalLink, Copy, Check, ShieldCheck, Tag, Trash2, Plus
} from 'lucide-react';
import { RestockBasket, RestockItem, InventoryItem, QuickCommercePlatform } from '../types';
import { QUICK_COMMERCE_PLATFORMS, UNILEVER_SMART_DEFAULTS } from '../data/initialData';

interface SmartRestockingProps {
  inventory: InventoryItem[];
  restockBasket: RestockBasket | null;
  setRestockBasket: React.Dispatch<React.SetStateAction<RestockBasket | null>>;
  onReplenishInventory: (restockedItems: RestockItem[]) => void;
}

export const SmartRestocking: React.FC<SmartRestockingProps> = ({
  inventory,
  restockBasket,
  setRestockBasket,
  onReplenishInventory,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Blinkit');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [brandSwapItemId, setBrandSwapItemId] = useState<string | null>(null);

  // Initialize or recompute smart basket
  useEffect(() => {
    if (!restockBasket) {
      generateSmartBasket();
    }
  }, []);

  const generateSmartBasket = async (platformName?: string) => {
    setIsLoading(true);
    const storeToUse = platformName || selectedPlatform;

    try {
      const response = await fetch('/api/gemini/restock-basket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          preferredPlatform: storeToUse,
        }),
      });

      const data = await response.json();
      if (data.basket && data.basket.items) {
        setRestockBasket({
          id: `bsk-${Date.now()}`,
          store: storeToUse,
          stewardNote: data.basket.stewardNote || 'I have compiled our essential household restocking provisions with trusted defaults.',
          items: data.basket.items,
          totalEstimatedInr: data.basket.totalEstimatedInr || 0,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'proposed',
        });
      }
    } catch (err) {
      console.error(err);
      // Fallback default basket with Unilever items
      const fallbackItems: RestockItem[] = [
        {
          id: 'item-1',
          name: 'Hybrid Fresh Tomatoes',
          category: 'Produce & Veggies',
          quantity: '1',
          unit: 'kg',
          priceEstInr: 45,
          isUnileverDefault: false,
          brand: 'Farm Fresh',
          alternativeBrands: ['Organic Fresh', 'Local Mandi'],
          reason: 'Running low (only 2 pcs remaining in produce basket)',
          isSelected: true,
        },
        {
          id: 'item-2',
          name: 'Kissan Fresh Tomato Ketchup',
          category: 'Condiments & Sauces',
          quantity: '500g Bottle',
          unit: 'pack',
          priceEstInr: 135,
          isUnileverDefault: true,
          brand: 'Kissan',
          alternativeBrands: ['Maggi Rich Tomato', 'Heinz', 'Veeba'],
          reason: 'Pantry stock depleted; suggested as reliable household default',
          isSelected: true,
        },
        {
          id: 'item-3',
          name: 'Vim Dishwash Liquid Gel (Lemon)',
          category: 'Household & Cleaning',
          quantity: '750ml Refill Pouch',
          unit: 'pouch',
          priceEstInr: 185,
          isUnileverDefault: true,
          brand: 'Vim',
          alternativeBrands: ['Pril Kraft Gel', 'Exo Gel'],
          reason: 'Down to critical 75ml on kitchen cleaning shelf',
          isSelected: true,
        },
        {
          id: 'item-4',
          name: 'Amul Taaza Toned Milk (500ml pouch x 2)',
          category: 'Dairy & Bakery',
          quantity: '2',
          unit: 'pouches',
          priceEstInr: 54,
          isUnileverDefault: false,
          brand: 'Amul',
          alternativeBrands: ['Mother Dairy', 'Nandini'],
          reason: 'Daily tea & morning breakfast requirement',
          isSelected: true,
        },
        {
          id: 'item-5',
          name: 'Brooke Bond Red Label Tea',
          category: 'Beverages',
          quantity: '500g',
          unit: 'pack',
          priceEstInr: 280,
          isUnileverDefault: true,
          brand: 'Brooke Bond',
          alternativeBrands: ['Tata Tea Premium', 'Wagh Bakri'],
          reason: 'Household morning chai staple',
          isSelected: true,
        }
      ];

      setRestockBasket({
        id: `bsk-${Date.now()}`,
        store: storeToUse,
        stewardNote: "I have prepared a proposed restocking basket based on our depleted items and trusted Unilever defaults. Please review and adjust any brand according to your preference.",
        items: fallbackItems,
        totalEstimatedInr: 699,
        createdAt: 'Just now',
        status: 'proposed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (!restockBasket) return;
    const updatedItems = restockBasket.items.map((it) =>
      it.id === itemId ? { ...it, isSelected: !it.isSelected } : it
    );
    const newTotal = updatedItems
      .filter((i) => i.isSelected)
      .reduce((sum, curr) => sum + curr.priceEstInr, 0);

    setRestockBasket({
      ...restockBasket,
      items: updatedItems,
      totalEstimatedInr: newTotal,
    });
  };

  const handleSwapBrand = (itemId: string, newBrand: string) => {
    if (!restockBasket) return;
    const updatedItems = restockBasket.items.map((it) => {
      if (it.id === itemId) {
        const baseName = it.name.replace(it.brand, '').trim();
        return {
          ...it,
          brand: newBrand,
          name: `${newBrand} ${baseName}`,
          isUnileverDefault: ['Kissan', 'Vim', 'Brooke Bond', 'Surf Excel', 'Knorr', 'Bru', 'Hellmanns'].includes(newBrand),
        };
      }
      return it;
    });

    setRestockBasket({
      ...restockBasket,
      items: updatedItems,
    });
    setBrandSwapItemId(null);
  };

  const handleCopyFormattedRestock = () => {
    if (!restockBasket) return;
    const activeItems = restockBasket.items.filter((i) => i.isSelected);
    const text = `🛒 *Alfred's Kitchen Restock List for ${selectedPlatform}*\n\n` +
      activeItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.quantity}) - ₹${item.priceEstInr}`).join('\n') +
      `\n\n*Estimated Total:* ₹${restockBasket.totalEstimatedInr}\n*Steward Note:* Prepared by Alfred Household Steward.`;

    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentPlatformObj = QUICK_COMMERCE_PLATFORMS.find((p) => p.name.includes(selectedPlatform)) || QUICK_COMMERCE_PLATFORMS[0];
  const selectedCount = restockBasket?.items.filter((i) => i.isSelected).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Steward Banner */}
      <div className="bg-[#faf8f5] border border-amber-950/10 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700" />
              <h2 className="text-xl font-serif font-semibold text-stone-900">
                Alfred’s Smart Restocking Concierge
              </h2>
            </div>
            <p className="text-sm text-stone-600">
              Proactive replenishment suggestions. I propose trusted household defaults (such as Kissan, Vim, and Brooke Bond) while leaving every brand choice entirely in your hands.
            </p>
          </div>

          <button
            id="refresh-basket-btn"
            type="button"
            disabled={isLoading}
            onClick={() => generateSmartBasket(selectedPlatform)}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 disabled:opacity-50 text-amber-50 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Alfred is evaluating stocks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Re-Evaluate Restock Basket</span>
              </>
            )}
          </button>
        </div>

        {/* Steward Note */}
        {restockBasket?.stewardNote && (
          <div className="mt-4 pt-3 border-t border-amber-950/10 text-xs text-stone-800 flex items-start gap-2.5 bg-white/70 p-3 rounded-xl border border-stone-200/80">
            <div className="w-6 h-6 rounded-full bg-amber-900 text-amber-100 flex items-center justify-center font-serif text-[10px] font-bold shrink-0 mt-0.5">
              A
            </div>
            <p className="leading-relaxed">
              <strong>Steward’s Assurance:</strong> {restockBasket.stewardNote}
            </p>
          </div>
        )}
      </div>

      {/* Platform Selector Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Preferred Quick-Commerce Destination:
          </span>
          <span className="text-xs text-stone-500">Fast delivery to your home</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {QUICK_COMMERCE_PLATFORMS.map((platform) => {
            const isSelected = selectedPlatform === platform.name;
            return (
              <button
                key={platform.name}
                type="button"
                onClick={() => {
                  setSelectedPlatform(platform.name);
                  if (restockBasket) {
                    setRestockBasket({ ...restockBasket, store: platform.name });
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 text-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{platform.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                  </div>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    {platform.tagline}
                  </p>
                </div>
                <div className={`text-[10px] font-medium mt-2 pt-1 border-t ${isSelected ? 'border-stone-700 text-amber-300' : 'border-stone-200 text-stone-600'}`}>
                  ⚡ {platform.deliveryTime}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Restocking Items Table / Grid */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              Proposed Restocking Basket ({selectedCount} items approved)
            </h3>
            <p className="text-xs text-stone-500">
              Review provisions, adjust brands, and route directly to {selectedPlatform}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-stone-500 block">Estimated Total</span>
              <span className="text-lg font-serif font-bold text-stone-900">
                ₹{restockBasket?.totalEstimatedInr || 0}
              </span>
            </div>

            <button
              id="open-checkout-review-btn"
              type="button"
              disabled={selectedCount === 0}
              onClick={() => setIsCheckoutModalOpen(true)}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span>Route to {selectedPlatform}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {restockBasket?.items.map((item) => {
            const isSwapOpen = brandSwapItemId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isSelected
                    ? 'border-stone-200 bg-white hover:border-amber-400'
                    : 'border-stone-100 bg-stone-50/70 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={() => handleToggleItem(item.id)}
                      className="rounded-md border-stone-300 text-stone-900 focus:ring-stone-800 w-4 h-4 mt-1 cursor-pointer"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900">{item.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                          {item.quantity}
                        </span>
                        {item.isUnileverDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold" title="Smart default from Unilever portfolio">
                            Unilever Default ({item.brand})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500 mt-1 font-sans">
                        Reason: {item.reason}
                      </p>

                      {item.isUnileverDefault && (
                        <p className="text-[11px] text-stone-500 italic mt-0.5">
                          "I've picked {item.brand} as a household default — happy to switch if you prefer another."
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-stone-900 block">
                        ₹{item.priceEstInr}
                      </span>
                      <span className="text-[10px] text-stone-400">est. quick-comm</span>
                    </div>

                    {/* Brand Swap Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBrandSwapItemId(isSwapOpen ? null : item.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Tag className="w-3 h-3 text-stone-500" />
                        <span>Swap Brand</span>
                      </button>

                      {isSwapOpen && (
                        <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-stone-200 rounded-xl shadow-xl p-2 space-y-1 text-xs">
                          <span className="block px-2 py-1 text-[10px] font-bold uppercase text-stone-400">
                            Available Brands:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSwapBrand(item.id, item.brand)}
                            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-stone-100 font-medium text-stone-900"
                          >
                            ✓ {item.brand} (Current)
                          </button>
                          {item.alternativeBrands.map((alt) => (
                            <button
                              key={alt}
                              type="button"
                              onClick={() => handleSwapBrand(item.id, alt)}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-stone-100 text-stone-700"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Restocking Actions Footer */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyFormattedRestock}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            <span>{copiedLink ? 'Copied Restock List!' : 'Copy Restock List for WhatsApp/SMS'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (restockBasket) {
                const active = restockBasket.items.filter((i) => i.isSelected);
                onReplenishInventory(active);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Mark All Approved Items As Delivered & Stocked</span>
          </button>
        </div>
      </div>

      {/* Quick-Commerce Checkout Drawer / Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center font-bold text-xs">
                  {selectedPlatform[0]}
                </div>
                <div>
                  <h3 className="text-base font-serif font-semibold text-stone-900">
                    Ready to Restock on {selectedPlatform}
                  </h3>
                  <p className="text-xs text-stone-500">Alfred has bundled {selectedCount} items for your review</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-stone-800 space-y-1">
              <p className="font-semibold text-amber-950">Alfred’s Transparent Notice:</p>
              <p>
                "I will prepare these items for your {selectedPlatform} checkout. You will retain complete final control to confirm payment and delivery slot directly on their app."
              </p>
            </div>

            {/* Itemized summary */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-stone-100 rounded-lg p-2.5 bg-stone-50">
              {restockBasket?.items.filter((i) => i.isSelected).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/50 last:border-0">
                  <span className="text-stone-800">{item.name} ({item.quantity})</span>
                  <span className="font-semibold text-stone-900">₹{item.priceEstInr}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-stone-500 block">Total Payable on {selectedPlatform}</span>
                <span className="text-xl font-serif font-bold text-stone-900">₹{restockBasket?.totalEstimatedInr}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="final-proceed-quick-commerce-btn"
                  type="button"
                  onClick={() => {
                    handleCopyFormattedRestock();
                    setIsCheckoutModalOpen(false);
                    alert(`Restock items prepared! Alfred has copied your list to the clipboard and notified ${selectedPlatform}. You can confirm checkout on the ${selectedPlatform} app.`);
                  }}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <span>Proceed to {selectedPlatform} App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
