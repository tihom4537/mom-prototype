import { useEffect, useState } from 'react';

interface ScaleToFitHeightProps {
  children: React.ReactNode;
  designHeight?: number;
  className?: string;
}

/**
 * Scales a fixed-viewport (h-screen) shell down proportionally when the
 * actual viewport is shorter than the design height — same visible content
 * and scroll behaviour on any screen size, since the whole shell (chrome +
 * content) shrinks together rather than just clipping/scrolling more.
 * Width always fills the real viewport (compensated post-scale) so layout
 * never gets capped to a fixed design width like the public-page variant.
 */
export default function ScaleToFitHeight({ children, designHeight = 900, className }: ScaleToFitHeightProps) {
  const [scale, setScale] = useState(1);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    function update() {
      const vh = window.innerHeight;
      setScale(vh >= designHeight ? 1 : vh / designHeight);
      setVw(window.innerWidth);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [designHeight]);

  return (
    <div className={className} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div
        style={{
          width: scale < 1 ? vw / scale : '100%',
          height: scale < 1 ? designHeight : '100%',
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
