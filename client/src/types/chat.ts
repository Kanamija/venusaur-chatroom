export interface Message {
  roomId: string;
  text: string;
  username: string;
  userId?: string;
  createdAt: string;
}
