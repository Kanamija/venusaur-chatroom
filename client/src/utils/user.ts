export interface UserIdentity {
  username: string;
  guestId: string;
}

export const getCurrentUser = (): UserIdentity | null => {
    const username = localStorage.getItem('chat_username');
    let guestId = localStorage.getItem('chat_guest_id');

    if (!username) return null;

    if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('chat_guest_id', guestId);
    }

    return { username, guestId };
    };

    export const setGuestUser = (username: string): UserIdentity => {
    const guestId = crypto.randomUUID();
    localStorage.setItem('chat_username', username);
    localStorage.setItem('chat_guest_id', guestId);
    return { username, guestId };
};
