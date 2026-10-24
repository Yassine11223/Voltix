(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const host = document.getElementById('st-product');
  const id = new URLSearchParams(window.location.search).get('id');
  let quantity = 1, activeTab = 'description';

  function getProduct() { return S.getProducts().find((product) => product.id === id); }
  function clamp(value, product) {
    const number = Number(value), wanted = Number.isFinite(number) ? Math.max(1, Math.floor(number)) : 1;
    if (wanted > product.stock && product.stock) UI.toast('Only ' + product.stock + ' in stock');
    return Math.max(1, Math.min(wanted, product.stock));
  }
  function render() {
    const product = getProduct();
    if (!product) {
      host.innerHTML = '<section class="st-empty"><h1>Product not found</h1><p>This product is no longer available. Explore the rest of our store.</p><a class="st-button st-button-primary" href="category.html">Browse products</a></section>';
      document.title = 'Product not found | Voltix'; return;
    }
    quantity = clamp(quantity, product);
    const deal = S.getDeal(product), disabled = product.stock ? '' : ' disabled';
    document.title = product.name + ' | Voltix';
    host.innerHTML = '<nav class="st-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="' + e(UI.categoryLink(product.category)) + '">' + e(product.category) + '</a> / <span aria-current="page">' + e(product.name) + '</span></nav>' +
      '<section class="st-product-detail" aria-labelledby="st-product-title"><div><div class="st-product-visual st-detail-visual" id="st-main-image">' + (product.image ? '<img class="st-product-image" src="' + e(product.image) + '" alt="' + e(product.name) + '">' : '<span class="st-sr-only">Product image placeholder</span>') + '</div>' +
      '<div class="st-thumbnails" aria-label="Product image previews">' + [1, 2, 3].map((n) => '<button class="st-thumbnail" type="button" data-st-thumbnail="' + n + '" aria-label="View placeholder ' + n + ' for ' + e(product.name) + '" aria-pressed="' + (n === 1) + '"></button>').join('') + '</div></div>' +
      '<div class="st-detail-info"><p class="st-eyebrow">' + e(product.category) + ' · ' + e(product.brand) + '</p><h1 id="st-product-title">' + e(product.name) + '</h1><p class="st-muted">SKU ' + e(product.sku) + '</p>' +
      '<div class="st-detail-price"><strong>' + e(S.money(S.dealPrice(product))) + '</strong>' + (deal ? '<del>' + e(S.money(product.price)) + '</del>' : '') + '</div><div>' + UI.stockBadge(product, true) + '</div>' +
      '<div class="st-purchase"><div class="st-add-row"><div class="st-stepper"><button type="button" data-st-quantity="-1" aria-label="Decrease quantity"' + disabled + '>−</button><label class="st-sr-only" for="st-product-quantity">Quantity</label><input id="st-product-quantity" type="number" inputmode="numeric" min="1" max="' + product.stock + '" value="' + quantity + '"' + disabled + '><button type="button" data-st-quantity="1" aria-label="Increase quantity"' + disabled + '>+</button></div><button class="st-button st-button-primary" type="button" data-st-product-add' + disabled + '>' + (product.stock ? 'Add to cart' : 'Out of stock') + '</button></div><button class="st-button st-button-outline st-wide" type="button" data-st-buy' + disabled + '>Buy now</button></div>' +
      '<p class="st-panel st-delivery-note">Demo only: pickup, delivery and returns are simulated in Phase 1.</p></div></section>' +
      '<section class="st-panel st-product-tabs"><div class="st-tabbar" role="tablist" aria-label="Product information"><button id="st-description-tab" type="button" role="tab" aria-controls="st-description" data-st-tab="description">Description</button><button id="st-specifications-tab" type="button" role="tab" aria-controls="st-specifications" data-st-tab="specifications">Specifications</button></div>' +
      '<div id="st-description" class="st-tab-panel" role="tabpanel" aria-labelledby="st-description-tab"><p>' + e(product.description || 'Discover ' + product.name + '. Browse the specifications for product details and current availability.') + '</p></div>' +
      '<div id="st-specifications" class="st-tab-panel" role="tabpanel" aria-labelledby="st-specifications-tab"><dl class="st-specifications"><dt>Category</dt><dd>' + e(product.category) + '</dd><dt>Brand</dt><dd>' + e(product.brand) + '</dd><dt>SKU</dt><dd>' + e(product.sku) + '</dd><dt>Availability</dt><dd>' + (product.stock ? product.stock + ' in stock' : 'Out of stock') + '</dd></dl></div></section>' +
      '<section class="st-section" aria-labelledby="st-related-heading"><div class="st-section-heading"><h2 id="st-related-heading">Related products</h2></div><div id="st-related" class="st-product-grid"></div></section>';
    const related = S.getProducts().filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    const grid = document.getElementById('st-related');
    if (related.length) UI.renderCards(grid, related);
    else grid.innerHTML = '<p class="st-muted">More products in this category are on the way. <a href="category.html">Browse all products</a>.</p>';
    selectTab(activeTab);
  }

  function selectTab(name) {
    activeTab = name;
    host.querySelectorAll('[data-st-tab]').forEach((tab) => {
      const selected = tab.dataset.stTab === name;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  host.addEventListener('change', (event) => {
    if (event.target.id !== 'st-product-quantity') return;
    const product = getProduct(); if (!product) { render(); return; }
    quantity = clamp(event.target.value, product); event.target.value = quantity;
  });
  host.addEventListener('click', (event) => {
    const step = event.target.closest('[data-st-quantity]');
    if (step && !step.disabled) {
      const product = getProduct(); if (!product) { render(); return; }
      quantity = clamp(quantity + Number(step.dataset.stQuantity), product);
      document.getElementById('st-product-quantity').value = quantity;
    }
    const tab = event.target.closest('[data-st-tab]');
    if (tab) selectTab(tab.dataset.stTab);
    const thumb = event.target.closest('[data-st-thumbnail]');
    if (thumb) {
      host.querySelectorAll('[data-st-thumbnail]').forEach((node) => node.setAttribute('aria-pressed', String(node === thumb)));
      document.getElementById('st-main-image').style.background = ['linear-gradient(140deg, #0b1833, #1d4097)', 'linear-gradient(110deg, #102a63, #2456e8)', 'linear-gradient(170deg, #0b1833, #1d4097)'][Number(thumb.dataset.stThumbnail) - 1];
      UI.toast('Demo only: product image preview ' + thumb.dataset.stThumbnail);
    }
    const add = event.target.closest('[data-st-product-add], [data-st-buy]');
    if (add && !add.disabled) {
      const result = S.addToCart(id, quantity); UI.toast(result.message);
      if (result.ok && add.hasAttribute('data-st-buy')) window.location.assign(S.checkoutLink());
      else if (!result.ok) render();
    }
  });
  host.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-st-tab]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const name = event.key === 'Home' ? 'description' : event.key === 'End' ? 'specifications' : activeTab === 'description' ? 'specifications' : 'description';
    selectTab(name); document.getElementById('st-' + name + '-tab').focus();
  });
  window.addEventListener('voltix:store-refresh', render);
  render();
})(window, document);
