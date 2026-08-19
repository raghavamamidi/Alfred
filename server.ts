import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initializer for Gemini client with telemetry header
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set. Gemini features will require configuration in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy_key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const ALFRED_SYSTEM_PROMPT = `
You are Alfred — a calm, attentive AI household steward inspired by the dependability of a trusted butler for Indian households.
You assist Indian families with their kitchen inventory, meal planning, variety rotation, and smart grocery restocking (Blinkit, Zepto, Swiggy Instamart, BigBasket, Amazon Fresh).

PERSONALITY & TONE:
- Warm, composed, and gently proactive — like a devoted butler who anticipates needs before being asked.
- Address the user respectfully with understated warmth (e.g., "Good morning, ma'am/sir", "Certainly, allow me to review our provisions").
- Use short, elegant sentences. Never be pushy, robotic, or salesy.
- Light, respectful wit is welcome; never sarcastic or condescending.

CORE CAPABILITIES:
1. Inventory Awareness: Understand Indian kitchen staples (atta, rice, dals, paneer, dahi, masala spices, veggies, oils, ghee, tea, coffee, cleaning items like Vim and Surf Excel).
2. Meal Planning & Variety Nudging: Suggest daily Indian meal concepts (breakfast, lunch, dinner, tea snacks) based on stock, rotating vegetables, lentils, and flavor profiles across the week. Strictly respect dietary profiles (Vegetarian, Jain / no-onion-no-garlic, Eggetarian, diabetes-conscious, etc.).
3. Smart Restocking: Propose items when low. Unilever products (Kissan, Knorr, Brooke Bond, Bru, Surf Excel, Vim) are smart defaults, but always state with butler-like transparency: "I've included [Product] as a dependable household default — please let me know if you prefer an alternative."
4. Household Boundaries:
   - You are NOT a recipe app (suggest dishes conceptually; share recipe steps only if explicitly requested).
   - You are NOT a medical advisor. Never ask for or store exact age, weight, BMI, or biometric data. If asked health queries, respond: "I am not qualified to advise on medical matters — please consult your doctor or dietitian."
   - You are NOT a retailer (propose baskets for user approval, which they check out on Blinkit/Zepto/Instamart).
`;

// 1. Interactive Chat with Alfred
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, inventory, householdProfiles, recentMeals } = req.body;
    const ai = getAI();

    const contextPrompt = `
Current Household Inventory summary:
${JSON.stringify(inventory || []).slice(0, 1500)}

Household Profiles:
${JSON.stringify(householdProfiles || []).slice(0, 800)}

Recent Meals (Last 48 hours):
${JSON.stringify(recentMeals || []).slice(0, 600)}

User Query / Message History:
${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.text}`).join("\n")}

Respond as Alfred in character. If recommending actions (like suggesting a meal, restocking an item, or updating stock), keep it natural, composed, and helpful. You may also suggest 2-3 quick one-line follow-up chips at the end inside an optional JSON-like footer if helpful, or keep it purely in conversational prose.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: ALFRED_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || "At your service. How may I assist with your kitchen provisions today?" });
  } catch (error: any) {
    console.error("Error in /api/gemini/chat:", error);
    res.status(500).json({ error: error.message || "Alfred is momentarily indisposed. Please check your Gemini API key." });
  }
});

