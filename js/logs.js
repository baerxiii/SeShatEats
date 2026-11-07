async function deleteDiaryEntry(table, id) {
  const { data, error } = await supabaseClient.from(table).delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("The entry could not be deleted. Check your permissions.");
}
