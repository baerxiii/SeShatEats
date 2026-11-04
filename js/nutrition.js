/* Shared nutrition and display helpers. Food macros in usda_foods are per 100 g. */
function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scaledNutrition(food, factor = 1) {
  return {
    calories: Number(food?.calories || 0) * factor,
    protein: Number(food?.protein_g || 0) * factor,
    carbs: Number(food?.carbs_g || 0) * factor,
    fat: Number(food?.fat_g || 0) * factor
  };
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
