/* Shared nutrition helpers. Legacy records without nutrition_basis are per 100 g. */
function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scaledNutrition(food, amount = 1) {
  const factor = Number(amount) || 0;
  return {
    calories: Number(food?.calories || 0) * factor,
    protein: Number(food?.protein_g || 0) * factor,
    carbs: Number(food?.carbs_g || 0) * factor,
    fat: Number(food?.fat_g || 0) * factor
  };
}

/* Convert a recipe ingredient weight to nutrition. Serving-based foods need a recorded serving weight. */
function nutritionForGrams(food, grams) {
  const weight = Number(grams) || 0;
  if (food?.nutrition_basis === "per_serving") {
    const servingGrams = Number(food.serving_size_g);
    if (!servingGrams || servingGrams <= 0) return null;
    return scaledNutrition(food, weight / servingGrams);
  }
  return scaledNutrition(food, weight / 100);
}

function addNutrition(total, item) {
  total.calories += item.calories;
  total.protein += item.protein;
  total.carbs += item.carbs;
  total.fat += item.fat;
  return total;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
