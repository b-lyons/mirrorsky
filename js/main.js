/**
 * mirrorsky - Personal Website
 * Vanilla JavaScript - No frameworks
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNavigation();
    setupScrollAnimation();
    setupNavCurrent();
    setupAccessibility();
  }

  /**
   * Smooth scroll + ripple for header menu links only
   */
  function setupNavigation() {
    const navLinks = document.querySelectorAll('.site-header a.nav-item[href^="#"]');

    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          createRipple(link, e);
        }
      });
    });
  }

  function createRipple(element, event) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.setAttribute('aria-hidden', 'true');

    element.appendChild(ripple);

    setTimeout(function() {
      ripple.remove();
    }, 600);
  }

  /**
   * Scroll-in reveal (respect reduced motion via html.js-reveal)
   */
  function setupScrollAnimation() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      document.documentElement.classList.add('js-reveal');
    }

    const animatedElements = document.querySelectorAll('.project-card, .about-content');
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(element) {
      observer.observe(element);
    });
  }

  /**
   * Reflect visible section in nav aria-current
   */
  function setupNavCurrent() {
    const sectionIds = ['about', 'projects', 'contact'];
    const sections = sectionIds.map(function(id) {
      return document.getElementById(id);
    }).filter(Boolean);

    const navLinks = document.querySelectorAll('.site-header a.nav-item[data-section]');
    if (!sections.length || !navLinks.length) return;

    const ratios = new Map();
    sections.forEach(function(sec) {
      ratios.set(sec.id, 0);
    });

    function applyAriaCurrent(sectionId) {
      navLinks.forEach(function(link) {
        if (link.getAttribute('data-section') === sectionId) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    function pickFromHash() {
      const hash = (location.hash || '').replace(/^#/, '');
      if (sectionIds.indexOf(hash) !== -1) {
        applyAriaCurrent(hash);
        return;
      }
      applyAriaCurrent('about');
    }

    pickFromHash();
    window.addEventListener('hashchange', pickFromHash);

    const observer = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        });

        let bestId = null;
        let bestRatio = 0.15;
        ratios.forEach(function(ratio, id) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) {
          applyAriaCurrent(bestId);
        }
      },
      {
        root: null,
        rootMargin: '-28% 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    sections.forEach(function(sec) {
      observer.observe(sec);
    });
  }

  function setupAccessibility() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        document.body.style.scrollBehavior = 'auto';
      }
    });

    document.addEventListener('mousedown', function() {
      document.body.style.scrollBehavior = 'smooth';
    });

    const skipLink = document.getElementById('skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', function(e) {
        e.preventDefault();
        const mainContent = document.getElementById('main');
        if (mainContent) {
          try {
            mainContent.focus({ preventScroll: true });
          } catch (err) {
            mainContent.focus();
          }
          mainContent.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, '', '#main');
          document.querySelectorAll('.site-header a.nav-item[data-section]').forEach(function(l) {
            l.removeAttribute('aria-current');
          });
        }
      });
    }
  }
})();
