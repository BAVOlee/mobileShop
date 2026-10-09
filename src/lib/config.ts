export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://shop-rose-kappa.vercel.app").replace(/\/+$/, "");
export const APP_REDIRECT_URI = "morrowgoods://auth";

export const COLORS = {
  canvas: "#F3F0E9",
  paper: "#FFFDFA",
  ink: "#292720",
  muted: "#7B776E",
  faint: "#A9A398",
  line: "#E7E0D5",
  clay: "#9D6D4F",
  paleClay: "#EADFD3",
  green: "#657A5A",
  red: "#9B3E2E",
};

export const FREE_SHIPPING_THRESHOLD_KOBO = 5_000_000;
export const SHIPPING_FEE_KOBO = 250_000;
