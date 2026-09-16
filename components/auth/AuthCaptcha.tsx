'use client';

import { useEffect, useRef } from 'react';

import { getAuthCaptchaSiteKey, isAuthCaptchaEnabled } from '@/lib/auth/captcha';

type AuthCaptchaProps = {
  resetKey: number;
  fitContainer?: boolean;
  onTokenChange: (token: string | null) => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: 'light';
      size: 'flexible' | 'compact';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function AuthCaptcha({ resetKey, onTokenChange, fitContainer = false }: AuthCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enabled = isAuthCaptchaEnabled();
  const siteKey = getAuthCaptchaSiteKey();

  useEffect(() => {
    if (!enabled || !siteKey || !containerRef.current) return;

    let cancelled = false;
    let widgetId: string | null = null;
    let widgetSize: 'flexible' | 'compact' | null = null;

    const renderWidget = () => {
      if (cancelled || widgetId || !window.turnstile || !containerRef.current) return;
      widgetSize = fitContainer && containerRef.current.clientWidth < 300 ? 'compact' : 'flexible';
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: widgetSize,
        callback: (token) => onTokenChange(token),
        'expired-callback': () => onTokenChange(null),
        'error-callback': () => onTokenChange(null),
      });
    };

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderWidget);
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget);
      document.head.appendChild(script);
    }

    const observer = fitContainer ? new ResizeObserver(() => {
      if (!containerRef.current || !window.turnstile) return;
      const nextSize = containerRef.current.clientWidth < 300 ? 'compact' : 'flexible';
      if (nextSize === widgetSize) return;
      if (widgetId) window.turnstile.remove(widgetId);
      widgetId = null;
      onTokenChange(null);
      renderWidget();
    }) : null;
    if (containerRef.current) observer?.observe(containerRef.current);

    return () => {
      observer?.disconnect();
      cancelled = true;
      existingScript?.removeEventListener('load', renderWidget);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenChange(null);
    };
  }, [enabled, onTokenChange, resetKey, siteKey, fitContainer]);

  if (!enabled) return null;

  if (!siteKey) {
    return (
      <p className="text-sm text-red-600" role="alert">
        The security check is temporarily unavailable. Please try again later.
      </p>
    );
  }

  return (
    <div ref={containerRef} className={fitContainer ? "flex w-full min-w-0 justify-center" : "flex justify-center"} aria-label="Security check" />
  );
}
