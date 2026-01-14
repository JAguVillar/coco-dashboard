import { createBookingsRepo } from "@/lib/repositories/bookings.repo";
import { mapBookingToScheduleXEvent } from "@/lib/mappers/scheduleX.mapper";

export function useBookings() {
  const supabase = useSupabaseClient();
  const repo = createBookingsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadRange({ fromISO, toISO }) {
    loading.value = true;
    error.value = null;

    try {
      const rows = await repo.listByRange({ fromISO, toISO }); // <-- RAW DB rows
      return (rows ?? []).map(mapBookingToScheduleXEvent).filter(Boolean); // por si algo viene raro
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createBooking(payload) {
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
  return { createBooking, loadRange, loading, error };
}
