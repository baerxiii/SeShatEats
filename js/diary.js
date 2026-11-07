const diaryDate = document.getElementById("diaryDate");
const diaryStatus = document.getElementById("diaryStatus");
let diaryRequest = 0;

diaryDate.value = localDateKey();

function moveDiaryDate(days) {
  if (!diaryDate.value) {
    diaryDate.value = localDateKey();
    loadDiary();
    return;
  }
  const [year, month, day] = diaryDate.value.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  diaryDate.value = localDateKey(date);
  loadDiary();
}

document.getElementById("prevDayBtn").addEventListener("click", () => moveDiaryDate(-1));
document.getElementById("nextDayBtn").addEventListener("click", () => moveDiaryDate(1));
diaryDate.addEventListener("change", loadDiary);

async function loadDiary() {
  const request = ++diaryRequest;
  const date = diaryDate.value;
  renderDiary([], [], new Map());
  if (!date) {
    diaryStatus.textContent = "Select a date to view your diary.";
    return;
  }
  diaryStatus.textContent = "Loading diary...";
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    if (request !== diaryRequest) return;
    const user = sessionData.session?.user;
    if (!user) {
      diaryStatus.textContent = "Sign in on the account page to see your diary.";
      return;
    }

    const [foodResult, recipeResult] = await Promise.all([
      supabaseClient.from("food_logs")
        .select("id,servings,meal_type,food_id,canada_foods(item_name,calories,protein_g,carbs_g,fat_g),restaurant_foods(item_name,calories,protein_g,carbs_g,fat_g,restaurant)")
        .eq("user_id", user.id).eq("log_date", date).order("created_at", { ascending: true }),
      supabaseClient.from("recipe_logs")
        .select("id,recipe_id,servings,meal_type")
        .eq("log_date", date)
    ]);
    if (foodResult.error) throw foodResult.error;
    if (recipeResult.error) throw recipeResult.error;
    const recipeLogs = recipeResult.data || [];
    const { recipes, error } = await loadCanadianRecipeTotals(recipeLogs.map(log => log.recipe_id));
    if (error) throw error;
    if (request !== diaryRequest) return;
    renderDiary(foodResult.data || [], recipeLogs, recipes);
    diaryStatus.textContent = "";
  } catch (error) {
    if (request === diaryRequest) {
      diaryStatus.textContent = `Could not load diary: ${error.message}`;
    }
  }
}

function renderDiary(foodLogs, recipeLogs, recipes) {
  const meals = {};
  const mealCalories = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of Object.keys(mealCalories)) {
    meals[meal] = document.getElementById(`${meal}Foods`);
    meals[meal].replaceChildren();
  }

  function addEntry(log, table, name, nutrition, note = "") {
    const meal = String(log.meal_type || "").toLowerCase();
    const mealKey = Object.hasOwn(meals, meal) ? meal : "snack";
    if (nutrition) {
      addNutrition(totals, nutrition);
      mealCalories[mealKey] += nutrition.calories;
    }
    const row = document.createElement("div");
    row.className = "food-item";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="food-name">${escapeHTML(name)}</div>
          <div class="food-macros">${nutrition
            ? `${Math.round(nutrition.calories)} cal · P ${nutrition.protein.toFixed(1)}g · C ${nutrition.carbs.toFixed(1)}g · F ${nutrition.fat.toFixed(1)}g`
            : "Nutrition unavailable"}${note ? ` · ${escapeHTML(note)}` : ""}</div>
        </div>
        <button type="button" class="delete-food" aria-label="Delete ${escapeHTML(name)}">🗑️</button>
      </div>`;
    row.querySelector(".delete-food").addEventListener("click", async event => {
      if (!confirm("Delete this diary entry?")) return;
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const { data, error } = await supabaseClient.from(table).delete().eq("id", log.id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("The entry could not be deleted. Check your permissions.");
        await loadDiary();
      } catch (error) {
        alert(`Could not delete diary entry: ${error.message}`);
        button.disabled = false;
      }
    });
    meals[mealKey].appendChild(row);
  }

  for (const log of foodLogs) {
    const food = log.restaurant_foods || log.canada_foods;
    addEntry(log, "food_logs", food?.item_name || "Legacy food entry",
      food ? scaledNutrition(food, Number(log.servings || 1)) : null);
  }
  for (const log of recipeLogs) {
    const recipe = recipes.get(String(log.recipe_id));
    const nutrition = recipe ? scaledNutrition(recipe, Number(log.servings || 1) / Number(recipe.servings || 1)) : null;
    const note = recipe?.legacyIngredients ? `${recipe.legacyIngredients} old ingredient(s) excluded` : "";
    addEntry(log, "recipe_logs", recipe ? `🍲 ${recipe.recipe_name}` : "Recipe unavailable", nutrition, note);
  }
  for (const meal of Object.keys(meals)) {
    document.getElementById(`${meal}Calories`).textContent = `${Math.round(mealCalories[meal])} cal`;
    if (!meals[meal].children.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = `No ${meal === "snack" ? "snacks" : meal} logged`;
      meals[meal].appendChild(empty);
    }
  }
  for (const [id, value] of Object.entries(totals)) {
    const label = id[0].toUpperCase() + id.slice(1);
    document.getElementById(`total${label}`).textContent = Math.round(value) + (id === "calories" ? "" : "g");
  }
}

supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(loadDiary, 0);
});
loadDiary();
