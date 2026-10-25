(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const categories = document.getElementById('st-deal-categories');
  const sort = document.getElementById('st-deal-sort');
  const grid = document.getElementById('st-deals-grid');
  const count = document.getElementById('st-deal-count');
  const countdown = document.getElementById('st-countdown');
  const SORTS = ['discount', 'price-asc', 'price-desc', 'name-asc'];
  let selected = [], sortValue = 'discount', timer;

  function readUrl() {
    const query = S.parseQuery(); selected = query.category;
    sortValue = SORTS.includes(query.sort) ? query.sort : 'discount';
  }
  function writeUrl() {
    const params = new URLSearchParams(); selected.forEach((name) => params.append('category', name));
    if (sortValue !== 'discount') params.set('sort', sortValue);
    const search = params.toString();
    try { window.history.pushState(null, '', window.location.pathname + (search ? '?' + search : '')); }
    catch (error) { UI.toast('This browser blocked local-file URL updates. Try Chrome or Edge to share deals.'); }
  }

  function render() {
    const products = S.getProducts(), deals = S.getDeals(products);
    const names = Array.from(new Set(S.getCategories(deals).map((item) => item.name).concat(selected)));
    const chip = (name, active, label) => '<button class="st-button ' + (active ? 'st-button-primary' : 'st-button-outline') + '" type="button" data-st-deal-category="' + e(name) + '" aria-pressed="' + active + '">' + e(label || name) + '</button>';
    categories.innerHTML = chip('', !selected.length, 'All deals') + names.map((name) => chip(name, selected.includes(name))).join('');
    sort.value = sortValue;
    const result = S.filterProducts(deals, { category: selected, sort: sortValue, pageSize: 1000 });
    count.textContent = result.total + ' deals';
    if (!products.length) UI.emptyCatalog(grid);
    else if (!result.total) grid.innerHTML = '<div class="st-empty"><h2>No deals available right now</h2><p>Check back soon for new offers.</p><a class="st-button st-button-primary" href="category.html">Explore all products</a></div>';
    else UI.renderCards(grid, result.products);
  }

  /** Recompute tomorrow each tick so the simulated countdown rolls over at midnight. */
  function tick() {
    const now = new Date(), midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const seconds = Math.max(0, Math.floor((midnight - now) / 1000));
    const pad = (value) => String(value).padStart(2, '0');
    countdown.textContent = pad(Math.floor(seconds / 3600)) + 'h ' + pad(Math.floor(seconds / 60) % 60) + 'm ' + pad(seconds % 60) + 's';
  }
  categories.addEventListener('click', (event) => {
    const button = event.target.closest('[data-st-deal-category]');
    if (!button) return;
    const name = button.dataset.stDealCategory;
    selected = name ? [name] : []; render(); writeUrl();
    const replacement = Array.from(categories.querySelectorAll('button')).find((item) => item.dataset.stDealCategory === name);
    if (replacement) replacement.focus();
  });
  sort.addEventListener('change', () => { sortValue = sort.value; render(); writeUrl(); });
  window.addEventListener('popstate', () => { readUrl(); render(); });
  window.addEventListener('voltix:store-refresh', render);
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', () => { clearInterval(timer); tick(); timer = setInterval(tick, 1000); });
  readUrl(); render(); tick();
})(window, document);
