(function () {
  "use strict";

  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function initEnhancerDemo() {
    var buttons = document.querySelectorAll("[data-enhancer-trigger]");

    if (!buttons.length) {
      return;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var productId = button.getAttribute("data-product-id");
        var outputTargetId = button.getAttribute("data-output-target");
        var output = outputTargetId
          ? document.getElementById(outputTargetId)
          : null;

        if (output) {
          output.textContent = "Demo mode: AI description generation placeholder triggered.";
        }

        // Future app integration point:
        // 1) POST to your app endpoint with product context (productId, title, etc.)
        // 2) Receive generated AI content
        // 3) Render response in the section UI
        // Example:
        // fetch('/apps/digital-product-enhancer/generate', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ productId: productId })
        // }).then(...)

        if (!productId && output) {
          output.textContent += " No product context was provided in this demo state.";
        }
      });
    });
  }

  function initMobileDropdowns() {
    // On touch/mobile the nav is open via the hamburger; tapping a dropdown
    // trigger should expand the sub-list instead of navigating.
    var triggers = document.querySelectorAll("[data-dropdown-toggle]");
    if (!triggers.length) return;

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        // Only intercept when the mobile nav is actually visible (hamburger open)
        var nav = document.querySelector("[data-mobile-nav]");
        if (!nav || !nav.classList.contains("is-open")) return;

        e.preventDefault();
        var item = trigger.closest(".site-nav__item--has-dropdown");
        if (item) {
          item.classList.toggle("is-open");
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initEnhancerDemo();
    initMobileDropdowns();
  });
})();