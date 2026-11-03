async function testConnection() {

    const { data, error } =
        await supabaseClient
            .from("restaurants")
            .select("*");

    console.log(data);
    console.log(error);
}

testConnection();
