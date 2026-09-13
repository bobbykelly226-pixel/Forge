'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/** Forward destinations start at the top; browser history retains its restoration. */
export default function ForwardNavigationScroll() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const historyNavigation = useRef(false);

  useEffect(() => {
    const onPopState = () => { historyNavigation.current = true; };
    const onForwardClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href]')) {
        historyNavigation.current = false;
      }
    };
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onForwardClick, true);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onForwardClick, true);
    };
  }, []);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (historyNavigation.current) {
      historyNavigation.current = false;
      return;
    }
    // Explicit section links own their scroll position.
    if (window.location.hash || new URLSearchParams(window.location.search).has('section')) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.querySelectorAll<HTMLElement>('[data-forge-scroll-region]').forEach((node) => {
        node.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}
