export interface RoomTheme {
  name: string; // "Venusaur" | "Charizard" | "Pikachu"
  bgGradient: string; // Tailwind gradient classes
  accentColor: string; // Border or button accent colors
  spriteUrl: string; // Character sprite image path
  isAvailable: boolean; // true for Venusaur, false for upcoming rooms
}
