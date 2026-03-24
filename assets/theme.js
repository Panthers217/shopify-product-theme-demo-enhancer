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

  function initGSAP() {
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Scroll-triggered fade-in for any element with [data-animate]
    gsap.utils.toArray('[data-animate]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out'
      });
    });
  }

  function initSearch() {
    var widget = document.querySelector('[data-search-widget]');
    if (!widget) return;
    if (widget.dataset.searchInit) return;
    widget.dataset.searchInit = '1';

    var toggle = widget.querySelector('[data-search-toggle]');
    var form = widget.querySelector('[data-search-form]');
    var input = widget.querySelector('[data-search-input]');
    var resultsPanel = widget.querySelector('[data-search-results]');
    var closeBtn = widget.querySelector('[data-search-close]');
    var moneyFormat = widget.getAttribute('data-money-format') || '${{amount}}';

    var debounceTimer = null;
    var currentXhr = null;
    var currentQuery = '';

    function formatResultPrice(price) {
      if (price === null || price === undefined || price === '') return '';
      var str = String(price).trim();
      // If the value already contains a non-numeric character (e.g. "$"), return as-is
      if (/[^0-9.,]/.test(str)) return str;
      var num = parseFloat(str);
      if (isNaN(num)) return str;
      return moneyFormat
        .replace(/\{\{\s*amount\s*\}\}/g, num.toFixed(2))
        .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, String(Math.round(num)));
    }

    function openSearch() {
      form.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closeSearch() {
      form.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      resultsPanel.hidden = true;
      resultsPanel.innerHTML = '';
      input.value = '';
      currentQuery = '';
      if (currentXhr) {
        currentXhr.abort();
        currentXhr = null;
      }
    }

    toggle.addEventListener('click', function () {
      if (form.hidden) {
        openSearch();
      } else {
        closeSearch();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeSearch);
    }

    document.addEventListener('click', function (e) {
      if (!widget.contains(e.target)) {
        closeSearch();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !form.hidden) {
        closeSearch();
        toggle.focus();
      }
    });

    function renderLoading() {
      resultsPanel.innerHTML = '';
      var msg = document.createElement('p');
      msg.className = 'header-search__loading';
      msg.textContent = 'Searching…';
      resultsPanel.appendChild(msg);
      resultsPanel.hidden = false;
    }

    function renderEmpty(query) {
      resultsPanel.innerHTML = '';
      var msg = document.createElement('p');
      msg.className = 'header-search__empty';
      msg.textContent = 'No products found for "' + query + '"';
      resultsPanel.appendChild(msg);
      resultsPanel.hidden = false;
    }

    function renderResults(products, query) {
      resultsPanel.innerHTML = '';

      if (!products.length) {
        renderEmpty(query);
        return;
      }

      var list = document.createElement('ul');
      list.className = 'header-search__list';
      list.setAttribute('role', 'listbox');

      products.forEach(function (product) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');

        var a = document.createElement('a');
        a.className = 'header-search__result';
        a.href = product.url || '/products/' + (product.handle || '');

        // Image – predictive search uses featured_image or image
        var imageObj = product.featured_image || product.image || null;
        var imgSrc = imageObj
          ? (typeof imageObj === 'string' ? imageObj : (imageObj.url || imageObj.src || ''))
          : '';

        if (imgSrc) {
          var img = document.createElement('img');
          img.className = 'header-search__result-img';
          img.src = imgSrc;
          img.alt = product.title || '';
          img.width = 56;
          img.height = 56;
          img.loading = 'lazy';
          a.appendChild(img);
        } else {
          var placeholder = document.createElement('div');
          placeholder.className = 'header-search__result-img header-search__result-img--placeholder';
          a.appendChild(placeholder);
        }

        // Body
        var body = document.createElement('div');
        body.className = 'header-search__result-body';

        var titleEl = document.createElement('p');
        titleEl.className = 'header-search__result-title';
        titleEl.textContent = product.title || '';
        body.appendChild(titleEl);

        var rawPrice = product.price_min !== undefined ? product.price_min : product.price;
        if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
          var priceEl = document.createElement('span');
          priceEl.className = 'header-search__result-price';
          priceEl.textContent = formatResultPrice(rawPrice);
          body.appendChild(priceEl);
        }

        a.appendChild(body);
        li.appendChild(a);
        list.appendChild(li);
      });

      resultsPanel.appendChild(list);

      // "View all results" link
      var allLink = document.createElement('a');
      allLink.className = 'header-search__all-results';
      allLink.href = '/search?q=' + encodeURIComponent(query) + '&type=product';
      allLink.textContent = 'View all results for "' + query + '"';
      resultsPanel.appendChild(allLink);

      resultsPanel.hidden = false;
    }

    function fetchSuggestions(query) {
      if (currentXhr) {
        currentXhr.abort();
        currentXhr = null;
      }

      if (!query || query.length < 2) {
        resultsPanel.hidden = true;
        resultsPanel.innerHTML = '';
        return;
      }

      renderLoading();

      var xhr = new XMLHttpRequest();
      var url =
        '/search/suggest.json?q=' +
        encodeURIComponent(query) +
        '&resources[type]=product&resources[limit]=6';

      xhr.open('GET', url);
      xhr.onload = function () {
        if (xhr.status !== 200) {
          renderEmpty(query);
          return;
        }
        try {
          var data = JSON.parse(xhr.responseText);
          var products =
            data.resources &&
            data.resources.results &&
            Array.isArray(data.resources.results.products)
              ? data.resources.results.products
              : [];
          renderResults(products, query);
        } catch (_e) {
          renderEmpty(query);
        }
      };
      xhr.onerror = function () {
        renderEmpty(query);
      };
      xhr.send();
      currentXhr = xhr;
    }

    input.addEventListener('input', function () {
      var query = input.value.trim();
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (query !== currentQuery) {
          currentQuery = query;
          fetchSuggestions(query);
        }
      }, 300);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var firstLink = resultsPanel.querySelector('.header-search__result');
      if (firstLink) {
        window.location.href = firstLink.getAttribute('href');
      } else {
        var q = input.value.trim();
        if (q) {
          window.location.href = '/search?q=' + encodeURIComponent(q) + '&type=product';
        }
      }
    });
  }

  function initCollectionFiltersAndSort() {
    var filtersRoot = document.querySelector('.collection-filters');
    var productsGrid = document.querySelector('[data-products-grid]');

    if (!filtersRoot || !productsGrid) {
      return;
    }

    var cards = Array.prototype.slice.call(productsGrid.querySelectorAll('.product-card'));
    if (!cards.length) {
      return;
    }

    var filterInputs = Array.prototype.slice.call(
      filtersRoot.querySelectorAll('input[type="checkbox"][data-filter-attr][data-filter-value]')
    );
    var applyButton = filtersRoot.querySelector('[data-apply-filters]');
    var clearButton = filtersRoot.querySelector('[data-clear-filters]');
    var sortSelect = filtersRoot.querySelector('[data-sort-by]');
    var productsCount = document.querySelector('.products-count');

    cards.forEach(function (card, index) {
      if (!card.dataset.index) {
        card.dataset.index = String(index);
      }
    });

    function normalizeValue(value) {
      return String(value || '').toLowerCase().trim();
    }

    function normalizeAvailabilityValue(value) {
      var normalized = normalizeValue(value);
      if (normalized === '1' || normalized === 'true' || normalized === 'available' || normalized === 'in stock') {
        return 'true';
      }
      return 'false';
    }

    function readSelectedFilters() {
      return filterInputs.reduce(function (acc, input) {
        if (!input.checked) {
          return acc;
        }

        var attr = input.getAttribute('data-filter-attr');
        if (!attr) {
          return acc;
        }

        if (!acc[attr]) {
          acc[attr] = [];
        }

        var value = input.getAttribute('data-filter-value');
        if (attr === 'available') {
          acc[attr].push(normalizeAvailabilityValue(value));
        } else {
          acc[attr].push(normalizeValue(value));
        }

        return acc;
      }, {});
    }

    function cardMatchesFilters(card, selectedFilters) {
      var attrs = Object.keys(selectedFilters);

      if (!attrs.length) {
        return true;
      }

      return attrs.every(function (attr) {
        var selectedValues = selectedFilters[attr];
        var cardValue;

        if (attr === 'available') {
          cardValue = normalizeAvailabilityValue(card.dataset.available);
        } else {
          cardValue = normalizeValue(card.dataset[attr]);
        }

        return selectedValues.indexOf(cardValue) !== -1;
      });
    }

    function sortCards(sortValue) {
      var sorted = cards.slice();

      sorted.sort(function (a, b) {
        var aPrice = Number(a.dataset.price || 0);
        var bPrice = Number(b.dataset.price || 0);
        var aTitle = normalizeValue(a.dataset.title);
        var bTitle = normalizeValue(b.dataset.title);
        var aCreated = Date.parse(a.dataset.created || '') || 0;
        var bCreated = Date.parse(b.dataset.created || '') || 0;
        var aIndex = Number(a.dataset.index || 0);
        var bIndex = Number(b.dataset.index || 0);

        switch (sortValue) {
          case 'title-ascending':
            return aTitle.localeCompare(bTitle);
          case 'title-descending':
            return bTitle.localeCompare(aTitle);
          case 'price-ascending':
            return aPrice - bPrice;
          case 'price-descending':
            return bPrice - aPrice;
          case 'created-descending':
            return bCreated - aCreated;
          case 'best-selling':
          case '':
          default:
            return aIndex - bIndex;
        }
      });

      sorted.forEach(function (card) {
        productsGrid.appendChild(card);
      });
    }

    function updateVisibleCount(visibleCount) {
      if (!productsCount) {
        return;
      }

      if (visibleCount === cards.length) {
        productsCount.textContent = 'Showing ' + String(cards.length) + ' products';
        return;
      }

      productsCount.textContent =
        'Showing ' + String(visibleCount) + ' of ' + String(cards.length) + ' products';
    }

    function applyFiltersAndSort() {
      var selectedFilters = readSelectedFilters();
      var visibleCount = 0;

      cards.forEach(function (card) {
        var matches = cardMatchesFilters(card, selectedFilters);
        card.hidden = !matches;
        if (matches) {
          visibleCount += 1;
        }
      });

      var sortValue = sortSelect ? sortSelect.value : '';
      sortCards(sortValue);
      updateVisibleCount(visibleCount);
    }

    if (applyButton) {
      applyButton.addEventListener('click', applyFiltersAndSort);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', applyFiltersAndSort);
    }

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        filterInputs.forEach(function (input) {
          input.checked = false;
        });

        if (sortSelect) {
          sortSelect.value = '';
        }

        applyFiltersAndSort();
      });
    }

    applyFiltersAndSort();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initEnhancerDemo();
    initMobileDropdowns();
    initGSAP();
    initSearch();
    initCollectionFiltersAndSort();
  });
})();