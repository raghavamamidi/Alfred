export type StorageLocation = 'fridge' | 'freezer' | 'pantry' | 'produce_basket' | 'spice_rack' | 'cleaning_shelf';

export type ItemCategory = 
  | 'Produce & Veggies'
  | 'Dairy & Bakery'
  | 'Staples & Grains'
  | 'Spices & Masalas'
  | 'Condiments & Sauces'
  | 'Snacks & Beverages'
  | 'Household & Cleaning'
  | 'Leftovers';

export type ItemStatus = 'fresh' | 'depleting' | 'critical' | 'out_of_stock';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  storageLocation: StorageLocation;
  status: ItemStatus;
  estimatedDaysLeft: number;
  brand?: string;
  expiryDate?: string;
  lastUpdated: string;
  notes?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  ageRange: 'Toddler' | 'Child' | 'Teen' | '20s' | '30s' | '40s' | '50s' | '60s+';
  activityBand: 'sedentary' | 'moderate' | 'active';
  dietaryRestrictions: string[];
  tastePreferences: string;
  favoriteDishes?: string[];
}

export interface MealSuggestion {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dishName: string;
  description: string;
  cuisine: string;
  prepTimeMinutes: number;
  dietaryTags: string[];
  inStockIngredients: string[];
  missingIngredients: string[];
  varietyNudgeReason?: string;
  quickSteps?: string[];
}

export interface RestockItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  priceEstInr: number;
  isUnileverDefault: boolean;
  brand: string;
  alternativeBrands: string[];
  reason: string;
  isSelected: boolean;
  platformRecommendation?: 'Blinkit' | 'Zepto' | 'Swiggy Instamart' | 'BigBasket' | 'Amazon Fresh';
}

export interface RestockBasket {
  id: string;
  store: string;
  stewardNote: string;
  items: RestockItem[];
  totalEstimatedInr: number;
  createdAt: string;
  status: 'proposed' | 'approved' | 'sent_to_cart';
}

export interface MealHistoryEntry {
  id: string;
  date: string;
  dayLabel: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dishName: string;
  mainIngredients: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  visualCard?: {
    type: 'fridge_scan' | 'meal_suggestions' | 'restock_basket' | 'order_import';
    data: any;
  };
  suggestedPrompts?: string[];
}

export interface QuickCommercePlatform {
  name: string;
  tagline: string;
  deliveryTime: string;
  color: string;
  logoText: string;
}
