export const formatCurrency = (value: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));

export const cn = (...classes: Array<string | false | undefined | null>) =>
  classes.filter(Boolean).join(" ");

export const makeBookingRef = (index: number) => `KR-${String(index).padStart(4, "0")}`;
