const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function setup(options = {}) {
  const elements = new Map();
  class Element {
    constructor() {
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.textContent = "";
    }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); }
    replaceChildren() { this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(event, callback) { this.listeners[event] = callback; }
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    createElement() { return new Element(); },
    createTextNode(value) { return { textContent: value }; }
  };
  const requests = [];
  const rows = {
    food_logs: [{ id: 1, servings: 2, meal_type: "Breakfast", canada_foods: { item_name: "Apple", calories: 50, protein_g: 1, carbs_g: 10, fat_g: 0 } }],
    recipe_logs: [{ id: 2, recipe_id: 3, servings: 1.5, meal_type: "Lunch" }],
    recipes: [{ id: 3, recipe_name: "Cabbage rolls", servings: 4 }],
    recipe_ingredients: [{ id: 4, recipe_id: 3, canada_food_id: 5, grams: 200 }],
    canada_foods: [{ id: 5, calories: 100, protein_g: 4, carbs_g: 20, fat_g: 2, weight_g: 100 }]
  };
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
        const error = options.errorTable === table && request.action === "read" ? { message: "permission denied" } : null;
        let data = rows[table];
        if (request.action === "delete") {
          const id = request.filters.find(([key]) => key === "id")[1];
          data = options.deleteDenied ? [] : rows[table].filter(row => row.id === id);
          if (!options.deleteDenied) rows[table] = rows[table].filter(row => row.id !== id);
        }
        return Promise.resolve({ data, error }).then(resolve, reject);
      }
    };
    return builder;
  }
  const alerts = [];
  const context = vm.createContext({
    document, console, Date, setTimeout, confirm: () => !options.cancel,
    alert: message => alerts.push(message),
    supabaseClient: {
      from,
      auth: {
        getSession: async () => ({ data: { session: options.signedOut ? null : { user: { id: "user-1", email: "test@example.com" } } }, error: null }),
        onAuthStateChange: () => {}
      }
    }
  });
  for (const file of ["nutrition.js", "logs.js", "dashboard.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8"), context);
  }
  return { context, elements, requests, alerts };
}

test("removes food and recipe logs and refreshes the dashboard totals", async () => {
  const app = setup();
  await vm.runInContext("loadDashboard()", app.context);
  const recent = app.elements.get("recentFoods");
  assert.equal(recent.children.length, 2);
  assert.equal(app.elements.get("calories").textContent, 175);
  assert.equal(app.elements.get("protein").textContent, "5.0g");
  const recipeButton = recent.children[1].children[1];
  assert.equal(recipeButton.attributes["aria-label"], "Delete 🍲 Cabbage rolls");
  await recipeButton.listeners.click();
  assert.ok(app.requests.some(r => r.table === "recipe_logs" && r.action === "delete" && r.filters.some(([key, value]) => key === "id" && value === 2)));
  assert.equal(app.elements.get("calories").textContent, 100);
  assert.equal(recent.children.length, 1);
  await recent.children[0].children[1].listeners.click();
  assert.ok(app.requests.some(r => r.table === "food_logs" && r.action === "delete" && r.filters.some(([key, value]) => key === "id" && value === 1)));
  assert.equal(app.elements.get("calories").textContent, 0);
});

test("does not delete on cancellation and reports rejected deletion", async () => {
  const cancelled = setup({ cancel: true });
  await vm.runInContext("loadDashboard()", cancelled.context);
  await cancelled.elements.get("recentFoods").children[0].children[1].listeners.click();
  assert.equal(cancelled.requests.filter(r => r.action === "delete").length, 0);
  const denied = setup({ deleteDenied: true });
  await vm.runInContext("loadDashboard()", denied.context);
  const button = denied.elements.get("recentFoods").children[1].children[1];
  await button.listeners.click();
  assert.match(denied.alerts[0], /could not be deleted/i);
  assert.equal(button.disabled, false);
  assert.equal(denied.elements.get("calories").textContent, 175);
});

test("reports read errors and resets totals for signed-out users", async () => {
  const denied = setup({ errorTable: "recipe_logs" });
  await vm.runInContext("loadDashboard()", denied.context);
  assert.match(denied.elements.get("recentFoods").textContent, /permission denied/);
  const signedOut = setup({ signedOut: true });
  await vm.runInContext("loadDashboard()", signedOut.context);
  assert.match(signedOut.elements.get("recentFoods").innerHTML, /Sign in/);
  assert.equal(signedOut.elements.get("calories").textContent, 0);
});

test("all pages reference a valid multi-size favicon using a relative path", () => {
  const root = path.join(__dirname, "..");
  const ico = fs.readFileSync(path.join(root, "favicon.ico"));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.ok(ico.readUInt16LE(4) >= 2);
  for (const page of ["index.html", "account.html", "admin-foods.html", "diary.html", "recipes.html", "search.html", "admin/bulk-importer.html", "admin/importer.html"]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    const expected = page.startsWith("admin/") ? "../favicon.ico?v=2" : "favicon.ico?v=2";
    assert.ok(html.includes(`rel="icon" href="${expected}" type="image/x-icon"`), page);
  }
});
