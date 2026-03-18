# Liquid Rendering Guide for JavaScript/React Developers

This guide explains how Shopify Liquid rendering works, using React/JavaScript mental models you already understand.

## Core Concept: Server-Side Template Rendering vs Client-Side React

### React (What You Know)
```javascript
// React renders in the BROWSER
export function ProductCard({ product }) {
  return (
    <div className="product-card">
      <h3>{product.title}</h3>
      <p>${product.price}</p>
    </div>
  );
}

// Usage: You pass props, React returns JSX that becomes HTML
<ProductCard product={productData} />
```

**Flow:** JavaScript → Browser → HTML renders on client

### Liquid (What This Project Uses)
```liquid
{# Liquid renders on the SHOPIFY SERVER #}
<article class="product-card">
  <h3>{{ product.title }}</h3>
  <p>${{ product.price | money }}</p>
</article>
```

**Flow:** Server (Shopify) → Liquid compiles → HTML sent to browser → Browser displays

**Key difference:** Liquid renders on Shopify's servers BEFORE it reaches the browser. The browser receives fully-rendered HTML, not code.

---

## Project Structure & Rendering Order

### Step 1: Entry Point - The Layout
**File:** `layout/theme.liquid`

This is like your main React layout component. It wraps every page.

```liquid
<!doctype html>
<html>
  <head>
    {{ content_for_header }}
    {{ 'theme.css' | asset_url | stylesheet_tag }}
  </head>
  <body>
    {% section 'header' %}
    
    <main id="MainContent" role="main">
      {{ content_for_layout }}  {# This is like children in React #}
    </main>
    
    {% section 'footer' %}
    
    {{ 'theme.js' | asset_url | script_tag }}
  </body>
</html>
```

**React equivalent:**
```javascript
export function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="stylesheet" href={theme.css} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <script src={theme.js}></script>
      </body>
    </html>
  );
}
```

