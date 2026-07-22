export async function updateBookingStatusSafely({ bookingId, status, updateStatus, cancel, restore, refresh }) {
  const booking = status === "cancelled"
    ? await cancel(bookingId)
    : status === "restore"
      ? await restore(bookingId)
      : await updateStatus(bookingId, status);

  if (!booking?.id) throw new Error("Booking API не подтвердил изменение статуса.");
  await refresh(booking.id);
  return booking;
}
