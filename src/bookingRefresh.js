export async function refreshBookingViews({ bookingId, loadBookings, loadOverview, loadClients, loadCalendar, onDiagnostics }) {
  const currentBookings = await loadBookings();
  const bookingIds = Array.isArray(currentBookings) ? currentBookings.map((booking) => String(booking.id)) : [];
  onDiagnostics?.({
    bookingId: bookingId == null ? null : String(bookingId),
    bookingsCount: bookingIds.length,
    bookingPresent: bookingId == null ? null : bookingIds.includes(String(bookingId)),
  });
  await Promise.all([loadOverview(), loadClients()]);
  if (loadCalendar) await loadCalendar();
  return currentBookings;
}
