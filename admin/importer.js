document
  .getElementById("importBtn")
  .addEventListener("click", importCSV);

async function importCSV() {

  const file =
      document.getElementById("csvFile").files[0];

  const restaurant =
      document.getElementById("restaurantName").value;

  if(!file){
      alert("Choose a CSV file");
      return;
  }

  const text = await file.text();

  const rows =
      text.trim().split("\n");

  const headers =
      rows[0].split(",");

  let imported = 0;

  let restaurantId;

  const existingRestaurant =
      await supabaseClient
      .from("restaurants")
      .select("*")
      .eq("name", restaurant)
      .single();

  if(existingRestaurant.data){
      restaurantId =
          existingRestaurant.data.id;
  } else {

      const created =
          await supabaseClient
          .from("restaurants")
          .insert({
              name: restaurant
          })
          .select()
          .single();

      restaurantId =
          created.data.id;
  }

  for(let i=1;i<rows.length;i++){

      const cols = rows[i].split(",");

      await supabaseClient
      .from("foods")
      .insert({

          restaurant_id: restaurantId,

          item_name: cols[0],

          category: cols[1],

          calories: Number(cols[2]),

          protein_g: Number(cols[3]),

          carbs_g: Number(cols[4]),

          fat_g: Number(cols[5]),

          source: "CSV Import"
      });

      imported++;
  }

  document.getElementById("status").innerHTML =
      `Imported ${imported} foods`;
}
