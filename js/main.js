/**
 * mirrorsky - Personal Website
 * Vanilla JavaScript - No frameworks
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNavigation();
    setupScrollAnimation();
    setupRandomBackground();
    setupAccessibility();
  }

  /**
   * Setup smooth scroll for navigation links
   */
  function setupNavigation() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

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

          // Add ripple effect on click
          createRipple(link, e);
        }
      });
    });
  }

  /**
   * Create ripple effect on click
   */
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
    ripple.textContent = '●';

    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(function() {
      ripple.remove();
    }, 600);
  }

  /**
   * Setup scroll animations for elements
   */
  function setupScrollAnimation() {
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
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(element);
    });
  }

  /**
   * Create subtle random background shifts
   */
  function setupRandomBackground() {
    function shiftBackground() {
      if (document.hidden) return;

      const hue = Math.floor(Math.random() * 40) + 200; // Blue range
      const saturation = 15 + Math.random() * 10;
      const lightness = 8 + Math.random() * 5;

      const body = document.body;
      body.style.background = `linear-gradient(
        180deg,
        hsl(${hue}, ${saturation}%, ${lightness}%) 0%,
        hsl(${hue}, ${saturation + 5}%, ${lightness + 5}%) 50%,
        hsl(${hue}, ${saturation}%, ${lightness}%) 100%
      )`;

      // Throttle to every 3-5 seconds
      setTimeout(shiftBackground, 3000 + Math.random() * 2000);
    }

    // Start the random background effect
    setTimeout(shiftBackground, 5000);
  }

  /**
   * Setup accessibility improvements
   */
  function setupAccessibility() {
    // Improve focus visibility
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        document.body.style.scrollBehavior = 'auto';
      }
    });

    document.addEventListener('mousedown', function() {
      document.body.style.scrollBehavior = 'smooth';
    });

    // Skip link for keyboard navigation
    const skipLink = document.getElementById('skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', function(e) {
        e.preventDefault();
        const mainContent = document.querySelector('main');
        mainContent?.focus();
        mainContent?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

})();

/**
 * CSS Ripple Effect Definitions
 */
.ripple {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(100, 255, 218, 0.6) 0%,
    rgba(100, 255, 218, 0) 70%
  );
  transform: scale(0);
  animation: rippleAnim 0.6s linear;
  pointer-events: none;
}

@keyframes rippleAnim {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Add animation class for scroll-in elements */
.animate-in {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
