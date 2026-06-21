import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab focus within the given container while it is mounted,
 * moves focus into the container on mount (to `initialFocusRef` if provided,
 * otherwise the first focusable element), and restores focus to whatever
 * element was focused before mount once the component unmounts.
 *
 * Escape handling and outside-click handling are left to the caller, since
 * those vary slightly (e.g. backdrop click) between modals.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  initialFocusRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!active) return;
    const maybeContainer = containerRef.current;
    if (!maybeContainer) return;
    const container: HTMLElement = maybeContainer;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      );

    // Move focus into the modal.
    const toFocus = initialFocusRef?.current ?? getFocusable()[0];
    toFocus?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !container.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, containerRef, initialFocusRef]);
}
