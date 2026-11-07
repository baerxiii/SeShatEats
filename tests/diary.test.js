const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function setup(overrides = {}) {
  const elements = new Map();
  class Element {
    constructor(id) {
      this.id = id;
      this.children = [];
      this.listeners = {};
      this.value = "";
      this.textContent = "";
    }
    addEventListener(event, callback) { this.listeners[event] = callback; }
    replaceChildren() { this.children = []; }
    appendChild(child) { this.children.push(child); }
    querySelector() { return this.button = new Element("button"); }
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element(id));
      return elements.get(id);
    },
    createElement() { return new Element(); }
  };
  const requests = [];
  const rows = {
    food_logs: [{ id: 1, servings: 2, meal_type: "Breakfast", canada_foods: { item_name: "Apple", calories: 50, protein_g: 1, carbs_g: 10, fat_g: 0 } }],
    recipe_logs: [{ id: 2, recipe_id: 3, servings: 1.5, meal_type: "Lunch" }],
    recipes: [{ id: 3, recipe_name: "Cabbage rolls", servings: 4 }],
    recipe_ingredients: [{ id: 4, recipe_id: 3, canada_food_id: 5, grams: 200 }],
    canada_foods: [{ id: 5, calories: 100, protein_g: 4, carbs_g: 20, fat_g: 2, weight_g: 100 }]
  };
  if (overrides.missingRecipe) rows.recipes = [];
  function from(table) {
    const request = { table, filters: [], action: "read" };
    requests.push(request);
    const builder = {
      select() { return this; },
      delete() { request.action = "delete"; return this; },
      eq(key, value) { request.filters.push([key, value]); return this; },
      in(key, value) { request.filters.push([key, value]); return this; },
      order() { return this; },
      then(resolve, reject) {
        const error = overrides.errorTable === table ? { message: "permission denied" } : null;
        const data = request.action === "delete"
          ? (overrides.deleteDenied ? [] : [{ id: request.filters[0][1] }])
          : rows[table];
        return Promise.resolve({ data, error }).then(resolve, reject);
      }
    };
    return builder;
  }
  const alerts = [];
  const context = vm.createContext({
    document, console, Date, setTimeout, confirm: () => true,
    alert: message => alerts.push(message),
    supabaseClient: {
      from,
      auth: {
        getSession: async () => ({ data: { session: overrides.signedOut ? null : { user: { id: "user-1" } } }, error: null }),
        onAuthStateChange: () => {}
      }
    }
  });
  for (const file of ["nutrition.js", "diary.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8"), context);
  }
  return { context, elements, requests, alerts };
}

test("loads food and recipe entries, calculates totals and deletes from the correct table", async () => {
  const app = setup();
  await vm.runInContext("loadDiary()", app.context);
  const get = id => app.elements.get(id);
  assert.match(get("lunchFoods").children[0].innerHTML, /Cabbage rolls/);
  assert.match(get("lunchFoods").children[0].innerHTML, /75 cal · P 3\.0g · C 15\.0g · F 1\.5g/);
  assert.equal(get("totalCalories").textContent, "175");
  assert.equal(get("breakfastCalories").textContent, "100 cal");
  assert.equal(get("lunchCalories").textContent, "75 cal");
  const date = get("diaryDate").value;
  for (const table of ["food_logs", "recipe_logs"]) {
    assert.ok(app.requests.some(r => r.table === table && r.filters.some(([key, value]) => key === "log_date" && value === date)));
  }
  assert.ok(app.requests.some(r => r.table === "food_logs" && r.filters.some(([key, value]) => key === "user_id" && value === "user-1")));
  const button = get("lunchFoods").children[0].button;
  await button.listeners.click({ currentTarget: button });
  assert.ok(app.requests.some(r => r.table === "recipe_logs" && r.action === "delete" && r.filters.some(([key, value]) => key === "id" && value === 2)));
  const foodButton = get("breakfastFoods").children[0].button;
  await foodButton.listeners.click({ currentTarget: foodButton });
  assert.ok(app.requests.some(r => r.table === "food_logs" && r.action === "delete" && r.filters.some(([key, value]) => key === "id" && value === 1)));
});

test("reports read and delete permission errors instead of hiding entries", async () => {
  const deniedRead = setup({ errorTable: "recipe_logs" });
  await vm.runInContext("loadDiary()", deniedRead.context);
  assert.match(deniedRead.elements.get("diaryStatus").textContent, /Could not load diary: permission denied/);
  const deniedDelete = setup({ deleteDenied: true });
  await vm.runInContext("loadDiary()", deniedDelete.context);
  const button = deniedDelete.elements.get("lunchFoods").children[0].button;
  await button.listeners.click({ currentTarget: button });
  assert.match(deniedDelete.alerts[0], /could not be deleted/i);
  assert.equal(button.disabled, false);
});

test("keeps unavailable recipes removable", async () => {
  const app = setup({ missingRecipe: true });
  await vm.runInContext("loadDiary()", app.context);
  const row = app.elements.get("lunchFoods").children[0];
  assert.match(row.innerHTML, /Recipe unavailable/);
  assert.match(row.innerHTML, /Nutrition unavailable/);
  await row.button.listeners.click({ currentTarget: row.button });
  assert.ok(app.requests.some(r => r.table === "recipe_logs" && r.action === "delete"));
});

test("handles sign-out and moves between local calendar dates", async () => {
  const app = setup({ signedOut: true });
  await vm.runInContext("loadDiary()", app.context);
  assert.match(app.elements.get("diaryStatus").textContent, /Sign in/);
  app.elements.get("diaryDate").value = "2026-03-08";
  app.elements.get("nextDayBtn").listeners.click();
  assert.equal(app.elements.get("diaryDate").value, "2026-03-09");
  app.elements.get("prevDayBtn").listeners.click();
  assert.equal(app.elements.get("diaryDate").value, "2026-03-08");
});
