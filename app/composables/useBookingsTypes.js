import { createBookingsTypesRepo } from "@/lib/repositories/bookingTypes.repo";
import { mapBookingToScheduleXEvent } from "@/lib/mappers/scheduleX.mapper";

export function useBookingsTypes() {
  const supabase = useSupabaseClient();
  const repo = createBookingsTypesRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadBookinkgTypes() {
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

  async function createBookingType(payload) {
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

  return { loadBookinkgTypes, createBookingType, loading, error };
}
