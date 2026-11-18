export const ROOM_NAMES = [
  'Venusaur',
  'Charizard',
  'Pikachu',
  'Mewtwo',
] as const;

export type RoomName = (typeof ROOM_NAMES)[number];

// Premium rooms need a one-time Stripe Checkout payment to join.
// Each one maps to the env var that holds its Stripe Price ID.
export const PREMIUM_ROOMS: Partial<Record<RoomName, string>> = {
  Mewtwo: 'STRIPE_PRICE_MEWTWO',
};

export function isPremiumRoom(roomName: string): roomName is RoomName {
  return Object.hasOwn(PREMIUM_ROOMS, roomName);
}

// Read lazily so the value comes from the loaded .env, not import order.
export function getPremiumRoomPriceId(roomName: RoomName): string | undefined {
  const envVar = PREMIUM_ROOMS[roomName];
  return envVar ? process.env[envVar] : undefined;
}
