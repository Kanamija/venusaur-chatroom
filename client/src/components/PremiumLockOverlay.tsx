import React from 'react';
import { LockIcon } from './RoomHeader';

interface PremiumLockOverlayProps {
  roomName: string;
  priceLabel?: string;
  isChecking: boolean; // Still asking the server whether this user has access
  isRedirecting: boolean; // Waiting on Stripe Checkout to open
  error?: string | null;
  onUnlock: () => void;
  // Paid, but the server hasn't confirmed the unlock yet. Shows "Check again"
  // instead of the Unlock button so nobody pays twice.
  isFinishingUnlock?: boolean;
  isRecheckingAccess?: boolean;
  onCheckAgain?: () => void;
}

// Glassy card shown in the message area of a premium room that isn't unlocked yet.
// The room's animated background stays visible behind it.
export const PremiumLockOverlay: React.FC<PremiumLockOverlayProps> = ({
  roomName,
  priceLabel,
  isChecking,
  isRedirecting,
  error,
  onUnlock,
  isFinishingUnlock = false,
  isRecheckingAccess = false,
  onCheckAgain,
}) => {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-fuchsia-300/30 bg-black/55 backdrop-blur-md p-6 text-center shadow-[0_0_40px_rgba(192,132,252,0.25)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-300/40 bg-fuchsia-500/15 text-fuchsia-200">
        <LockIcon className="h-7 w-7" />
      </div>

      {isFinishingUnlock ? (
        <>
          <h2 className="font-mono text-lg font-bold text-white">
            Payment received
          </h2>
          <p className="mt-2 font-mono text-sm text-fuchsia-100/80">
            Finishing your unlock… this usually takes a few seconds.
          </p>
          <button
            type="button"
            onClick={onCheckAgain}
            disabled={isRecheckingAccess}
            className="mt-5 w-full rounded-lg bg-fuchsia-300 px-4 py-3 font-mono text-sm font-bold text-black transition-colors hover:bg-fuchsia-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isRecheckingAccess ? 'Checking…' : 'Check again'}
          </button>
        </>
      ) : (
        <>
          <h2 className="font-mono text-lg font-bold text-white">
            {roomName}&apos;s room is premium
          </h2>
          <p className="mt-2 font-mono text-sm text-fuchsia-100/80">
            One payment unlocks the crystal cave for good.
          </p>

          <button
            type="button"
            onClick={onUnlock}
            disabled={isChecking || isRedirecting}
            className="mt-5 w-full rounded-lg bg-fuchsia-300 px-4 py-3 font-mono text-sm font-bold text-black transition-colors hover:bg-fuchsia-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isChecking
              ? 'Checking access…'
              : isRedirecting
                ? 'Opening checkout…'
                : `Unlock for ${priceLabel ?? 'a small fee'}`}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 font-mono text-xs text-rose-300">
          {error}
        </p>
      )}

      <p className="mt-3 font-mono text-[11px] text-gray-400">
        Secure payment by Stripe
      </p>
    </div>
  );
};

export default PremiumLockOverlay;
