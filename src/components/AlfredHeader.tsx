import React from 'react';
import { Sparkles, Bot, Refrigerator, UtensilsCrossed, ShoppingBag, Users, Scan, Volume2, VolumeX } from 'lucide-react';

interface AlfredHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSpeaking: boolean;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  lowStockCount: number;
}

export const AlfredHeader: React.FC<AlfredHeaderProps> = ({
  activeTab,
  setActiveTab,
  isSpeaking,
  voiceEnabled,
  setVoiceEnabled,
  lowStockCount,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const navItems = [
    { id: 'chat', label: 'Concierge', icon: Bot, badge: undefined },
    { id: 'inventory', label: 'Inventory', icon: Refrigerator, badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined },
    { id: 'scan', label: 'Fridge Scan', icon: Scan, badge: 'AI Vision' },
    { id: 'meals', label: 'Meal Planning', icon: UtensilsCrossed, badge: undefined },
    { id: 'restock', label: 'Restocking', icon: ShoppingBag, badge: 'Smart Baskets' },
    { id: 'profiles', label: 'Household', icon: Users, badge: undefined },
  ];

  return (
    <header className="border-b border-amber-950/10 bg-[#faf8f5] sticky top-0 z-30 shadow-xs">
      {/* Top Butler Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-amber-900 text-amber-50 flex items-center justify-center shadow-md font-serif font-bold text-xl border border-amber-800/40">
              A
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#faf8f5] rounded-full" title="Alfred is attentively on duty" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-semibold text-stone-900 tracking-tight">Alfred</h1>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Household Steward
              </span>
            </div>
            <p className="text-xs text-stone-600 flex items-center gap-1.5">
              <span>{getGreeting()}</span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">Dedicated to your kitchen's grace & provisions</span>
            </p>
          </div>
        </div>

        {/* Right Status & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="voice-toggle-btn"
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              voiceEnabled
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200/70'
            }`}
            title="Toggle Alfred's calm butler voice narration"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className={`w-3.5 h-3.5 text-amber-800 ${isSpeaking ? 'animate-pulse text-emerald-600' : ''}`} />
                <span className="hidden sm:inline">Voice: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Voice: Off</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-600 bg-white/80 border border-stone-200/80 px-3 py-1.5 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Smart Indian Kitchen Intelligence</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-amber-950/5">
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-amber-900/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-amber-400/20 text-amber-200'
                        : item.badge.includes('low')
                        ? 'bg-rose-100 text-rose-800 font-semibold'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
