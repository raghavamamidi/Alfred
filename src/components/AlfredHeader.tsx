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
    <>
      <header className="border-b border-brand-950/10 bg-[#f5f9fc] sticky top-0 z-30 shadow-xs">
        {/* Top Butler Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-brand-900 text-brand-50 flex items-center justify-center shadow-md font-serif font-bold text-lg sm:text-xl border border-brand-800/40">
                A
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-[#f5f9fc] rounded-full" title="Alfred is attentively on duty" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-serif font-semibold text-stone-900 tracking-tight">Alfred</h1>
                <span className="hidden min-[420px]:inline text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 border border-brand-200">
                  Household Steward
                </span>
              </div>
              <p className="text-xs text-stone-600 flex items-center gap-1.5 truncate">
                <span>{getGreeting()}</span>
                <span className="hidden sm:inline text-stone-300">•</span>
                <span className="hidden sm:inline text-stone-500">Dedicated to your kitchen's grace & provisions</span>
              </p>
            </div>
          </div>

          {/* Right Status & Audio Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              id="voice-toggle-btn"
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                voiceEnabled
                  ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-xs'
                  : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200/70'
              }`}
              title="Toggle Alfred's calm butler voice narration"
            >
              {voiceEnabled ? (
                <>
                  <Volume2 className={`w-3.5 h-3.5 text-brand-800 ${isSpeaking ? 'animate-pulse text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">Voice: On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">Voice: Off</span>
                </>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-stone-600 bg-white/80 border border-stone-200/80 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-brand-700" />
              <span>Smart Indian Kitchen Intelligence</span>
            </div>
          </div>
        </div>

        {/* Navigation Pills — tablet & desktop only */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-brand-950/5">
          <nav className="flex flex-wrap gap-1.5 py-2" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-800 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-brand-900/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-300' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-brand-400/20 text-brand-200'
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
    </>
  );
};
