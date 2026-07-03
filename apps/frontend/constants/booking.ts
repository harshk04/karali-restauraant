export const bookingDates = Array.from({ length: 7 }).map((_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date.toISOString().slice(0, 10);
});

export const bookingTimes = ["18:00", "18:30", "19:00", "19:45", "20:30", "21:00"];
