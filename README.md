# Digital Product Enhancer Demo Theme

A portfolio-ready Shopify Online Store 2.0 theme project that demonstrates practical Liquid development, reusable sections/snippets, JSON templates, maintainable CSS/JavaScript, and app-integration readiness.

## Project Overview

This repository contains a custom Shopify theme called **Digital Product Enhancer Demo Theme**. It simulates a polished storefront focused on digital products (templates, downloads, creative tools, and AI-enhanced products).

The theme is intentionally built with Shopify-native architecture so it can be used as proof of Shopify theme skills in interviews and portfolios.

## Tech Stack

- Shopify Online Store 2.0
- Liquid
- JSON templates
- HTML/CSS
- Vanilla JavaScript
- Shopify Theme Editor schemas

## Key Features

- Responsive custom header with logo/title, navigation, and cart count
- Editable hero section with CTA and optional background image
- Featured products section using collection selection
- Reusable `product-card` snippet
- Value proposition section with editable blocks
- Footer section with editable text/menu
- Product-page enhancer demo section showing app integration readiness

## Project Structure

```
assets/
	theme.css
	theme.js
layout/
	theme.liquid
sections/
	footer.liquid
	featured-products.liquid
	header.liquid
	hero.liquid
	main-product.liquid
	product-enhancer-demo.liquid
	value-props.liquid
snippets/
	product-card.liquid
templates/
	index.json
	product.json
```

## Why This Is Portfolio-Ready

- Uses true Shopify theme patterns (not a generic front-end app)
- Shows modular component thinking through sections/snippets
- Demonstrates schema-driven merchant customization
- Includes clear place to integrate a Shopify app endpoint later
- Code is readable, organized, and easy to explain to employers

## Local Development with Shopify CLI

### Prerequisites

1. Install Node.js (LTS recommended)
2. Install Shopify CLI
3. Have access to a Shopify development store

### Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
```

### Authenticate

```bash
shopify login --store your-store-name.myshopify.com
```

### Run Theme Locally

From this repository root:

```bash
shopify theme dev
```

This starts a local preview server with hot reloading and a preview URL.

### Push Changes

Push to your current development theme:

```bash
shopify theme push
```

Push to a specific theme ID:

```bash
shopify theme push --theme <THEME_ID>
```

### Pull Remote Theme Files (optional)

```bash
shopify theme pull
```

## Connecting to Digital Product Enhancer App Later

The section `sections/product-enhancer-demo.liquid` includes a placeholder button and JavaScript hook for future app integration.

Suggested integration path:

1. Add an app endpoint for AI-generated product content
2. Call it from `assets/theme.js` when merchant/customer clicks enhancement button
3. Return generated copy or metadata and render safely in the section UI
4. Persist data via app backend + Shopify Admin API (where appropriate)

This demonstrates understanding of theme + app boundaries:

- Theme: UI and customer interaction layer
- App: secure business logic and external AI/API orchestration

## Interview Summary (Short Version)

"I built a Shopify Online Store 2.0 demo theme focused on digital products using Liquid, JSON templates, reusable sections/snippets, and schema-based customization. I also included a product enhancement section that simulates how my Digital Product Enhancer app would integrate through a theme-side JavaScript action and app endpoint." 

## Resume Bullet Ideas

- Built a modular Shopify Online Store 2.0 theme using Liquid, JSON templates, reusable sections/snippets, and schema-driven merchant settings.
- Implemented responsive storefront UI components (header, hero, product grids, value props, footer) with maintainable CSS and vanilla JavaScript.
- Designed an app-integration-ready product enhancement section to demonstrate theme-extension architecture for AI-assisted product content workflows.

## Extension Ideas

1. Add predictive search and filter/sort controls to collection templates.
2. Integrate customer-specific enhancement history using app proxies or authenticated app endpoints.
3. Add localization and accessibility enhancements (multi-language content, keyboard-first interactions, color contrast audits).
