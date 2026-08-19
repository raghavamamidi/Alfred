import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Volume2, ArrowRight, Refrigerator, ShoppingBag, Utensils, Scan, RefreshCw } from 'lucide-react';
import { ChatMessage, InventoryItem, HouseholdMember, MealHistoryEntry } from '../types';

interface AlfredChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  inventory: InventoryItem[];
  householdProfiles: HouseholdMember[];
  recentMeals: MealHistoryEntry[];
  voiceEnabled: boolean;
  speakText: (text: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenFridgeScan: () => void;
  onGenerateRestock: () => void;
  onSuggestMeals: () => void;
}

export const AlfredChat: React.FC<AlfredChatProps> = ({
  messages,
  setMessages,
  inventory,
  householdProfiles,
  recentMeals,
  voiceEnabled,
  speakText,
  onNavigateTab,
  onOpenFridgeScan,
  onGenerateRestock,
  onSuggestMeals,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: "What's running low in the kitchen?", query: "Alfred, could you please conduct a review of our kitchen stocks and inform me of items running low or depleting soon?" },
    { label: 'Suggest lunch with Palak & Paneer', query: 'What would you recommend for lunch today utilizing our fresh Palak and Mother Dairy Paneer, keeping our recent meals in mind?' },
    { label: 'Assemble Blinkit restock basket', query: 'Please assemble a smart restocking basket for Blinkit with our essential low provisions and Unilever defaults.' },
    { label: 'Gentle dinner for Dadi (Jain-friendly/mild)', query: "Could you suggest a comforting, easily digestible dinner suitable for Dadi's mild preference that avoids repetition?" },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          inventory,
          householdProfiles,
          recentMeals,
        }),
      });

      const data = await response.json();
      const replyText = data.text || 'At your service, ma’am/sir. I have noted this for your household provisions.';

      const stewardMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, stewardMsg]);
      if (voiceEnabled) {
        speakText(replyText);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: 'I apologize for the momentary hesitation. I am at your service — please let me know if you would like me to inspect our pantry inventory or plan today’s culinary provisions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-5xl mx-auto bg-stone-50/60 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Steward Top Status Bar */}
      <div className="px-5 py-3.5 bg-[#fdfbf7] border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-stone-900 text-amber-100 flex items-center justify-center font-serif text-sm font-semibold shadow-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-serif font-semibold text-stone-900">Alfred’s Parlour</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </div>
            <p className="text-xs text-stone-500">Live Household Steward Dialogue</p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            id="chat-quick-scan-btn"
            type="button"
            onClick={onOpenFridgeScan}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition-colors"
          >
            <Scan className="w-3.5 h-3.5 text-amber-800" />
            <span className="hidden sm:inline">Scan Fridge</span>
          </button>
          <button
            id="chat-quick-meals-btn"
            type="button"
            onClick={onSuggestMeals}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <Utensils className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Plan Meals</span>
          </button>
          <button
            id="chat-quick-restock-btn"
            type="button"
            onClick={onGenerateRestock}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Restock</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isAlfred = msg.role === 'assistant';
          return (
            <div key={msg.id} className={`flex gap-3 ${isAlfred ? 'justify-start' : 'justify-end'}`}>
              {isAlfred && (
                <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-50 flex items-center justify-center font-serif text-xs font-bold shrink-0 mt-0.5 shadow-xs">
                  A
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isAlfred
                    ? 'bg-white border border-stone-200/90 text-stone-800 shadow-xs'
                    : 'bg-stone-900 text-stone-50 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-stone-400">
                  <span>{msg.timestamp}</span>
                  {isAlfred && (
                    <button
                      type="button"
                      onClick={() => speakText(msg.text)}
                      className="text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors"
                      title="Read in Alfred's voice"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-50 flex items-center justify-center font-serif text-xs font-bold shrink-0">
              A
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-500 flex items-center gap-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Alfred is reviewing household provisions and meal history...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-stone-100/70 border-t border-stone-200/80 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-medium text-stone-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-700" />
          Proactive Prompts:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(p.query)}
            className="text-xs px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 text-stone-700 whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 sm:p-4 bg-white border-t border-stone-200 flex items-center gap-2"
      >
        <input
          id="alfred-chat-input"
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Speak to Alfred (e.g. 'What should we prepare for dinner?' or 'Check milk & tomatoes')..."
          className="flex-1 px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 text-stone-900 placeholder:text-stone-400"
          disabled={isLoading}
        />
        <button
          id="alfred-send-btn"
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
