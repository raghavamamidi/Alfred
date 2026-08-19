import React, { useState, useEffect } from 'react';
import { AlfredHeader } from './components/AlfredHeader';
import { AlfredChat } from './components/AlfredChat';
import { InventoryHub } from './components/InventoryHub';
import { VisionFridgeScan } from './components/VisionFridgeScan';
import { MealPlanner } from './components/MealPlanner';
import { SmartRestocking } from './components/SmartRestocking';
import { HouseholdProfiles } from './components/HouseholdProfiles';
import { OrderParserModal } from './components/OrderParserModal';
import { 
  INITIAL_INVENTORY, 
  INITIAL_HOUSEHOLD_PROFILES, 
  INITIAL_MEAL_HISTORY 
} from './data/initialData';
import { 
  InventoryItem, 
  HouseholdMember, 
  MealHistoryEntry, 
  RestockBasket, 
  RestockItem, 
  ChatMessage 
} from './types';

export default function App() {
  // Local persistence states
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('alfred_inventory_v1');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  const [householdProfiles, setHouseholdProfiles] = useState<HouseholdMember[]>(() => {
    try {
      const saved = localStorage.getItem('alfred_profiles_v1');
      return saved ? JSON.parse(saved) : INITIAL_HOUSEHOLD_PROFILES;
    } catch {
      return INITIAL_HOUSEHOLD_PROFILES;
    }
  });

  const [recentMeals, setRecentMeals] = useState<MealHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('alfred_meals_v1');
      return saved ? JSON.parse(saved) : INITIAL_MEAL_HISTORY;
    } catch {
      return INITIAL_MEAL_HISTORY;
    }
  });

  const [restockBasket, setRestockBasket] = useState<RestockBasket | null>(null);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Voice narration support (Web Speech API)
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Time-aware greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Initial Chat Conversation with Alfred's exact opening greeting
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `${getTimeGreeting()}. I'm Alfred, your household kitchen steward. I can help with meal ideas, check what's running low, or scan your fridge - what would you like today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem('alfred_inventory_v1', JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('alfred_profiles_v1', JSON.stringify(householdProfiles));
    } catch (e) {
      console.error(e);
    }
  }, [householdProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem('alfred_meals_v1', JSON.stringify(recentMeals));
    } catch (e) {
      console.error(e);
    }
  }, [recentMeals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Voice Narrator helper
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text of markdown/symbols
    const cleanText = text.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 0.95;

    // Pick British or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes('en-GB') ||
        v.lang.includes('en-IN') ||
        v.name.includes('George') ||
        v.name.includes('Daniel') ||
        v.name.includes('Rishi')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Handle adding items from Fridge Scan or Order Parser
  const handleAddItemsToInventory = (newItems: Partial<InventoryItem>[]) => {
    setInventory((prev) => {
      const updated = [...prev];
      newItems.forEach((item) => {
        const existingIdx = updated.findIndex(
          (u) => u.name.toLowerCase().trim() === (item.name || '').toLowerCase().trim()
        );
        if (existingIdx >= 0) {
          // Replenish existing item
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: Math.round((updated[existingIdx].quantity + (item.quantity || 1)) * 10) / 10,
            status: 'fresh',
            lastUpdated: 'Just replenished',
          };
        } else {
          // Add new item
          updated.unshift({
            id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: item.name || 'Pantry Provision',
            category: item.category || 'Produce & Veggies',
            quantity: item.quantity || 1,
            unit: item.unit || 'pcs',
            storageLocation: item.storageLocation || 'pantry',
            status: item.status || 'fresh',
            estimatedDaysLeft: item.estimatedDaysLeft || 5,
            brand: item.brand,
            notes: item.notes,
            lastUpdated: 'Just added',
          });
        }
      });
      return updated;
    });

    showToast(`Alfred updated ${newItems.length} provisions in your inventory.`);
  };

  // Mark a meal as prepared/cooked
  const handleMarkMealCooked = (
    dishName: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    usedIngredients: string[]
  ) => {
    // 1. Add to recent meals
    const newMealEntry: MealHistoryEntry = {
      id: `meal-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dayLabel: 'Today',
      mealType,
      dishName,
      mainIngredients: usedIngredients,
    };
    setRecentMeals((prev) => [newMealEntry, ...prev.slice(0, 9)]);

    // 2. Adjust inventory quantities gently
    setInventory((prev) =>
      prev.map((item) => {
        const wasUsed = usedIngredients.some((ing) =>
          ing.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(ing.toLowerCase())
        );
        if (wasUsed) {
          const newQty = Math.max(0, Math.round((item.quantity - 0.5) * 10) / 10);
          return {
            ...item,
            quantity: newQty,
            status: newQty <= 0.5 ? 'depleting' : item.status,
            lastUpdated: 'Used for today’s meal',
          };
        }
        return item;
      })
    );

    showToast(`Logged "${dishName}" as prepared. Inventory stocks updated.`);
  };

  // Add a specific item directly to the restock basket
  const handleAddDirectToRestock = (item: InventoryItem) => {
    const restockItem: RestockItem = {
      id: `restock-${item.id}`,
      name: item.name,
      category: item.category,
      quantity: `1 ${item.unit}`,
      unit: item.unit,
      priceEstInr: item.category === 'Dairy & Bakery' ? 55 : item.category === 'Household & Cleaning' ? 185 : 85,
      isUnileverDefault: ['Kissan', 'Vim', 'Brooke Bond', 'Surf Excel'].includes(item.brand || ''),
      brand: item.brand || 'Household Standard',
      alternativeBrands: ['Standard Choice', 'Organic Option'],
      reason: `Stock is currently ${item.status}`,
      isSelected: true,
    };

    setRestockBasket((prev) => {
      const existingItems = prev?.items || [];
      if (existingItems.some((i) => i.name === item.name)) {
        return prev;
      }
      return {
        id: prev?.id || `bsk-${Date.now()}`,
        store: prev?.store || 'Blinkit',
        stewardNote: 'Item added from kitchen inventory ledger.',
        items: [restockItem, ...existingItems],
        totalEstimatedInr: (prev?.totalEstimatedInr || 0) + restockItem.priceEstInr,
        createdAt: 'Just now',
        status: 'proposed',
      };
    });

    setActiveTab('restock');
    showToast(`Added ${item.name} to smart restocking basket.`);
  };

  // Replenish inventory after user confirms delivery
  const handleReplenishInventory = (restockedItems: RestockItem[]) => {
    setInventory((prev) => {
      const updated = [...prev];
      restockedItems.forEach((r) => {
        const idx = updated.findIndex((u) => u.name.toLowerCase().includes(r.name.toLowerCase()));
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            quantity: Math.round((updated[idx].quantity + 2) * 10) / 10,
            status: 'fresh',
            estimatedDaysLeft: 10,
            lastUpdated: 'Delivered & stocked',
          };
        }
      });
      return updated;
    });

    showToast(`Restocked ${restockedItems.length} provisions into kitchen ledger!`);
  };

  const lowStockCount = inventory.filter((i) => i.status === 'critical' || i.status === 'depleting' || i.quantity <= 0).length;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans flex flex-col selection:bg-amber-200 selection:text-amber-950">
      {/* Butler Header */}
      <AlfredHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSpeaking={isSpeaking}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-5">
        {activeTab === 'chat' && (
          <AlfredChat
            messages={messages}
            setMessages={setMessages}
            inventory={inventory}
            householdProfiles={householdProfiles}
            recentMeals={recentMeals}
            voiceEnabled={voiceEnabled}
            speakText={speakText}
            onNavigateTab={setActiveTab}
            onOpenFridgeScan={() => setActiveTab('scan')}
            onGenerateRestock={() => setActiveTab('restock')}
            onSuggestMeals={() => setActiveTab('meals')}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryHub
            inventory={inventory}
            setInventory={setInventory}
            onOpenScanModal={() => setActiveTab('scan')}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
            onAddDirectToRestock={handleAddDirectToRestock}
          />
        )}

        {activeTab === 'scan' && (
          <VisionFridgeScan
            onAddItemsToInventory={handleAddItemsToInventory}
            onClose={() => setActiveTab('inventory')}
          />
        )}

        {activeTab === 'meals' && (
          <MealPlanner
            inventory={inventory}
            householdProfiles={householdProfiles}
            recentMeals={recentMeals}
            onMarkMealCooked={handleMarkMealCooked}
            onRequestMissingRestock={(missingItems) => {
              setActiveTab('restock');
              showToast(`Preparing restock for: ${missingItems.join(', ')}`);
            }}
          />
        )}

        {activeTab === 'restock' && (
          <SmartRestocking
            inventory={inventory}
            restockBasket={restockBasket}
            setRestockBasket={setRestockBasket}
            onReplenishInventory={handleReplenishInventory}
          />
        )}

        {activeTab === 'profiles' && (
          <HouseholdProfiles
            profiles={householdProfiles}
            setProfiles={setHouseholdProfiles}
          />
        )}
      </main>

      {/* Modals */}
      <OrderParserModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onAddParsedItems={handleAddItemsToInventory}
      />

      {/* Butler Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:bottom-5 sm:right-5 z-50 bg-stone-900 text-stone-100 text-xs sm:text-sm px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center font-serif text-[10px] font-bold">
            A
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subtle Butler Footer */}
      <footer className="hidden md:block border-t border-amber-950/10 py-4 bg-[#faf8f5] text-center text-xs text-stone-500">
        <p className="font-serif">
          Alfred • Attentive AI Household Kitchen Steward for Indian Homes • Supporting Blinkit, Zepto, Swiggy Instamart & BigBasket
        </p>
      </footer>
    </div>
  );
}
