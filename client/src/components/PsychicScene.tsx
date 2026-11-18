import React from 'react';

interface PsychicSceneProps {
  imageUrl: string;
}

// Crystal sparkle positions, as percentages of the background artwork.
const SPARKLES = [
  { left: '9%', top: '46%', delay: '0s' },
  { left: '7%', top: '72%', delay: '1.2s' },
  { left: '15%', top: '58%', delay: '2.1s' },
  { left: '27%', top: '55%', delay: '0.6s' },
  { left: '74%', top: '64%', delay: '1.8s' },
  { left: '82%', top: '45%', delay: '0.3s' },
  { left: '92%', top: '70%', delay: '2.6s' },
  { left: '88%', top: '84%', delay: '1.5s' },
];

// Motes of psychic energy drifting up from the lake.
const MOTES = [
  { left: '38%', delay: '0s', duration: '7s' },
  { left: '44%', delay: '2.5s', duration: '9s' },
  { left: '52%', delay: '1s', duration: '8s' },
  { left: '57%', delay: '4s', duration: '10s' },
  { left: '63%', delay: '3s', duration: '7.5s' },
  { left: '47%', delay: '5.5s', duration: '8.5s' },
];

// Animated crystal cave behind the Mewtwo room.
// The scene box always matches the artwork's 16:9 shape and covers the room,
// so the animated orb and ripples stay lined up with the painted ones on any screen size.
export const PsychicScene: React.FC<PsychicSceneProps> = ({ imageUrl }) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ containerType: 'size' }}
      aria-hidden="true"
    >
      <div
        className="psy-scene absolute left-1/2 top-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* Psychic orb: pulsing glow plus a spinning energy ring */}
        <div className="psy-orb-glow" />
        <div className="psy-orb-ring" />
        <div className="psy-orb-core" />

        {/* Lake ripples spreading out under the orb */}
        <div className="psy-ripple" />
        <div className="psy-ripple" style={{ animationDelay: '1.3s' }} />
        <div className="psy-ripple" style={{ animationDelay: '2.6s' }} />

        {/* Crystal shimmer */}
        {SPARKLES.map((s, i) => (
          <span
            key={`sparkle-${i}`}
            className="psy-sparkle"
            style={{ left: s.left, top: s.top, animationDelay: s.delay }}
          />
        ))}

        {/* Rising motes */}
        {MOTES.map((m, i) => (
          <span
            key={`mote-${i}`}
            className="psy-mote"
            style={{
              left: m.left,
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
          />
        ))}
      </div>

      {/* Darken behind the message column so chat stays readable */}
      <div className="absolute inset-0 bg-black/45 md:bg-transparent md:bg-gradient-to-r md:from-black/65 md:via-black/25 md:to-transparent" />
    </div>
  );
};

export default PsychicScene;
