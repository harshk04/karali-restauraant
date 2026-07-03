export const cn = (...parts: Array<string | false | undefined | null>) =>
  parts.filter(Boolean).join(" ");
