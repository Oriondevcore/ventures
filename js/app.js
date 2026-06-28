/* ═══════════════════════════════════════════
   ORION DESIGN SYSTEM — Scroll Reveal
   IntersectionObserver for reveal animations
   ═══════════════════════════════════════════ */

(function() {
  'use strict';

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });

  // Auto-apply reveal to common elements
  document.addEventListener('DOMContentLoaded', () => {
    const autoReveal = [
      '.card',
      '.feature-card',
      '.pricing-card',
      '.service-card',
      '.section-header',
      '.naledi-grid > *'
    ];

    autoReveal.forEach(selector => {
      document.querySelectorAll(selector).forEach((el, i) => {
        if (!el.classList.contains('reveal')) {
          el.classList.add('reveal');
          el.style.transitionDelay = `${i * 100}ms`;
          observer.observe(el);
        }
      });
    });
  });
})();