**What's happening:**
- `content_for_layout` is a placeholder for page-specific content (like React's `{children}`)
- `{% section 'header' %}` includes the header section file
- Every page uses this same layout wrapper

---

### Step 2: Page Templates - JSON Composition
**File:** `templates/index.json` (homepage)

This is like a page component that says "use this layout with these sections in this order."

```json
{
  "sections": {
    "hero": {
      "type": "hero",
      "settings": {
        "title": "Launch better digital products faster",
        "subtitle": "Showcase templates..."
      }
    },
    "featured_products": {
      "type": "featured-products",
      "settings": {
        "collection": "all",
        "products_to_show": 6
      }
    }
  },
  "order": ["hero", "featured_products"]
}
```

**React equivalent:**
```javascript
export function HomePage() {
  return (
    <RootLayout>
      <Hero 
        title="Launch better digital products faster"
        subtitle="Showcase templates..."
      />
      <FeaturedProducts 
        collection="all" 
        productsToShow={6}
      />
    </RootLayout>
  );
}
```

**What's happening:**
- The JSON tells Shopify which sections to include on the homepage
- Each section gets settings (like props in React)
- The order array controls render order
- This fills the `{{ content_for_layout }}` placeholder from the layout

---

### Step 3: Sections - Reusable Components
**File:** `sections/featured-products.liquid`

Sections are like React components. They define UI + settings.

```liquid
<section class="featured-products">
  <div class="container">
    <h2>{{ section.settings.heading }}</h2>

    {% if section.settings.collection != blank and section.settings.collection.products_count > 0 %}
      <div class="product-grid">
        {% for product in section.settings.collection.products limit: section.settings.products_to_show %}
          {% render 'product-card', product: product %}
        {% endfor %}
      </div>
    {% else %}
      <div class="empty-state">
        Select a collection in Theme Editor to display featured products.
      </div>
    {% endif %}
  </div>
</section>

{% schema %}
{
  "name": "Featured products",
  "settings": [
    {
      "type": "collection",
      "id": "collection",
      "label": "Collection"
    },
    {
      "type": "range",
      "id": "products_to_show",
      "label": "Products to show",
      "default": 6
    }
  ]
}
{% endschema %}
```

**React equivalent:**
```javascript
export function FeaturedProducts({ collection, productsToShow }) {
  if (!collection || collection.products.length === 0) {
    return <div className="empty-state">Select a collection...</div>;
  }

  return (
    <section className="featured-products">
      <div className="container">
        <h2>{collection.name}</h2>
        <div className="product-grid">
          {collection.products.slice(0, productsToShow).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Breaking down the Liquid syntax:**
- `{{ section.settings.heading }}` → outputs a variable (like `{heading}` in JSX)
- `{% if condition %}` → conditional rendering (like `{condition &&}` in JSX)
- `{% for product in collection %}` → loop (like `.map()` in JSX)
- `{% else %}` → else clause (like ternary operator)
- `schema` block → defines editable settings in Theme Editor (no React equivalent, but like prop types + Storybook)

---

### Step 4: Snippets - Reusable UI Elements
**File:** `snippets/product-card.liquid`

Snippets are like small, focused React components (e.g., a single card).

```liquid
<article class="product-card">
  <a class="product-card__media" href="{{ product.url }}">
    {% if product.featured_image %}
      {{ product.featured_image | image_url: width: 720 | image_tag: alt: product.title }}
    {% else %}
      {{ 'product-1' | placeholder_svg_tag: 'placeholder-svg' }}
    {% endif %}
  </a>

  <div class="product-card__body">
    <h3 class="product-card__title">
      <a href="{{ product.url }}">{{ product.title }}</a>
    </h3>
    <div class="product-card__price">{{ product.price | money }}</div>
    <a class="btn" href="{{ product.url }}">View Product</a>
  </div>
</article>
```

**React equivalent:**
```javascript
export function ProductCard({ product }) {
  return (
    <article className="product-card">
      <a href={product.url} className="product-card__media">
        {product.featured_image ? (
          <img src={product.featured_image} alt={product.title} />
        ) : (
          <svg>placeholder</svg>
        )}
      </a>
      <div className="product-card__body">
        <h3><a href={product.url}>{product.title}</a></h3>
        <div className="product-card__price">{formatMoney(product.price)}</div>
        <a href={product.url} className="btn">View Product</a>
      </div>
    </article>
  );
}
```

**Key difference:**
- Snippets receive data via `{% render 'product-card', product: product %}`
- This is like calling `<ProductCard product={product} />`
- No schema block (snippets aren't editable in Theme Editor)

---

## Complete Render Flow (Step by Step)

Here's how a homepage actually renders, step by step:

### 1. Request hits Shopify
```
Browser → GET /  →  Shopify Server
```

### 2. Shopify loads the template
```
Shopify reads: templates/index.json
Shopify says: "Load the layout, then load these sections in order"
```

### 3. Shopify compiles the layout
```liquid
{# layout/theme.liquid starts rendering #}
<!doctype html>
<html>
  {# CSS loads #}
  <body>
    {% section 'header' %}  {# Liquid renders header.liquid HERE #}
    
    {# Now Liquid renders the page sections from index.json #}
    {{ content_for_layout }}  
    
    {% section 'footer' %}  {# Liquid renders footer.liquid HERE #}
  </body>
</html>
```

### 4. Shopify renders each section
```liquid
{# For featured-products section in index.json #}
{% if section.settings.collection != blank %}
  {# Loop through products and render product-card snippet for each #}
  {% for product in collection.products %}
    {% render 'product-card', product: product %}
  {% endfor %}
{% endif %}
```

### 5. Shopify renders each snippet
```liquid
{# product-card.liquid renders for each product #}
<article class="product-card">
  <h3>{{ product.title }}</h3>  {# Output the product name #}
  <p>{{ product.price | money }}</p>  {# Output the price #}
</article>
```

### 6. HTML is complete and sent to browser
```
Layout HTML
  ├─ Header HTML
  ├─ Section: Hero HTML
  ├─ Section: Featured Products HTML
  │  ├─ Product Card 1 HTML
  │  ├─ Product Card 2 HTML
  │  └─ Product Card 3 HTML
  ├─ Section: Value Props HTML
  └─ Footer HTML

{All as ONE complete HTML string}
```

### 7. Browser receives & displays
```
Browser receives fully-rendered HTML
Browser parses HTML
Browser loads CSS from <link>
Browser loads JavaScript from <script>
Browser renders to screen ✓
```

---

## Key Liquid Syntax (for React Developers)

| Liquid | React | Use |
|--------|-------|-----|
| `{{ variable }}` | `{variable}` | Output/interpolation |
| `{% if condition %}` | `{condition &&}` or ternary | Conditional |
| `{% for item in array %}` | `.map()` or `for` loop | Looping |
| `{% render 'snippet' %}` | `<Component />` | Include/call component |
| `{{ variable \| filter }}` | Custom function | Transform data |
| `section.settings` | Props | Settings/configuration |
| `product.featured_image` | Props | Shopify object properties |

---

## Filters (Shopify's Data Transformers)

In Liquid, filters transform data. Think of them like utility functions.

```liquid
{{ product.price | money }}
{# Transforms: 9999 → $99.99 #}

{{ product.featured_image | image_url: width: 720 }}
{# Transforms: image object → resized URL #}

{{ 'now' | date: '%Y' }}
{# Transforms: current time → year (2026) #}
```

**React equivalent:**
```javascript
formatMoney(product.price)
resizeImageUrl(product.featured_image, { width: 720 })
new Date().getFullYear()
```

---

## Global Objects (Shopify Gives You These)

Liquid has access to global objects that React doesn't (because React runs in the browser):

```liquid
{{ shop.name }}              {# Store name from Shopify Admin #}
{{ product }}               {# Current product (on product page) #}
{{ collection }}            {# Current collection (on collection page) #}
{{ cart }}                  {# Shopping cart contents #}
{{ request.locale.iso_code }} {# Visitor's language #}
```

These come from **Shopify's database**, not from your code. They're pre-loaded on every page.

---

## Where Interactivity Happens

Liquid renders **static HTML** on the server. Interactivity happens via JavaScript.

### Example: Mobile Navigation Toggle

**Liquid (renders static HTML):**
```liquid
<button type="button" data-nav-toggle>Menu</button>
<nav class="site-nav" data-mobile-nav>
  <ul class="site-nav__list">
    <!-- menu items -->
  </ul>
</nav>
```

**JavaScript (makes it interactive):**
```javascript
// assets/theme.js
function initMobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");

  toggle.addEventListener("click", function () {
    nav.classList.toggle("is-open");
  });
}

document.addEventListener("DOMContentLoaded", initMobileNav);
```

**React equivalent:**
```javascript
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
      <nav className={isOpen ? "is-open" : ""}>
        {/* menu items */}
      </nav>
    </>
  );
}
```

**Key difference:** Liquid creates the HTML structure (on server), then vanilla JavaScript adds the event listeners and interactivity (in browser).

---

## App Integration Flow (Your Digital Product Enhancer)

This is where your app connects:

### Current State (Theme Only)
```
Browser requests page
  ↓
Shopify renders Liquid → HTML
  ↓
Browser receives HTML
  ↓
JavaScript runs (theme.js)
```

### Future State (Theme + App)
```
Browser requests page
  ↓
Shopify renders Liquid → HTML (includes a button with data-enhancer-trigger)
  ↓
Browser receives HTML & loads JavaScript
  ↓
JavaScript runs (theme.js)
  ↓
User clicks "Enhance Product" button
  ↓
JavaScript sends request to YOUR APP: /apps/digital-product-enhancer/generate
  ↓
Your app backend processes request + calls AI API
  ↓
Your app returns generated description JSON
  ↓
JavaScript updates the page (DOM manipulation)
```

**In the section file** (`sections/product-enhancer-demo.liquid`):
```liquid
<button
  data-enhancer-trigger
  data-product-id="{{ product.id }}"
>
  Generate AI Description
</button>
```

**In the JavaScript** (`assets/theme.js`):
```javascript
button.addEventListener("click", function () {
  const productId = button.getAttribute("data-product-id");
  
  fetch("/apps/digital-product-enhancer/generate", {
    method: "POST",
    body: JSON.stringify({ productId })
  })
  .then(res => res.json())
  .then(data => {
    // Update page with returned data
    document.getElementById("output").textContent = data.description;
  });
});
```

---

## Mental Model Summary

| Concept | React | Liquid |
|---------|-------|--------|
| **Rendering** | Client-side (browser) | Server-side (Shopify) |
| **When it renders** | When you mount/update component | When visitor requests page |
| **What you get** | Interactive app in browser | Static HTML to browser |
| **Data source** | Props, state, API calls | Shopify objects, settings |
| **Reusable UI** | Components (JSX) | Sections + Snippets (Liquid) |
| **Styling** | CSS-in-JS or import CSS | Import CSS in layout |
| **Interactivity** | React state/events | JavaScript + DOM events |
| **Data transformation** | JavaScript functions | Liquid filters |

---

## Your Project's Rendering Architecture

### Homepage Render Path
```
1. Browser requests GET /
2. Shopify loads templates/index.json
3. Shopify renders layout/theme.liquid
4. Liquid includes sections/header.liquid → HTML
5. Liquid renders sections/hero.liquid → HTML (with settings from index.json)
6. Liquid renders sections/featured-products.liquid → HTML
   └─ For each product, renders snippets/product-card.liquid → HTML
7. Liquid renders sections/value-props.liquid → HTML
8. Liquid renders sections/footer.liquid → HTML
9. Shopify combines all HTML + assets/theme.css + assets/theme.js
10. Browser receives one complete HTML file
11. Browser renders HTML
12. Browser loads CSS (page looks styled)
13. Browser runs theme.js (page becomes interactive)
```

### Product Page Render Path
```
1. Browser requests GET /products/my-product
2. Shopify loads templates/product.json
3. Shopify renders layout/theme.liquid
4. Liquid includes sections/header.liquid → HTML
5. Liquid renders sections/main-product.liquid → HTML
   └─ Shopify provides the global 'product' object
   └─ Liquid outputs product title, price, image, etc.
6. Liquid renders sections/product-enhancer-demo.liquid → HTML
   └─ Shows "Enhance This Product" button
7. Liquid renders sections/footer.liquid → HTML
8. Browser receives complete product page HTML
9. Browser renders + JavaScript attaches click handler to button
10. User clicks "Generate AI Description"
11. JavaScript sends POST to your app
12. Your app returns generated text
13. JavaScript updates page with result
```

---

## Common Gotchas for React Developers

### 1. No State or Re-renders
```liquid
{# This does NOT work like React state #}
{% assign count = 0 %}
{% for item in items %}
  {% assign count = count | plus: 1 %}
{% endfor %}
{# count = length of items #}
{# But this ONLY happens once, when the page renders #}
{# No re-render on user interaction #}
```

### 2. Liquid Renders Once (on Server)
```liquid
{# This button looks the same every time #}
<button>Click me</button>

{# The button doesn't change in Liquid #}
{# Only JavaScript can make it change after page load #}
```

### 3. You Can't Call Functions from Theme Editor
```javascript
// ❌ This won't work
function myCustomFilter(value) {
  return value.toUpperCase();
}
```

```liquid
{# ❌ You can't use custom JS functions in Liquid #}
{{ product.title | myCustomFilter }}
```

Instead, use Liquid filters (built-in) or JavaScript (after render).

### 4. Liquid Objects Are Fixed
```liquid
{# These objects are provided by Shopify #}
{{ product }}
{{ shop }}
{{ cart }}

{# You cannot create custom objects like you would in JavaScript #}
{# You can only use what Shopify gives you #}
```

---

## Next Steps: Extending This Project

To deepen your understanding, try:

1. **Add a new section**
   - Create `sections/testimonials.liquid`
   - Add testimonial blocks to schema
   - Reference it in `templates/index.json`

2. **Add a custom filter**
   - Create a function in `assets/theme.js`
   - Demonstrate data transformation on page load

3. **Wire up the app integration**
   - Implement the backend endpoint
   - Complete the `fetch()` call in `fetchEnhancerData()`
   - See the full theme + app flow in action

4. **Debug with browser DevTools**
   - Open DevTools (F12)
   - See the rendered HTML (all from Liquid)
   - Watch theme.js run and add event listeners
   - See your app API requests in Network tab

---

## Resources

- [Shopify Liquid Docs](https://shopify.dev/api/liquid)
- [Shopify Theme Architecture](https://shopify.dev/themes/architecture)
- [Liquid by Example](https://www.shopifyblog.com/liquid-template-language)

Good luck with the theme! Feel free to ask questions—I know this mental shift from React can be tricky.