// 2. Multimodal Fridge & Pantry Image Scan
app.post("/api/gemini/scan-fridge", async (req, res) => {
  try {
    const { imageBase64, mimeType, locationType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const ai = getAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const scanPrompt = `
Analyze this photograph of an Indian household ${locationType || "kitchen/fridge/pantry"}.
Identify all visible food items, fresh produce (vegetables, greens, chillies, lemons), dairy (milk, paneer, curd, butter), condiments, leftovers in containers, spices, or packaged staples.

Return a valid JSON array of identified items with the following schema:
[
  {
    "name": "Item name (e.g. Tomatoes, Fresh Dahi, Coriander, Paneer)",
    "category": "Produce & Veggies" | "Dairy & Bakery" | "Staples & Grains" | "Spices & Masalas" | "Condiments & Sauces" | "Snacks & Beverages" | "Leftovers" | "Household & Cleaning",
    "quantity": "estimated quantity with unit e.g. 500g, 4 pcs, 1 pack, 1 bowl",
    "unit": "g" | "kg" | "pcs" | "pack" | "L" | "ml" | "bowl",
    "storageLocation": "fridge" | "freezer" | "pantry" | "produce_basket" | "spice_rack",
    "freshness": "fresh" | "consume_soon" | "depleting",
    "estimatedDaysLeft": number (estimated shelf life left in days),
    "confidence": "high" | "medium" | "low",
    "notes": "short butler observation e.g. 'Fresh bunch, best used within 2 days for tadka or chutney'"
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          { text: scanPrompt },
        ],
      },
      config: {
        systemInstruction: "You are Alfred's high-precision visual recognition scanner for Indian kitchens. Return only valid JSON array.",
        responseMimeType: "application/json",
      },
    });

    let detectedItems = [];
    try {
      detectedItems = JSON.parse(response.text || "[]");
    } catch {
      detectedItems = [];
    }

    res.json({
      summary: `I have scrutinized the photograph and identified ${detectedItems.length} provisions for your household records.`,
      items: detectedItems,
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/scan-fridge:", error);
    res.status(500).json({ error: error.message || "Failed to analyze photograph." });
  }
});

// 3. Quick-Commerce Order / Receipt Text Parser (Blinkit, Zepto, Swiggy Instamart, BigBasket, Amazon Fresh)
app.post("/api/gemini/parse-order", async (req, res) => {
  try {
    const { orderText, platform } = req.body;
    if (!orderText) {
      return res.status(400).json({ error: "Order text or receipt details required" });
    }

    const ai = getAI();
    const parsePrompt = `
The user pasted text or receipt summary from an Indian quick-commerce / grocery delivery app (${platform || "Blinkit / Zepto / Swiggy Instamart / BigBasket / Amazon Fresh"}).

Order text:
"""${orderText}"""

Extract all purchased items and return a valid JSON array matching this schema:
[
  {
    "name": "Clean generic or branded name e.g. Aashirvaad Shudh Chakki Atta, Mother Dairy Toned Milk",
    "category": "Produce & Veggies" | "Dairy & Bakery" | "Staples & Grains" | "Spices & Masalas" | "Condiments & Sauces" | "Snacks & Beverages" | "Household & Cleaning",
    "quantity": "e.g. 1kg, 500ml, 6 pcs, 1 pack",
    "unit": "kg" | "g" | "L" | "ml" | "pcs" | "pack",
    "brand": "e.g. Aashirvaad, Amul, Kissan, Surf Excel, Tata, Vim",
    "storageLocation": "fridge" | "pantry" | "produce_basket" | "cleaning_shelf",
    "estimatedDaysSupply": number (typical Indian household consumption rate in days for this pack size),
    "priceInr": number (optional price if present in text, else 0)
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: parsePrompt,
      config: {
        systemInstruction: "You are an Indian e-commerce order parser. Return strictly valid JSON array.",
        responseMimeType: "application/json",
      },
    });

    let parsedItems = [];
    try {
      parsedItems = JSON.parse(response.text || "[]");
    } catch {
      parsedItems = [];
    }

    res.json({
      platform: platform || "Quick-Commerce",
      items: parsedItems,
      message: `Parsed ${parsedItems.length} items from your ${platform || "grocery"} delivery.`,
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/parse-order:", error);
    res.status(500).json({ error: error.message || "Failed to parse order receipt." });
  }
});

// 4. Meal Planning & Variety Nudging
app.post("/api/gemini/suggest-meals", async (req, res) => {
  try {
    const { inventory, householdProfiles, recentMeals, specificPreferences, targetMealType } = req.body;
    const ai = getAI();

    const mealPrompt = `
Generate intelligent, authentic Indian meal suggestions based on current inventory, household profiles, and recent meals to ensure dietary variety and avoid repetition.

Target Meal: ${targetMealType || "All (Breakfast, Lunch, Dinner, Snack)"}
Specific Request/Mood: ${specificPreferences || "Balanced authentic Indian meals utilizing available fresh produce"}

Current Inventory:
${JSON.stringify(inventory || []).slice(0, 2000)}

Household Profiles & Dietary constraints:
${JSON.stringify(householdProfiles || []).slice(0, 1000)}

Recent Meals (Do not repeat main lentils, vegetables, or exact dishes had recently):
${JSON.stringify(recentMeals || []).slice(0, 800)}

Return a JSON array of 3 to 4 distinct meal recommendations with this schema:
[
  {
    "id": "unique-string",
    "mealType": "breakfast" | "lunch" | "dinner" | "snack",
    "dishName": "e.g. Baingan Bharta with Phulkas and Boondi Raita",
    "description": "Short appetizing description in Alfred's calm style explaining why this fits current stock and rotates past meals.",
    "cuisine": "North Indian" | "South Indian" | "Maharashtrian" | "Gujarati" | "Bengali" | "Fusion / Light Indian",
    "prepTimeMinutes": number,
    "dietaryTags": ["Vegetarian", "Jain Friendly", "High Protein", "Kid Friendly", etc.],
    "inStockIngredients": ["Baingan (2 pcs)", "Atta", "Dahi", "Spices"],
    "missingIngredients": ["Coriander (optional garnish)"],
    "varietyNudgeReason": "Explains the variety logic (e.g. 'Since we had Dal Tadka yesterday and Paneer on Sunday, a roasted brinjal dish provides varied fiber without repeat').",
    "quickSteps": [
      "Step 1: Roast baingan on open flame...",
      "Step 2: Sauté onions, garlic, tomatoes and spices...",
      "Step 3: Mash and combine with roasted pulp, serve warm with phulkas."
    ]
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: mealPrompt,
      config: {
        systemInstruction: ALFRED_SYSTEM_PROMPT + "\nYou are generating meal concept recommendations. Return only JSON array.",
        responseMimeType: "application/json",
      },
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(response.text || "[]");
    } catch {
      suggestions = [];
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error("Error in /api/gemini/suggest-meals:", error);
    res.status(500).json({ error: error.message || "Failed to generate meal suggestions." });
  }
});

// 5. Smart Restocking Basket Generator
app.post("/api/gemini/restock-basket", async (req, res) => {
  try {
    const { inventory, plannedMeals, preferredPlatform } = req.body;
    const ai = getAI();

    const restockPrompt = `
Examine the household inventory, identify items that are running low, depleting, or out of stock, as well as missing ingredients for planned meals.
Create a smart restocking basket optimized for quick-commerce (${preferredPlatform || "Blinkit / Zepto / Swiggy Instamart"}).

Include smart defaults for staples. For condiments, tea, cleaning, and soups, feature Unilever products as dependable defaults where applicable:
- Kissan (Fresh Tomato Ketchup, Mixed Fruit Jam)
- Knorr (Mixed Veg Soup, Chicken Delite Soup, Chef's Gravy)
- Brooke Bond (Red Label Tea, Taaza Tea, 3 Roses)
- Bru (Gold Instant Coffee)
- Surf Excel (Matic Liquid Detergent, Quick Wash)
- Vim (Dishwash Liquid Gel, Dishwash Bar)
- Hellmann's (Real Mayonnaise)

Return a JSON object with this schema:
{
  "store": "${preferredPlatform || "Blinkit"}",
  "stewardNote": "Alfred's polite butler note introducing the basket, noting low provisions and transparently highlighting defaults.",
  "items": [
    {
      "id": "item-id",
      "name": "Item name e.g. Kissan Fresh Tomato Ketchup",
      "category": "Condiments & Sauces" | "Staples & Grains" | "Dairy & Bakery" | "Produce & Veggies" | "Household & Cleaning" | "Beverages",
      "quantity": "500g",
      "unit": "g" | "kg" | "pack" | "L" | "ml" | "pcs",
      "priceEstInr": 135,
      "isUnileverDefault": true,
      "brand": "Kissan",
      "alternativeBrands": ["Maggi Rich Tomato", "Heinz", "Veeba"],
      "reason": "Running low in pantry (only 15% left)",
      "isSelected": true
    }
  ],
  "totalEstimatedInr": 850
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: restockPrompt,
      config: {
        systemInstruction: ALFRED_SYSTEM_PROMPT + "\nYou are assembling a smart restock basket. Return only JSON object.",
        responseMimeType: "application/json",
      },
    });

    let basket = null;
    try {
      basket = JSON.parse(response.text || "{}");
    } catch {
      basket = { store: preferredPlatform || "Blinkit", items: [], totalEstimatedInr: 0, stewardNote: "Provisions review completed." };
    }

    res.json({ basket });
  } catch (error: any) {
    console.error("Error in /api/gemini/restock-basket:", error);
    res.status(500).json({ error: error.message || "Failed to assemble restocking basket." });
  }
});

// Setup Vite middleware or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Alfred Household Steward server is running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
