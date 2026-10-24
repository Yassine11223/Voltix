(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const ids = ['st-category-breadcrumb', 'st-category-title', 'st-result-count', 'st-sort', 'st-open-filters', 'st-filter-sidebar', 'st-filter-form', 'st-category-options', 'st-brand-options', 'st-price-min-range', 'st-price-max-range', 'st-price-min', 'st-price-max', 'st-instock', 'st-filter-chips', 'st-category-grid', 'st-pagination', 'st-filter-dialog', 'st-close-filters', 'st-filter-drawer-body', 'st-reset-filters', 'st-show-results'];
  const nodes = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const node = (id) => nodes['st-' + id];
  const form = node('filter-form'), media = window.matchMedia('(max-width: 899px)');
  let query = S.parseQuery(), products = [], priceCeiling = 1, historyAvailable = true;
  if (query.sort === 'discount') query.sort = 'featured';
  const drawer = UI.dialogHelper(node('filter-dialog'), () => node('filter-sidebar').appendChild(form));

  /** Facets exclude their own selection so additional choices remain discoverable. */
  function renderOptions(field, host, groups, facetProducts) {
    const live = new Map((field === 'category' ? S.getCategories(facetProducts) : S.getBrands(facetProducts)).map((item) => [item.name, item.count]));
    const names = Array.from(new Set(groups.map((item) => item.name).concat(query[field])));
    const markup = names.map((name, index) => {
      const id = 'st-option-' + field + '-' + index;
      return '<label class="st-check" for="' + id + '"><input id="' + id + '" type="checkbox" name="' + field + '" value="' + e(name) + '"' + (query[field].includes(name) ? ' checked' : '') + '><span>' + e(name) + '</span><small>' + (live.get(name) || 0) + '</small></label>';
    }).join('');
    // Keep the focused checkbox mounted during live updates.
    if (host.dataset.options === JSON.stringify(names)) {
      host.querySelectorAll('input').forEach((input) => {
        input.checked = query[field].includes(input.value);
        input.closest('label').querySelector('small').textContent = live.get(input.value) || 0;
      });
    } else { host.innerHTML = markup; host.dataset.options = JSON.stringify(names); }
  }
  function allMatching(value) { return S.filterProducts(products, { ...value, page: 1, pageSize: Math.max(products.length, 1) }).products; }

  function renderChips() {
    const chips = [];
    ['category', 'brand'].forEach((key) => query[key].forEach((value) => chips.push({ key, value, label: value })));
    if (query.instock) chips.push({ key: 'instock', label: 'In stock' });
    if (query.min !== null) chips.push({ key: 'min', label: 'From ' + S.money(query.min) });
    if (query.max !== null) chips.push({ key: 'max', label: 'Up to ' + S.money(query.max) });
    if (query.q) chips.push({ key: 'q', label: 'Search: ' + query.q });
    node('filter-chips').innerHTML = chips.map((chip) => '<button class="st-chip" type="button" data-st-remove="' + chip.key + '" data-st-value="' + e(chip.value || '') + '" aria-label="Remove ' + e(chip.label) + ' filter">' + e(chip.label) + '<span aria-hidden="true"> ×</span></button>').join('');
  }
  function renderPagination(result) {
    if (!result.total || result.totalPages < 2) { node('pagination').replaceChildren(); return; }
    const button = (label, page, disabled, current) => '<button class="st-button ' + (current ? 'st-button-primary' : 'st-button-outline') + '" type="button" data-st-page="' + page + '"' + (disabled ? ' disabled' : '') + (current ? ' aria-current="page"' : '') + ' aria-label="' + (typeof label === 'number' ? 'Page ' + label : label + ' page') + '">' + label + '</button>';
    let html = button('Prev', result.page - 1, result.page === 1);
    const pages = new Set([1, result.totalPages, result.page - 1, result.page, result.page + 1]);
    let previous = 0;
    Array.from(pages).filter((page) => page >= 1 && page <= result.totalPages).sort((a, b) => a - b).forEach((page) => {
      if (previous && page > previous + 1) html += '<span aria-hidden="true">…</span>';
      html += button(page, page, false, page === result.page); previous = page;
    });
    node('pagination').innerHTML = html + button('Next', result.page + 1, result.page === result.totalPages);
  }

  function syncUrl(replace) {
    const search = S.serializeQuery(query);
    if (window.location.search === (search ? '?' + search : '')) return;
    try {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', window.location.pathname + (search ? '?' + search : '') + window.location.hash);
    } catch (error) {
      if (historyAvailable) UI.toast('This browser blocked local-file URL updates. Open the store in Chrome or Edge to share filters.');
      historyAvailable = false;
    }
  }

  function render() {
    products = S.getProducts();
    const result = S.filterProducts(products, query);
    query.page = result.page;
    const title = query.category.length === 1 ? query.category[0] : 'All products';
    node('category-title').textContent = title; node('category-breadcrumb').textContent = title;
    document.title = title + ' — Voltix';
    node('result-count').textContent = '(' + result.total + ' product' + (result.total === 1 ? '' : 's') + ')';
    const searchInput = document.querySelector('.st-search input[name="q"]');
    if (searchInput && document.activeElement !== searchInput) searchInput.value = query.q;
    node('sort').value = query.sort;
    renderOptions('category', node('category-options'), S.getCategories(products), allMatching({ ...query, category: [] }));
    renderOptions('brand', node('brand-options'), S.getBrands(products), allMatching({ ...query, brand: [] }));
    node('instock').checked = query.instock;
    priceCeiling = Math.max(1, ...products.map(S.dealPrice), query.min || 0, query.max || 0);
    ['min', 'max'].forEach((key) => {
      const input = node('price-' + key), range = node('price-' + key + '-range');
      if (document.activeElement !== input) input.value = query[key] === null ? '' : query[key];
      range.max = priceCeiling;
      range.value = query[key] === null ? (key === 'min' ? 0 : priceCeiling) : query[key];
      range.setAttribute('aria-valuetext', S.money(Number(range.value)));
    });
    const low = Number(node('price-min-range').value) / priceCeiling * 100;
    const high = Number(node('price-max-range').value) / priceCeiling * 100;
    form.querySelector('.st-range').style.setProperty('--st-range-low', low + '%');
    form.querySelector('.st-range').style.setProperty('--st-range-high', high + '%');
    renderChips();
    if (!products.length) UI.emptyCatalog(node('category-grid'));
    else if (!result.total) node('category-grid').innerHTML = '<div class="st-empty"><h2>No products found</h2><p>Try another price range or remove a filter.</p><button class="st-button st-button-primary" type="button" data-st-clear>Clear filters</button></div>';
    else UI.renderCards(node('category-grid'), result.products);
    renderPagination(result);
    node('show-results').textContent = 'Show ' + result.total + ' result' + (result.total === 1 ? '' : 's');
  }

  function update(patch, replace = false) {
    query = S.normalizeQuery({ ...query, ...patch, page: patch.page || 1, pageSize: 9 });
    render(); syncUrl(replace);
  }
  function clear() { query = S.normalizeQuery(); render(); syncUrl(false); }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'category' || input.name === 'brand') update({ [input.name]: Array.from(form.querySelectorAll('input[name="' + input.name + '"]:checked'), (item) => item.value) });
    else if (input.id === 'st-instock') update({ instock: input.checked });
    else if (input.id === 'st-price-min' || input.id === 'st-price-max') {
      if (!input.validity.valid) { input.reportValidity(); return; }
      update({ [input.id === 'st-price-min' ? 'min' : 'max']: input.value });
    }
  });
  // A slider drag replaces its intermediate history entry, leaving Back useful.
  let sliderDragging = false;
  ['min', 'max'].forEach((key) => {
    const range = node('price-' + key + '-range');
    range.addEventListener('input', () => {
      let value = Number(range.value);
      if (key === 'min' && query.max !== null) value = Math.min(value, query.max);
      if (key === 'max' && query.min !== null) value = Math.max(value, query.min);
      update({ [key]: value }, sliderDragging); sliderDragging = true;
    });
    range.addEventListener('change', () => { sliderDragging = false; });
    range.addEventListener('blur', () => { sliderDragging = false; });
  });
  node('sort').addEventListener('change', () => update({ sort: node('sort').value }));
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-st-clear]')) clear();
    const chip = event.target.closest('[data-st-remove]');
    if (chip) {
      const key = chip.dataset.stRemove;
      const value = ['category', 'brand'].includes(key) ? query[key].filter((item) => item !== chip.dataset.stValue) : key === 'instock' ? false : key === 'q' ? '' : null;
      update({ [key]: value });
      node('category-title').setAttribute('tabindex', '-1'); node('category-title').focus();
    }
    const page = event.target.closest('[data-st-page]');
    if (page && !page.disabled) { update({ page: Number(page.dataset.stPage) }); node('category-title').setAttribute('tabindex', '-1'); node('category-title').focus(); }
  });
  node('open-filters').addEventListener('click', () => {
    node('filter-drawer-body').appendChild(form); drawer.open(node('open-filters'));
  });
  node('close-filters').addEventListener('click', drawer.close);
  node('show-results').addEventListener('click', drawer.close);
  node('reset-filters').addEventListener('click', clear);
  media.addEventListener('change', () => { if (!media.matches) drawer.close(); });
  window.addEventListener('popstate', () => { query = S.parseQuery(); if (query.sort === 'discount') query.sort = 'featured'; render(); });
  window.addEventListener('voltix:store-refresh', () => { render(); syncUrl(true); });
  render(); syncUrl(true);
})(window, document);
