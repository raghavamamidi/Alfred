import React from 'react';
import { Bot, Refrigerator, UtensilsCrossed, ShoppingBag, Users, Scan } from 'lucide-react';

interface AlfredBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
}

export const AlfredBottomNav: React.FC<AlfredBottomNavProps> = ({ activeTab, setActiveTab, lowStockCount }) => {
  const navItems = [
    { id: 'chat', label: 'Concierge', icon: Bot, badge: undefined as string | undefined },
    { id: 'inventory', label: 'Inventory', icon: Refrigerator, badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined },
    { id: 'scan', label: 'Fridge Scan', icon: Scan, badge: 'AI Vision' },
    { id: 'meals', label: 'Meal Planning', icon: UtensilsCrossed, badge: undefined },
    { id: 'restock', label: 'Restocking', icon: ShoppingBag, badge: 'Smart Baskets' },
    { id: 'profiles', label: 'Household', icon: Users, badge: undefined },
  ];

  return (
    <nav
      className="md:hidden shrink-0 bg-[#f5f9fc] border-t border-brand-950/10 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] safe-bottom"
      aria-label="Main Navigation"
    >
      <div className="grid grid-cols-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasAlert = item.badge?.includes('low');
          return (
            <button
              key={item.id}
              id={`nav-tab-mobile-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-900' : 'text-stone-500'
              }`}
            >
              <span className={`relative flex items-center justify-center w-7 h-7 rounded-lg ${isActive ? 'bg-brand-900/10' : ''}`}>
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-900' : 'text-stone-500'}`} />
                {(hasAlert || item.badge) && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#f5f9fc] ${
                      hasAlert ? 'bg-rose-500' : 'bg-brand-500'
                    }`}
                  />
                )}
              </span>
              <span className="leading-none truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
