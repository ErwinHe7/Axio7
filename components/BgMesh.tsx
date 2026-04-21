'use client';

export function BgMesh() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Ocean-blue orb — top-left */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(11,79,108,0.22) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'drift 40s ease-in-out infinite',
        }}
      />
      {/* Shell-red orb — bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(216,71,39,0.16) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'drift-reverse 35s ease-in-out infinite',
        }}
      />
      {/* Dot grid */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dotgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="white" opacity="0.07" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>
    </div>
  );
}
