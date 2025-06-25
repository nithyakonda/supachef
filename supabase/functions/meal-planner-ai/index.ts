const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Load environment variables for AI provider selection
const AI_PROVIDER = Deno.env.get("AI_PROVIDER") ?? "groq";

// === Adapter: Groq + Mixtral (mistral-saba-24b) ===
async function callGroq(prompt: string) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const raw = result?.choices?.[0]?.message?.content?.trim() || "";
  
  if (!raw) {
    throw new Error("Empty response from Groq API");
  }

  const cleaned = raw.replace(/^```json\s*|^```\s*|```$/g, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error("Failed to parse Groq response:", cleaned);
    throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
  }
}

// === Adapter: Claude (Anthropic) ===
async function callClaude(prompt: string) {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY environment variable is not set");
  }

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const content = result?.content?.[0]?.text ?? "{}";
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error("Failed to parse Claude response:", content);
    throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
  }
}

// === Adapter: OpenAI ===
async function callOpenAI(prompt: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const message = result?.choices?.[0]?.message?.content ?? "{}";
  
  try {
    return JSON.parse(message);
  } catch (parseError) {
    console.error("Failed to parse OpenAI response:", message);
    throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
  }
}

// === Dispatcher ===
async function getAIResponse(prompt: string) {
  switch(AI_PROVIDER) {
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
function buildPrompt({ preferences, ingredients, savedRecipes }: any) {
  const now = new Date();
  // ISO date string (e.g. "2025-06-24")
  const todayISO = now.toISOString().split("T")[0];
  // Weekday name (e.g. "Monday")
  const weekdayName = now.toLocaleDateString("en-US", {
    weekday: "long"
  });

  const recipeText = savedRecipes.map((r: any, i: number) => 
    `${i + 1}. ${r.title} (id: ${r.id})  \n   Image: ${r.imageUrl}  \n   Tags: ${r.tags.join(", ")}  \n   Description: ${r.description}`
  ).join("\n\n");

  return `You are an AI assistant generating weekly meal plans for a user. You must return a structured plan in JSON format using the user's saved recipes, preferences, and available ingredients. Your output will be used by a mobile app.

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
6. If a recipe is suggested and not in the user's saved collection:
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
                "is_placeholder": true
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

Return only valid JSON. Do not include any explanatory text.`;
}

// === Supabase Edge Function handler ===
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed. Use POST instead.",
        }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    if (!body.preferences || !body.ingredients || !body.savedRecipes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: preferences, ingredients, or savedRecipes",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build prompt and get AI response
    const prompt = buildPrompt(body);
    const aiResponse = await getAIResponse(prompt);

    return new Response(
      JSON.stringify(aiResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});