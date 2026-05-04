'use client';

import { useEffect } from 'react';

export function MarketingReveal() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.r-page');
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.sr'));

    if (!elements.length) return;

    page?.classList.add('reveal-ready');
    elements.forEach((element) => element.classList.add('in'));

    if (!('IntersectionObserver' in window)) {
      return () => page?.classList.remove('reveal-ready');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.95) {
        element.classList.add('in');
      }
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      page?.classList.remove('reveal-ready');
    };
  }, []);

  return null;
}
