(function (window) {
  'use strict';

  const store = window.VoltixInventory;
  const session = window.VoltixApp?.session;
  if (!store || !session) return;

  const isAdmin = session.role === 'admin';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const safeArray = (key) => {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || 'null');
      return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
    } catch (error) {
      return [];
    }
  };

  function readSales() {
    const sales = safeArray('voltix_sales');
    return sales.length ? sales : safeArray('voltix.sales');
  }

  function saleDate(sale) { return sale?.date || sale?.createdAt || ''; }
  function lineQuantity(line) {
    const value = line?.qty ?? line?.quantity;
    return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
  }
  function linePrice(line) {
    const value = line?.unitPrice ?? line?.price ?? line?.unitCost;
    return Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
  }
  function saleTotal(sale) {
    if (Number.isFinite(Number(sale?.total))) return Number(sale.total);
    return (Array.isArray(sale?.items) ? sale.items : []).reduce((sum, line) => {
      const lineTotal = Number(line?.lineTotal ?? line?.total);
      return sum + (Number.isFinite(lineTotal) ? lineTotal : lineQuantity(line) * linePrice(line));
    }, 0);
  }
  function cashierName(sale) { return sale?.cashierName || sale?.cashier || sale?.cashierId || 'Unknown cashier'; }
  function saleId(sale) { return sale?.id || sale?.saleId || 'Unknown sale'; }
  function isToday(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.toDateString() === new Date().toDateString();
  }
  function visibleSales() {
    return readSales().filter((sale) => isAdmin || sale.cashierId === session.id || sale.cashierName === session.name || sale.cashier === session.name);
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-' + name);
    svg.append(use);
    return svg;
  }
  function emptyState(iconName, title, description, className = 'transaction-empty') {
    const element = document.createElement('div');
    element.className = className;
    const symbol = document.createElement('span');
    symbol.className = 'empty-symbol' + (className === 'stock-empty' ? ' stock-symbol' : '');
    symbol.append(icon(iconName));
    const copy = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = description;
    copy.append(heading, text);
    element.append(symbol, copy);
    return element;
  }

  function renderStatistics(summary, sales) {
    const todaysSales = sales.filter((sale) => isToday(saleDate(sale)));
    const cards = [
      ['Total products', summary.totalProducts, 'Active catalog items', 'products'],
      ['Total stock units', summary.totalUnits.toLocaleString(), 'Across active SKUs', 'inventory'],
      ['Low-stock products', summary.lowStockCount, 'Needs attention', 'stock'],
      ['Out-of-stock products', summary.outOfStockCount, 'Unavailable now', 'stock']
    ];
    if (isAdmin) cards.push(['Inventory value', store.formatCurrency(summary.inventoryValue), 'At cost', 'revenue']);
    cards.push([isAdmin ? "Today's sales" : "Your sales today", todaysSales.length.toLocaleString(), 'Completed transactions', 'sales']);
    cards.push([isAdmin ? "Today's revenue" : "Your revenue today", store.formatCurrency(todaysSales.reduce((sum, sale) => sum + saleTotal(sale), 0)), 'Gross sales', 'revenue']);
    const grid = $('dashboard-stats');
    grid.classList.toggle('staff-stats', !isAdmin);
    grid.replaceChildren(...cards.map(([title, value, note, iconName]) => {
      const card = document.createElement('article');
      card.className = 'stat-card' + (iconName === 'stock' ? ' stock-card' : '');
      const top = document.createElement('div');
      top.className = 'stat-top';
      const heading = document.createElement('h2');
      heading.textContent = title;
      const iconHolder = document.createElement('span');
      iconHolder.className = 'stat-icon';
      iconHolder.append(icon(iconName));
      top.append(heading, iconHolder);
      const amount = document.createElement('p');
      amount.className = 'stat-value';
      amount.textContent = String(value);
      const description = document.createElement('p');
      description.className = 'stat-note';
      description.textContent = note;
      card.append(top, amount, description);
      return card;
    }));
  }

  function renderTransactions(sales) {
    const heading = isAdmin ? 'Recent transactions' : 'Your recent transactions';
    $('transactions-heading').textContent = heading;
    $('transactions-caption').textContent = heading;
    $('transactions-description').textContent = isAdmin ? 'Recent sales from all staff.' : 'Your own sales activity.';
    const columns = isAdmin ? ['Transaction', 'Staff', 'Date', 'Total', 'Status'] : ['Transaction', 'Date', 'Total', 'Status'];
    $('transaction-columns').replaceChildren(...columns.map((title) => {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = title; return cell;
    }));
    const recent = [...sales].sort((a, b) => (Date.parse(saleDate(b)) || 0) - (Date.parse(saleDate(a)) || 0)).slice(0, 5);
    $('transactions-body').replaceChildren(...recent.map((sale) => {
      const row = document.createElement('tr');
      const status = String(sale.status || 'completed').replaceAll('_', ' ');
      const cells = isAdmin
        ? [saleId(sale), cashierName(sale), new Date(saleDate(sale)).toLocaleString(), store.formatCurrency(saleTotal(sale)), status]
        : [saleId(sale), new Date(saleDate(sale)).toLocaleString(), store.formatCurrency(saleTotal(sale)), status];
      row.innerHTML = cells.map((value, index) => index === 0 ? `<th scope="row">${esc(value)}</th>` : `<td>${esc(value)}</td>`).join('');
      return row;
    }));
    $('transactions-empty').replaceChildren(...(recent.length ? [] : [emptyState('sales', 'No sales recorded yet', 'Completed POS sales will appear here once transaction data is available.')]));
    $('transactions-body').parentElement.parentElement.hidden = !recent.length;
    $('transactions-status').querySelector('span:last-child').textContent = sales.length ? `${sales.length} sale${sales.length === 1 ? '' : 's'} available` : 'Awaiting sales data';
  }

  function renderStock() {
    const products = store.getProducts();
    const lowStock = store.getLowStockProducts();
    const content = $('stock-content');
    if (!products.length) {
      content.replaceChildren(emptyState('products', 'Awaiting inventory data', 'Low-stock products will appear here when stock records are available.', 'stock-empty'));
      return;
    }
    if (!lowStock.length) {
      content.replaceChildren(emptyState('products', 'No low-stock products', 'All active products are currently above their low-stock thresholds.', 'stock-empty'));
      return;
    }
    const list = document.createElement('ul');
    list.className = 'stock-list';
    list.innerHTML = lowStock.slice(0, 8).map((product) => `<li><div><strong>${esc(product.name)}</strong><span>${esc(product.sku)}</span></div><span class="stock-count${product.stock === 0 ? ' stock-count-out' : ''}">${product.stock === 0 ? 'Out of stock' : `${product.stock} left`}</span></li>`).join('');
    content.replaceChildren(list);
  }

  function renderCategories() {
    const categories = store.getStockByCategory();
    const content = $('category-content');
    if (!categories.length) {
      content.replaceChildren(emptyState('inventory', 'No inventory categories', 'Category totals will appear when products are available.', 'stock-empty'));
      return;
    }
    const list = document.createElement('ul');
    list.className = 'category-list';
    list.innerHTML = categories.sort((a, b) => a.category.localeCompare(b.category)).map((category) => `<li><div><strong>${esc(category.category)}</strong><span>${category.products} product${category.products === 1 ? '' : 's'}</span></div><strong>${category.units.toLocaleString()} units</strong>${isAdmin ? `<span class="subtle">${esc(store.formatCurrency(category.value))} at cost</span>` : ''}</li>`).join('');
    content.replaceChildren(list);
  }

  function renderQuickActions() {
    const actions = [['pos', 'New sale', 'Open the point of sale'], ['products', isAdmin ? 'Manage products' : 'View products', 'Browse the product catalog']];
    if (isAdmin) actions.push(['inventory', 'Manage inventory', 'Open stock management']);
    $('quick-actions').replaceChildren(...actions.map(([page, title, description]) => {
      const link = document.createElement('a'); link.className = 'quick-action'; link.href = page + '.html';
      const iconHolder = document.createElement('span'); iconHolder.className = 'quick-action-icon'; iconHolder.append(icon(page));
      const copy = document.createElement('span'); copy.className = 'quick-action-copy';
      const name = document.createElement('strong'); name.textContent = title;
      const detail = document.createElement('span'); detail.textContent = description;
      copy.append(name, detail); link.append(iconHolder, copy, icon('arrow')); return link;
    }));
  }

  function render() {
    const sales = visibleSales();
    renderStatistics(store.getInventorySummary(), sales);
    renderTransactions(sales);
    renderStock();
    renderCategories();
  }

  try { store.seedDataIfEmpty(); } catch (error) { /* Readers remain safe when storage is corrupt. */ }
  $('welcome-message').textContent = 'Welcome back, ' + session.name + (isAdmin ? ". Here's your store at a glance." : ". Here's your workspace for today.");
  $('workspace-note-description').textContent = isAdmin ? 'Move between sales, products, and stock management from one place.' : 'Open POS to start a sale, or view products and stock information before your next transaction.';
  $('workspace-role-badge').textContent = isAdmin ? 'Admin workspace' : 'Staff workspace · View-only inventory';
  renderQuickActions();
  render();
  window.addEventListener('voltix:data-changed', render);
  window.addEventListener('storage', render);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
})(window);
