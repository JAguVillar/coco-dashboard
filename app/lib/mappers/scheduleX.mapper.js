// app/lib/mappers/scheduleX.mapper.js
const TZ = "America/Argentina/Buenos_Aires";

function toZdt(isoString) {
  const instant = globalThis.Temporal.Instant.from(isoString);
  return instant.toZonedDateTimeISO(TZ);
}

export function mapBookingToScheduleXEvent(booking) {
  console.log(booking);

  return {
    id: booking.id,
    title: `${booking.booking_type?.icon ?? ""}${
      booking.title ?? `Turno - ${booking.court?.name ?? ""}`
    }`,
    start: toZdt(booking.start_at),
    end: toZdt(booking.end_at),
    calendarId: booking.court?.slug,
    description: "salkdfjaklsd",
    people: ["Agustin"],
    meta: {
      state: booking.booking_state,
    },
  };
}
