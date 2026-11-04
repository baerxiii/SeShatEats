/* Shared nutrition helpers. Canadian food rows are recorded per their stated serving weight. */
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

/* Calculate nutrition for grams. Canada Foods values use weight_g as their serving weight. */
function nutritionForGrams(food, grams) {
  const weight = Number(grams) || 0;
  const servingWeight = Number(food?.weight_g);
  const factor = servingWeight > 0 ? weight / servingWeight : weight / 100;
  return scaledNutrition(food, factor);
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
