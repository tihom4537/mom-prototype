import { useEffect, useState } from 'react';

/** Returns true when html.a11y-high-contrast is active. Reacts to changes. */
export function useHighContrast(): boolean {
  const [active, setActive] = useState(() =>
    document.documentElement.classList.contains('a11y-high-contrast')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setActive(document.documentElement.classList.contains('a11y-high-contrast'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return active;
}
