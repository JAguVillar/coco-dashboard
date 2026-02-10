import { mapDatabaseError } from "@/lib/utils/errors";

export function createClientsRepo(supabase) {
  return {
    async list({ from, to } = {}) {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("full_name");

      if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw mapDatabaseError(error);
      return { data: data ?? [], count: count ?? 0 };
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("clients")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw mapDatabaseError(error, { entity: "clients" });

      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw mapDatabaseError(error, { entity: "clients" });

      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw mapDatabaseError(error);

      return data;
    },
  };
}
