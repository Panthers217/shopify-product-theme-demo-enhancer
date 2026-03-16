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

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initEnhancerDemo();
  });
})();