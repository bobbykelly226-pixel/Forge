'use client';

import { useEffect, useRef } from 'react';

import { getAuthCaptchaSiteKey, isAuthCaptchaEnabled } from '@/lib/auth/captcha';

type AuthCaptchaProps = {
  resetKey: number;
  onTokenChange: (token: string | null) => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: 'light';
      size: 'flexible';
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

export default function AuthCaptcha({ resetKey, onTokenChange }: AuthCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enabled = isAuthCaptchaEnabled();
  const siteKey = getAuthCaptchaSiteKey();

  useEffect(() => {
    if (!enabled || !siteKey || !containerRef.current) return;

    let cancelled = false;
    let widgetId: string | null = null;

    const renderWidget = () => {
      if (cancelled || widgetId || !window.turnstile || !containerRef.current) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
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

    return () => {
      cancelled = true;
      existingScript?.removeEventListener('load', renderWidget);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenChange(null);
    };
  }, [enabled, onTokenChange, resetKey, siteKey]);

  if (!enabled) return null;

  if (!siteKey) {
    return (
      <p className="text-sm text-red-600" role="alert">
        The security check is temporarily unavailable. Please try again later.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="flex justify-center" aria-label="Security check" />
  );
}
