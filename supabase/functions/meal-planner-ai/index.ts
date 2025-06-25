import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// Load environment variables for AI provider selection
const AI_PROVIDER = Deno.env.get("AI_PROVIDER") ?? "groq";
// === Adapter: Groq + Mixtral (mistral-saba-24b) ===
async function callGroq(prompt) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mistral-saba-24b",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });
  const result = await response.json();
  const raw = result?.choices?.[0]?.message?.content?.trim() || "";
  const cleaned = raw.replace(/^```json\s*|^```\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
}
// === Adapter: Claude (Anthropic) ===
async function callClaude(prompt) {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });
  const result = await response.json();
  const content = result?.content?.[0]?.text ?? "{}";
  return JSON.parse(content);
}
// === Adapter: OpenAI ===
async function callOpenAI(prompt) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });
  const result = await response.json();
  const message = result?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(message);
}
// === Dispatcher ===
async function getAIResponse(prompt) {
  switch(AI_PROVIDER){
    case "claude":
      return await callClaude(prompt);
    case "openai":
      return await callOpenAI(prompt);
    case "groq":
    default:
      return await callGroq(prompt);
  }
}
// === Helper function to build prompt ===
function buildPrompt({ preferences, ingredients, savedRecipes }) {
  const now = new Date();
  // ISO date string (e.g. "2025-06-24")
  const todayISO = now.toISOString().split("T")[0];
  // Weekday name (e.g. "Monday")
  const weekdayName = now.toLocaleDateString("en-US", {
    weekday: "long"
  });
  const recipeText = savedRecipes.map((r, i)=>`\${i + 1}. \${r.title} (id: \${r.id})  \n   Image: \${r.imageUrl}  \n   Tags: \${r.tags.join(", ")}  \n   Description: \${r.description}`).join("\n\n");
  return `You are an AI assistant generating weekly meal plans for a user. You must return a structured plan in JSON format using the user’s saved recipes, preferences, and available ingredients. Your output will be used by a mobile app.

---

### USER CONTEXT:

User Preferences:
- Meals per day: ${preferences.mealsPerDay}
- Days to plan: ${preferences.daysToPlan}
- Dietary restrictions: ${preferences.dietaryRestrictions.join(", ")}
- Prefers leftovers: ${preferences.prefersLeftovers}
- Needs lunchbox: ${preferences.needsLunchbox}

Available Ingredients:
${ingredients.join(", ")}

Saved Recipes:
${recipeText}

---

### DATE LOGIC:

- Start planning from today: ${weekdayName}, ${todayISO}. 
- Iterate over \`preferences.daysToPlan\`.  
- For each day, include:
  - \`"day"\`: Full weekday name (e.g., \`"Monday"\`)  
  - \`"date"\`: Date in ISO format (e.g., \`"2025-06-24"\`)

---

### MEAL PLANNING RULES:

1. Use only recipes that match dietary restrictions and available ingredients.
2. If there are not enough matches:
   - Reuse recipes (especially dinner → lunch) when \`prefers leftovers = true\`.
   - Use recipes with partial ingredient matches.
   - Suggest new recipes as a fallback (see below).
3. If \`needs lunchbox = true\`, ensure lunch meals are suitable (e.g. dry, portable) using recipe tags or name/description.
4. **Generate only the meal types specified in \`preferences.mealsPerDay\`** for each day.
5. **Consider meal pairings or combinations** when appropriate (e.g., Butter Chicken + Naan + Raita).  
   - Return **up to 3 recipes** for a single meal.
   - Only include pairings when they enhance the meal experience.
6. If a recipe is suggested and not in the user’s saved collection:
   - Set \`"ai_suggested": true\`
   - Return full recipe details in a \`"suggested_recipe"\` object
7. If no recipe can be found or suggested:
   - Return a **placeholder meal** with \`"is_placeholder": true\`
   - Prompt the user to add their own recipe in the app

### RESPONSE FORMAT:

Return only valid JSON that matches this structure:

{
  "success": true,
  "data": {
    "days": [
      {
        "day": "Monday",
        "date": "2025-06-24",
        "meals": [
          {
            "mealType": "breakfast",
            "recipes": [
              {
                "recipeId": "r1",
                "recipeTitle": "Avocado Toast",
                "imageUrl": "https://supabase.storage.link/avocado-toast.jpg",
                "ai_suggested": false,
                "leftover": false,
                "lunchbox": false,
                "is_placeholder": false
              }
            ]
          },
          {
            "mealType": "lunch",
            "recipes": [
              {
                "recipeId": "placeholder-lunch-1",
                "recipeTitle": "Your Recipe Here",
                "imageUrl": "https://supabase.storage.link/placeholder.jpg",
                "ai_suggested": false,
                "leftover": false,
                "lunchbox": false,
                "is_placeholder": true,
              }
            ]
          },
          {
            "mealType": "dinner",
            "recipes": [
              {
                "recipeId": "r3",
                "recipeTitle": "Chickpea Salad",
                "imageUrl": "https://supabase.storage.link/chickpea-salad.jpg",
                "ai_suggested": true,
                "leftover": true,
                "lunchbox": false,
                "is_placeholder": false,
                "suggested_recipe": {
                  "title": "Chickpea Salad",
                  "description": "A light and protein-rich salad with chickpeas, cucumbers, and lemon dressing.",
                  "ingredients": [
                    { "item": "chickpeas", "quantity": "1 cup" },
                    { "item": "cucumber", "quantity": "1 diced" },
                    { "item": "lemon", "quantity": "1 tbsp juice" }
                  ],
                  "instructions": [
                    "Mix all ingredients in a bowl.",
                    "Season with salt and pepper."
                  ],
                  "tags": ["Salad", "Dinner", "Sous-chef Suggested"],
                  "image_url": "https://supabase.storage.link/chickpea-salad.jpg",
                  "cooking_time": 15,
                  "servings": 2,
                  "difficulty": "Easy"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
Return only valid JSON. Do not include any explanatory text.
`;
}
// === Supabase Edge Function handler ===
serve(async (req)=>{
  try {
    const body = await req.json();
    const prompt = buildPrompt(body);
    const aiResponse = await getAIResponse(prompt);
    return new Response(JSON.stringify(aiResponse), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(JSON.stringify({
      success: false,
      error: e.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
