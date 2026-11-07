let dashboardRequest = 0;
const recentFoods = document.getElementById("recentFoods");

function updateDashboardTotals(total) {
  document.getElementById("calories").textContent = Math.round(total.calories);
  for (const macro of ["protein", "carbs", "fat"]) {
    document.getElementById(macro).textContent = `${total[macro].toFixed(1)}g`;
  }
}

async function loadDashboard() {
  const request = ++dashboardRequest;
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  updateDashboardTotals(total);
  recentFoods.textContent = "Loading...";
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    if (request !== dashboardRequest) return;
    const user = sessionData.session?.user;
    document.getElementById("userMenu").textContent = user ? `👤 ${user.email || "Account"}` : "Not signed in";
    if (!user) {
      recentFoods.innerHTML = 'Sign in on the <a href="account.html">account page</a> to see your personal diary.';
      return;
    }

    const date = localDateKey();
    const [foodResult, recipeResult] = await Promise.all([
      supabaseClient.from("food_logs")
        .select("id,servings,meal_type,canada_food_id,restaurant_food_id,food_id,canada_foods(item_name,calories,protein_g,carbs_g,fat_g,weight_g,serving_measure),restaurant_foods(restaurant,item_name,calories,protein_g,carbs_g,fat_g,serving_size)")
        .eq("user_id", user.id).eq("log_date", date).order("created_at", { ascending: false }),
      supabaseClient.from("recipe_logs").select("id,recipe_id,servings,meal_type").eq("log_date", date)
    ]);
    if (foodResult.error) throw foodResult.error;
    if (recipeResult.error) throw recipeResult.error;
    const recipeLogs = recipeResult.data || [];
    const { recipes, error } = await loadCanadianRecipeTotals(recipeLogs.map(log => log.recipe_id));
    if (error) throw error;
    if (request !== dashboardRequest) return;

    const rows = [];
    for (const log of foodResult.data || []) {
      const food = log.restaurant_foods || log.canada_foods;
      if (!food) {
        rows.push({ table: "food_logs", id: log.id, name: "Legacy food entry",
          details: `old catalogue ID ${Number(log.food_id)} · nutrition unavailable` });
        continue;
      }
      const nutrition = scaledNutrition(food, Number(log.servings || 1));
      addNutrition(total, nutrition);
      rows.push({ table: "food_logs", id: log.id, name: food.item_name,
        details: `${log.meal_type || ""} · ${log.restaurant_foods ? food.restaurant || "Restaurant" : "Canada"} · ${Math.round(nutrition.calories)} kcal` });
    }
    for (const log of recipeLogs) {
      const recipe = recipes.get(String(log.recipe_id));
      if (!recipe) {
        rows.push({ table: "recipe_logs", id: log.id, name: "Recipe unavailable", details: "Nutrition unavailable" });
        continue;
      }
      const nutrition = scaledNutrition(recipe, Number(log.servings || 1) / Number(recipe.servings || 1));
      addNutrition(total, nutrition);
      const note = recipe.legacyIngredients ? ` · ${recipe.legacyIngredients} old ingredient(s) excluded` : "";
      rows.push({ table: "recipe_logs", id: log.id, name: `🍲 ${recipe.recipe_name}`,
        details: `${log.meal_type || ""} · ${Math.round(nutrition.calories)} kcal${note}` });
    }

    recentFoods.replaceChildren();
    for (const entry of rows.slice(0, 8)) {
      const row = document.createElement("div");
      row.className = "food-row dashboard-food-row";
      const description = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = entry.name;
      description.append(name, document.createTextNode(` · ${entry.details}`));
      const button = document.createElement("button");
      button.type = "button";
      button.className = "delete-btn dashboard-delete";
      button.setAttribute("aria-label", `Delete ${entry.name}`);
      button.textContent = "🗑️";
      button.addEventListener("click", async () => {
        if (!confirm("Delete this diary entry?")) return;
        button.disabled = true;
        try {
          await deleteDiaryEntry(entry.table, entry.id);
          await loadDashboard();
        } catch (error) {
          alert(`Could not delete diary entry: ${error.message}`);
          button.disabled = false;
        }
      });
      row.append(description, button);
      recentFoods.appendChild(row);
    }
    if (!rows.length) recentFoods.innerHTML = '<p>No food logged yet. <a href="search.html">Search foods</a>.</p>';
    updateDashboardTotals(total);
  } catch (error) {
    if (request === dashboardRequest) recentFoods.textContent = `Could not load today's entries: ${error.message}`;
  }
}

supabaseClient.auth.onAuthStateChange(() => setTimeout(loadDashboard, 0));
loadDashboard();
