import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Sparkles, RefreshCw, Clock, CheckCircle2, ChevronDown, ChevronUp, ChefHat, Heart, ShieldAlert, BookOpen } from 'lucide-react';
import { MealSuggestion, InventoryItem, HouseholdMember, MealHistoryEntry } from '../types';

interface MealPlannerProps {
  inventory: InventoryItem[];
  householdProfiles: HouseholdMember[];
  recentMeals: MealHistoryEntry[];
  onMarkMealCooked: (dishName: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', usedIngredients: string[]) => void;
  onRequestMissingRestock: (missingItems: string[]) => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({
  inventory,
  householdProfiles,
  recentMeals,
  onMarkMealCooked,
  onRequestMissingRestock,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [selectedDietFilter, setSelectedDietFilter] = useState<string>('All');
  const [customRequest, setCustomRequest] = useState<string>('');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Pre-seed default recommendations if empty
  useEffect(() => {
    if (suggestions.length === 0) {
      loadDefaultSuggestions();
    }
  }, []);

  const loadDefaultSuggestions = () => {
    setSuggestions([
      {
        id: 'sug-1',
        mealType: 'lunch',
        dishName: 'Homestyle Palak Paneer with Whole Wheat Phulkas & Kachumber Salad',
        description: 'Fresh spinach blanched and lightly simmered with soft paneer cubes in aromatic cumin-ginger tempering, served with freshly puffed phulkas.',
        cuisine: 'North Indian',
        prepTimeMinutes: 30,
        dietaryTags: ['Vegetarian', 'High Protein', 'Gluten in Atta'],
        inStockIngredients: ['Mother Dairy Paneer (200g)', 'Fresh Palak (1 bunch)', 'Aashirvaad Atta', 'Onions', 'Tomatoes', 'Amul Ghee'],
        missingIngredients: ['Lemon (optional garnish)'],
        varietyNudgeReason: 'Rotates from yesterday’s Toor Dal tadka into leafy iron-rich greens with wholesome dairy protein.',
        quickSteps: [
          'Step 1: Wash and blanch 1 bunch Palak for 2 minutes in salted water; plunge in cold water and puree smoothly.',
          'Step 2: Heat 1 tbsp pure ghee in a kadhai; add cumin seeds, chopped onions, ginger-garlic and tomato puree with turmeric and coriander powder.',
          'Step 3: Stir in spinach puree, adjust salt, and gently slide in 200g diced paneer cubes. Simmer on low flame for 4 minutes.',
          'Step 4: Roll and roast hot whole wheat phulkas on a tawa; serve immediately alongside crisp cucumber kachumber.'
        ],
      },
      {
        id: 'sug-2',
        mealType: 'dinner',
        dishName: 'Slow Flame-Roasted Baingan Bharta with Hot Rotis & Chilled Dahi',
        description: 'Smoky roasted purple eggplant mashed with sautéed onions, garlic, and fresh green chillies, tempered with mustard oil.',
        cuisine: 'North / Central Indian',
        prepTimeMinutes: 35,
        dietaryTags: ['Vegetarian', 'Digestible', 'Fiber Rich'],
        inStockIngredients: ['Purple Baingan (2 pcs)', 'Nashik Red Onions', 'Fortune Mustard Oil', 'Green Chillies', 'Atta', 'Fresh Dahi'],
        missingIngredients: [],
        varietyNudgeReason: 'Avoids heavy pulse repeat; utilizes our two firm baingans currently at prime freshness before they soften.',
        quickSteps: [
          'Step 1: Slit baingans, insert garlic cloves into slits, and roast directly on an open flame until charred and tender.',
          'Step 2: Peel blackened skin under cool water and mash the soft pulp with a fork.',
          'Step 3: In a pan, heat 1.5 tbsp mustard oil until smoking, splutter cumin, sauté chopped onions and tomatoes with haldi and red chilli powder.',
          'Step 4: Add mashed baingan pulp, cook for 6-7 minutes, and serve hot with fresh phulkas and a cup of curd.'
        ],
      },
      {
        id: 'sug-3',
        mealType: 'dinner',
        dishName: 'Gentle Moong Dal Khichdi with Pure Cow Ghee & Roasted Papad (Dadi’s Comfort)',
        description: 'Split yellow moong dal and aged basmati cooked to a velvety texture with mild cumin-hing tempering. Wholesome, restorative, and perfectly suited for gentle digestion.',
        cuisine: 'Traditional Comfort',
        prepTimeMinutes: 20,
        dietaryTags: ['Jain Friendly (No Onion/Garlic)', 'Mild Spice', 'Easy Digestion'],
        inStockIngredients: ['Yellow Moong Dal', 'India Gate Basmati Rice', 'Tata Sampann Jeera', 'Amul Cow Ghee', 'Turmeric'],
        missingIngredients: [],
        varietyNudgeReason: 'Ideal light evening option honoring Dadi’s mild preference without overloading the digestive tract.',
        quickSteps: [
          'Step 1: Wash equal parts yellow moong dal and basmati rice; soak for 15 minutes.',
          'Step 2: In a pressure cooker, temper 1 tbsp cow ghee with cumin seeds and a pinch of hing.',
          'Step 3: Add drained dal-rice, 1/2 tsp turmeric, salt, and 3.5 cups water. Cook for 3-4 whistles on medium flame.',
          'Step 4: Drizzle a teaspoon of warm ghee before serving with plain curd or roasted papad.'
        ],
      },
      {
        id: 'sug-4',
        mealType: 'breakfast',
        dishName: 'Crispy Methi Theplas with Fresh Dahi & Kissan Mixed Pickle',
        description: 'Spiced fenugreek flatbreads with gram flour and whole wheat, lightly toasted with ghee.',
        cuisine: 'Gujarati',
        prepTimeMinutes: 25,
        dietaryTags: ['Vegetarian', 'Travel Friendly', 'Fiber Rich'],
        inStockIngredients: ['Aashirvaad Atta', 'Amul Cow Ghee', 'Fresh Dahi', 'Turmeric', 'Cumin'],
        missingIngredients: ['Fresh Methi Leaves (or use Kasuri Methi from spice rack)'],
        varietyNudgeReason: 'Offers a wholesome change of pace from poha and upma with zero dairy wastage.',
        quickSteps: [
          'Step 1: Knead whole wheat flour, besan, finely chopped methi (or soaked kasuri methi), curd, turmeric, chilli powder, and carom seeds (ajwain) into a soft dough.',
          'Step 2: Roll out thin theplas and cook on a hot tawa with a brush of pure ghee until golden speckles appear.',
          'Step 3: Serve with fresh dahi and hot Brooke Bond ginger tea.'
        ],
      }
    ]);
  };

  const handleFetchAiSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/suggest-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory,
          householdProfiles,
          recentMeals,
          targetMealType: selectedMealType === 'all' ? undefined : selectedMealType,
          specificPreferences: customRequest || `Respect dietary filter: ${selectedDietFilter}`,
        }),
      });

      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter((sug) => {
    const matchesMeal = selectedMealType === 'all' || sug.mealType === selectedMealType;
    const matchesDiet =
      selectedDietFilter === 'All' ||
      sug.dietaryTags.some((tag) => tag.toLowerCase().includes(selectedDietFilter.toLowerCase()));
    return matchesMeal && matchesDiet;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#faf8f5] border border-amber-950/10 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700" />
              <h2 className="text-xl font-serif font-semibold text-stone-900">
                Alfred’s Daily Meal Curation & Variety Engine
              </h2>
            </div>
            <p className="text-sm text-stone-600">
              Thoughtfully curated daily Indian meal concepts derived from currently available stocks, dietary restrictions, and recent meal rotation.
            </p>
          </div>

          <button
            id="refresh-meal-ideas-btn"
            type="button"
            disabled={isLoading}
            onClick={handleFetchAiSuggestions}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 disabled:opacity-50 text-amber-50 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Alfred is consulting provisions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate New Meal Ideas</span>
              </>
            )}
          </button>
        </div>

        {/* Variety Nudge Rule Indicator */}
        <div className="mt-5 pt-4 border-t border-amber-950/10 flex flex-wrap items-center gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-1.5 font-medium text-stone-800">
            <ChefHat className="w-4 h-4 text-amber-800" />
            <span>Recent Household Rotation:</span>
          </div>
          {recentMeals.map((m) => (
            <span
              key={m.id}
              className="px-2.5 py-1 rounded-md bg-stone-100/90 border border-stone-200/80 text-stone-700 text-[11px]"
            >
              {m.dayLabel} {m.mealType}: <strong className="font-semibold">{m.dishName.split(' with ')[0]}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Filter and Prompt Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Meal Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                  selectedMealType === type
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {type === 'all' ? 'All Meals' : type}
              </button>
            ))}
          </div>

          {/* Dietary Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Dietary Constraint:</span>
            <select
              value={selectedDietFilter}
              onChange={(e) => setSelectedDietFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
            >
              <option value="All">All Household Preferences</option>
              <option value="Vegetarian">Strict Vegetarian</option>
              <option value="Jain">Jain Friendly (No Onion / Garlic)</option>
              <option value="Protein">High Protein</option>
              <option value="Digest">Mild / Easy Digestion</option>
            </select>
          </div>
        </div>

        {/* Custom mood or craving input */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <input
            type="text"
            placeholder="Specific craving or request for Alfred? (e.g. 'Quick 15 min snack with tea' or 'Use leftover curd')..."
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchAiSuggestions()}
            className="flex-1 px-3.5 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-800"
          />
          <button
            type="button"
            onClick={handleFetchAiSuggestions}
            className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Meal Suggestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuggestions.map((sug) => {
          const isExpanded = expandedRecipeId === sug.id;
          const hasMissing = sug.missingIngredients && sug.missingIngredients.length > 0;

          return (
            <div
              key={sug.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      {sug.mealType}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">📍 {sug.cuisine}</span>
                  </div>

                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>~{sug.prepTimeMinutes} mins</span>
                  </span>
                </div>

                {/* Dish Name */}
                <h3 className="text-base font-serif font-semibold text-stone-900 leading-snug">
                  {sug.dishName}
                </h3>

                {/* Description in Alfred's style */}
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  {sug.description}
                </p>

                {/* Variety Nudge Explanation */}
                {sug.varietyNudgeReason && (
                  <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 text-[11px] text-amber-950 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Alfred's Variety Insight:</strong> {sug.varietyNudgeReason}
                    </span>
                  </div>
                )}

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {sug.dietaryTags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* In Stock & Missing Ingredients */}
                <div className="text-xs space-y-1.5 pt-2 border-t border-stone-100">
                  <div className="text-stone-700">
                    <span className="font-medium text-emerald-800">✓ In Stock: </span>
                    <span className="text-stone-600">{sug.inStockIngredients.join(', ')}</span>
                  </div>
                  {hasMissing && (
                    <div className="text-stone-700 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-amber-800">⚠ Missing: </span>
                        <span className="text-stone-600">{sug.missingIngredients.join(', ')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRequestMissingRestock(sug.missingIngredients)}
                        className="text-[11px] font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                      >
                        + Restock Missing
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Butler Step-by-Step Notes (Only when asked) */}
                {isExpanded && sug.quickSteps && (
                  <div className="mt-3 pt-3 border-t border-amber-100 bg-stone-50/90 rounded-xl p-3 text-xs space-y-2 font-sans">
                    <div className="font-serif font-semibold text-stone-900 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                      <span>Alfred's Kitchen Preparation Guide:</span>
                    </div>
                    <ol className="space-y-1.5 text-stone-700 list-none pl-0">
                      {sug.quickSteps.map((step, sIdx) => (
                        <li key={sIdx} className="leading-relaxed bg-white p-2 rounded-md border border-stone-200/60">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedRecipeId(isExpanded ? null : sug.id)}
                  className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Steps' : 'View Butler Notes'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  id={`cook-meal-${sug.id}`}
                  type="button"
                  onClick={() => onMarkMealCooked(sug.dishName, sug.mealType, sug.inStockIngredients)}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prepare Dish Today</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
