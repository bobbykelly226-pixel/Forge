'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const REFRESH_DISTANCE = 100;

/** Installed apps lack browser chrome; ordinary browser tabs keep native refresh. */
export default function ForgePullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const installed = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!installed) return;

    let gesture: { x: number; y: number; distance: number; target: HTMLElement } | null = null;
    let reloading = false;

    const atTop = (target: HTMLElement) => {
      if ((document.scrollingElement?.scrollTop ?? window.scrollY) > 1) return false;
      for (let node: HTMLElement | null = target; node; node = node.parentElement) {
        if (node.scrollTop > 1) return false;
      }
      return true;
    };
    const cancel = () => {
      gesture = null;
      setDistance(0);
    };
    const start = (event: TouchEvent) => {
      cancel();
      if (reloading || event.touches.length !== 1 || !(event.target instanceof HTMLElement)) return;
      const target = event.target;
      if (document.querySelector('dialog[open], [role="dialog"], [aria-modal="true"]') ||
          target.closest('input, textarea, select, button, a, video, [contenteditable], nav, [role="slider"]') ||
          document.activeElement?.matches('input, textarea, select, [contenteditable]') ||
          !atTop(target)) return;
      const touch = event.touches[0];
      gesture = { x: touch.clientX, y: touch.clientY, distance: 0, target };
    };
    const move = (event: TouchEvent) => {
      if (!gesture) return;
      if (event.touches.length !== 1 || !atTop(gesture.target)) { cancel(); return; }
      const touch = event.touches[0];
      const vertical = touch.clientY - gesture.y;
      const horizontal = Math.abs(touch.clientX - gesture.x);
      if (vertical < 0 || horizontal > Math.max(20, vertical)) { cancel(); return; }
      gesture.distance = Math.min(140, vertical);
      if (vertical > 10) {
        if (event.cancelable) event.preventDefault();
        setDistance(gesture.distance);
      }
    };
    const end = () => {
      const shouldRefresh = gesture !== null && gesture.distance >= REFRESH_DISTANCE;
      cancel();
      if (!shouldRefresh || reloading) return;
      reloading = true;
      setRefreshing(true);
      window.location.reload();
    };

    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end, { passive: true });
    document.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', cancel);
    };
  }, []);

  if (distance <= 10 && !refreshing) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      <div className="flex items-center gap-2 rounded-full border border-[#0B2D5C]/20 bg-[#F7F7F7] px-4 py-2 text-sm font-semibold text-[#0B2D5C] shadow-md">
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
        {refreshing ? 'Refreshing…' : distance >= REFRESH_DISTANCE ? 'Release to refresh' : 'Pull down to refresh'}
      </div>
    </div>
  );
}
