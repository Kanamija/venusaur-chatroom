export interface RoomTheme {
  name: string; // "Venusaur" | "Charizard" | "Pikachu" | "Mewtwo"
  bgGradient: string; // Tailwind gradient classes
  accentColor: string; // Border or button accent colors
  spriteUrl: string; // Character sprite image path
  isAvailable: boolean; // true for Venusaur, false for upcoming rooms
  bgImageUrl?: string; // Optional illustrated background (e.g. Mewtwo's crystal cave)
  effect?: 'psychic'; // Optional animated scene layered over the background
  isPremium?: boolean; // Requires a one-time Stripe Checkout unlock
  premiumPriceLabel?: string; // Shown on the unlock button, e.g. "CA$3"
}
