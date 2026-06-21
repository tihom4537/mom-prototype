import { createContext, useContext, useEffect, useRef, useState } from 'react';

const PageScaleContext = createContext(1);

export function usePageScale(): number {
  return useContext(PageScaleContext);
}

interface ScaleToFitProps {
  children: React.ReactNode;
  designWidth?: number;
  className?: string;
}

export default function ScaleToFit({ children, designWidth = 1440, className }: ScaleToFitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    const inner = outerRef.current?.firstElementChild as HTMLElement | null;
    if (!inner) return;

    function update() {
      const viewportWidth = window.innerWidth;
      const nextScale = viewportWidth >= designWidth ? 1 : viewportWidth / designWidth;
      setScale(nextScale);
      setInnerHeight(inner!.scrollHeight);
    }

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(inner);
    window.addEventListener('resize', update);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [designWidth]);

  return (
    <PageScaleContext.Provider value={scale}>
      <div
        ref={outerRef}
        className={className}
        style={{ width: '100%', height: scale < 1 ? innerHeight * scale : undefined, overflow: 'hidden' }}
      >
        <div
          style={{
            width: scale < 1 ? designWidth : '100%',
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </PageScaleContext.Provider>
  );
}
