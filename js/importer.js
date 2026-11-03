const USDA_API_KEY = "dM79cBJbF9BDftkGDJBCPhF9jDRztRjQbwdNCtcN";

document
    .getElementById("searchBtn")
    .addEventListener("click", importFood);

async function importFood() {

    const search =
        document.getElementById("foodSearch").value;

    const url =
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(search)}&api_key=${USDA_API_KEY}`;

    const response = await fetch(url);

    const data = await response.json();

    console.log(data);

    document.getElementById("results").innerText =
        JSON.stringify(data.foods[0], null, 2);
}
