(function (window, document) {
  'use strict';
  const S = window.VoltixStore, UI = window.VoltixStoreUI, e = S.escapeHtml;
  const catalog = document.getElementById('st-home-catalog');
  const empty = document.getElementById('st-home-empty');
  const categories = document.getElementById('st-home-categories');
  const deals = document.getElementById('st-home-deals');
  const brands = document.getElementById('st-home-brands');

  function render() {
    const products = S.getProducts();
    catalog.hidden = !products.length; empty.hidden = !!products.length;
    if (!products.length) { UI.emptyCatalog(empty); return; }
    categories.innerHTML = S.getCategories(products).map((item) => '<a class="st-category-tile" href="' + e(UI.categoryLink(item.name)) + '"><span class="st-category-visual" aria-hidden="true"></span><strong>' + e(item.name) + '</strong><span class="st-category-count">' + item.count + ' products</span></a>').join('');
    const featured = S.getDeals(products).slice(0, 4);
    UI.renderCards(deals, featured);
    if (!featured.length) deals.innerHTML = '<p class="st-empty">New deals are on the way. <a href="category.html">Explore all products</a>.</p>';
    brands.innerHTML = S.getBrands(products).map((item) => '<a class="st-chip" href="category.html?' + e(S.serializeQuery({ brand: [item.name] })) + '">' + e(item.name) + '<span class="st-sr-only">, ' + item.count + ' products</span></a>').join('');
  }
  window.addEventListener('voltix:store-refresh', render);
  render();
})(window, document);
