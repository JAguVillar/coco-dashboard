import { createCourtsRepo } from "@/lib/repositories/courts.repo";
import { mapBookingToScheduleXEvent } from "@/lib/mappers/scheduleX.mapper";

export function useCourts() {
  const supabase = useSupabaseClient();
  const repo = createCourtsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadCourts() {
    loading.value = true;
    error.value = null;
    try {
      const rows = await repo.list();
      // return rows.map(mapBookingToScheduleXEvent);
      return rows
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createCourt(payload) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.create(payload);
      return mapBookingToScheduleXEvent(row);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { loadCourts, createCourt, loading, error };
}
