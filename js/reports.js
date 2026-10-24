(() => {
  "use strict";

  const session = window.VoltixApp?.session;
  if (!session) return;

  const isAdmin = session.role === "admin";
  const accessDeniedBanner = document.getElementById("access-denied-banner");
  const reportsView = document.getElementById("reports-view");

  if (!isAdmin) {
    if (accessDeniedBanner) accessDeniedBanner.hidden = false;
    if (reportsView) reportsView.hidden = true;
    return;
  }

  // Storage Keys
  const SALES_KEY = "voltix.sales";
  const PRODUCTS_KEY = "voltix.products";
  const SETTINGS_KEY = "voltix.settings";

  function getCurrencySymbol() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return settings?.currencySymbol || "$";
    } catch {
      return "$";
    }
  }

  function formatMoney(amount) {
    const sym = getCurrencySymbol();
    return `${sym}${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Helper date generators for mock datasets
  function getPastDate(daysAgo, hour = 14, minute = 30) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  // Default seed products if Member 2 hasn't seeded yet
  const DEFAULT_PRODUCTS = [
    { id: "PROD-101", name: "Apple MacBook Pro 14\"", category: "Computers", price: 1999.00, stock: 12, minStock: 5 },
    { id: "PROD-102", name: "Sony WH-1000XM5 Wireless Headphones", category: "Audio", price: 399.99, stock: 4, minStock: 5 },
    { id: "PROD-103", name: "Samsung 65\" OLED 4K Smart TV", category: "Video & Displays", price: 1499.00, stock: 3, minStock: 4 },
    { id: "PROD-104", name: "Apple iPhone 15 Pro 256GB", category: "Mobile Phones", price: 1099.00, stock: 18, minStock: 6 },
    { id: "PROD-105", name: "Logitech MX Master 3S Mouse", category: "Accessories", price: 99.99, stock: 24, minStock: 10 },
    { id: "PROD-106", name: "Anker 737 Power Bank 24,000mAh", category: "Accessories", price: 149.99, stock: 2, minStock: 8 },
    { id: "PROD-107", name: "PlayStation 5 Slim Console", category: "Gaming", price: 499.99, stock: 0, minStock: 5 },
    { id: "PROD-108", name: "Bose QuietComfort Ultra Earbuds", category: "Audio", price: 299.00, stock: 9, minStock: 5 },
    { id: "PROD-109", name: "Apple iPad Air 11\" M2", category: "Tablets", price: 599.00, stock: 15, minStock: 6 }
  ];

  // Default seed sales transactions if Member 3 hasn't completed POS yet
  const DEFAULT_SALES = [
    {
      id: "TX-9041",
      date: getPastDate(0, 11, 20),
      cashier: "Front Cashier Staff",
      cashierId: "user-staff",
      items: [
        { id: "PROD-104", name: "Apple iPhone 15 Pro 256GB", quantity: 1, price: 1099.00 },
        { id: "PROD-105", name: "Logitech MX Master 3S Mouse", quantity: 1, price: 99.99 }
      ],
      paymentMethod: "Card",
      total: 1198.99
    },
    {
      id: "TX-9040",
      date: getPastDate(0, 10, 45),
      cashier: "Sarah Jenkins",
      cashierId: "user-emp-003",
      items: [
        { id: "PROD-102", name: "Sony WH-1000XM5 Wireless Headphones", quantity: 1, price: 399.99 }
      ],
      paymentMethod: "Cash",
      total: 399.99
    },
    {
      id: "TX-9039",
      date: getPastDate(1, 16, 10),
      cashier: "Front Cashier Staff",
      cashierId: "user-staff",
      items: [
        { id: "PROD-101", name: "Apple MacBook Pro 14\"", quantity: 1, price: 1999.00 }
      ],
      paymentMethod: "Card",
      total: 1999.00
    },
    {
      id: "TX-9038",
      date: getPastDate(1, 14, 25),
      cashier: "Store Administrator",
      cashierId: "user-admin",
      items: [
        { id: "PROD-106", name: "Anker 737 Power Bank 24,000mAh", quantity: 2, price: 149.99 },
        { id: "PROD-105", name: "Logitech MX Master 3S Mouse", quantity: 1, price: 99.99 }
      ],
      paymentMethod: "Card",
      total: 399.97
    },
    {
      id: "TX-9037",
      date: getPastDate(2, 17, 30),
      cashier: "Sarah Jenkins",
      cashierId: "user-emp-003",
      items: [
        { id: "PROD-103", name: "Samsung 65\" OLED 4K Smart TV", quantity: 1, price: 1499.00 }
      ],
      paymentMethod: "Card",
      total: 1499.00
    },
    {
      id: "TX-9036",
      date: getPastDate(3, 12, 15),
      cashier: "Front Cashier Staff",
      cashierId: "user-staff",
      items: [
        { id: "PROD-108", name: "Bose QuietComfort Ultra Earbuds", quantity: 1, price: 299.00 },
        { id: "PROD-105", name: "Logitech MX Master 3S Mouse", quantity: 2, price: 99.99 }
      ],
      paymentMethod: "Cash",
      total: 498.98
    },
    {
      id: "TX-9035",
      date: getPastDate(4, 15, 40),
      cashier: "Sarah Jenkins",
      cashierId: "user-emp-003",
      items: [
        { id: "PROD-109", name: "Apple iPad Air 11\" M2", quantity: 1, price: 599.00 }
      ],
      paymentMethod: "Card",
      total: 599.00
    },
    {
      id: "TX-9034",
      date: getPastDate(5, 11, 0),
      cashier: "Front Cashier Staff",
      cashierId: "user-staff",
      items: [
        { id: "PROD-104", name: "Apple iPhone 15 Pro 256GB", quantity: 2, price: 1099.00 }
      ],
      paymentMethod: "Card",
      total: 2198.00
    },
    {
      id: "TX-9033",
      date: getPastDate(6, 18, 20),
      cashier: "Store Administrator",
      cashierId: "user-admin",
      items: [
        { id: "PROD-102", name: "Sony WH-1000XM5 Wireless Headphones", quantity: 1, price: 399.99 }
      ],
      paymentMethod: "Cash",
      total: 399.99
    },
    {
      id: "TX-9032",
      date: getPastDate(12, 14, 0),
      cashier: "Sarah Jenkins",
      cashierId: "user-emp-003",
      items: [
        { id: "PROD-101", name: "Apple MacBook Pro 14\"", quantity: 1, price: 1999.00 }
      ],
      paymentMethod: "Card",
      total: 1999.00
    }
  ];

  function loadSales() {
    try {
      const stored = localStorage.getItem(SALES_KEY);
      if (!stored) {
        localStorage.setItem(SALES_KEY, JSON.stringify(DEFAULT_SALES));
        return [...DEFAULT_SALES];
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [...DEFAULT_SALES];
    } catch {
      return [...DEFAULT_SALES];
    }
  }

  function loadProducts() {
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      if (!stored) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
        return [...DEFAULT_PRODUCTS];
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [...DEFAULT_PRODUCTS];
    } catch {
      return [...DEFAULT_PRODUCTS];
    }
  }

  let salesData = loadSales();
  let productsData = loadProducts();
  let currentRange = "7days";
  let customStartDate = null;
  let customEndDate = null;

  // DOM Elements - Metrics
  const statTotalRevenue = document.getElementById("stat-total-revenue");
  const statTotalOrders = document.getElementById("stat-total-orders");
  const statAov = document.getElementById("stat-aov");
  const statItemsSold = document.getElementById("stat-items-sold");
  const statRevenueNote = document.getElementById("stat-revenue-note");
  const chartTimeframeLabel = document.getElementById("chart-timeframe-label");
  const revenueBarsChart = document.getElementById("revenue-bars-chart");
  const paymentBreakdown = document.getElementById("payment-methods-breakdown");
  const salesTableBody = document.getElementById("sales-table-body");
  const transactionCountBadge = document.getElementById("transaction-count-badge");

  // DOM Elements - Inventory Tab
  const statInvTotal = document.getElementById("stat-inv-total");
  const statInvValue = document.getElementById("stat-inv-value");
  const statInvLow = document.getElementById("stat-inv-low");
  const statInvOut = document.getElementById("stat-inv-out");
  const categoryDistributionList = document.getElementById("category-distribution-list");
  const topProductsTableBody = document.getElementById("top-products-table-body");

  // DOM Elements - Staff Tab
  const staffPerformanceTableBody = document.getElementById("staff-performance-table-body");

  // Date Filter Elements
  const dateBtns = document.querySelectorAll(".date-btn");
  const dateStartInput = document.getElementById("date-start");
  const dateEndInput = document.getElementById("date-end");
  const btnApplyCustomDate = document.getElementById("btn-apply-custom-date");

  // Tab Switchers
  const tabBtnSales = document.getElementById("tab-btn-sales");
  const tabBtnProducts = document.getElementById("tab-btn-products");
  const tabBtnStaff = document.getElementById("tab-btn-staff");
  const viewSales = document.getElementById("view-sales");
  const viewProducts = document.getElementById("view-products");
  const viewStaff = document.getElementById("view-staff");

  // Action Buttons
  const btnExportCsv = document.getElementById("btn-export-csv");
  const btnPrintReport = document.getElementById("btn-print-report");

  function filterSalesByDate() {
    const now = new Date();
    return salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      if (currentRange === "today") {
        return saleDate.toDateString() === now.toDateString();
      } else if (currentRange === "7days") {
        const diff = (now - saleDate) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      } else if (currentRange === "30days") {
        const diff = (now - saleDate) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      } else if (currentRange === "custom") {
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return saleDate >= start && saleDate <= end;
      }
      return true; // "all"
    });
  }

  function renderSalesView() {
    const filtered = filterSalesByDate();

    // Calculate Totals
    const totalRevenue = filtered.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const orderCount = filtered.length;
    const aov = orderCount > 0 ? (totalRevenue / orderCount) : 0;
    const itemsCount = filtered.reduce((acc, s) => {
      const sub = s.items?.reduce((iAcc, item) => iAcc + (item.quantity || 1), 0) || 1;
      return acc + sub;
    }, 0);

    statTotalRevenue.textContent = formatMoney(totalRevenue);
    statTotalOrders.textContent = orderCount.toLocaleString();
    statAov.textContent = formatMoney(aov);
    statItemsSold.textContent = itemsCount.toLocaleString();

    let timeframeText = "Last 7 Days";
    if (currentRange === "today") timeframeText = "Today";
    else if (currentRange === "30days") timeframeText = "This Month (30 Days)";
    else if (currentRange === "all") timeframeText = "All Time";
    else if (currentRange === "custom") timeframeText = "Custom Date Range";
    chartTimeframeLabel.textContent = timeframeText;
    statRevenueNote.textContent = `Gross revenue for ${timeframeText.toLowerCase()}`;

    // Render Daily Bar Chart (up to past 7 days)
    renderRevenueChart(filtered);

    // Render Payment Method Distribution
    renderPaymentBreakdown(filtered, totalRevenue);

    // Render Transaction Journal Table
    renderTransactionTable(filtered);
  }

  function renderRevenueChart(filteredSales) {
    revenueBarsChart.innerHTML = "";

    // Generate buckets for the last 7 calendar days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ key, label, total: 0 });
    }

    filteredSales.forEach(s => {
      const dateKey = s.date.split("T")[0];
      const found = days.find(d => d.key === dateKey);
      if (found) {
        found.total += Number(s.total) || 0;
      }
    });

    const maxVal = Math.max(...days.map(d => d.total), 500);

    days.forEach(day => {
      const col = document.createElement("div");
      col.className = "chart-bar-column";

      const heightPercent = Math.min(100, Math.max(6, Math.round((day.total / maxVal) * 100)));

      col.innerHTML = `
        <div class="chart-tooltip">${formatMoney(day.total)}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="height: ${heightPercent}%;"></div>
        </div>
        <span class="chart-label">${day.label}</span>
      `;

      revenueBarsChart.appendChild(col);
    });
  }

  function renderPaymentBreakdown(filteredSales, totalRevenue) {
    paymentBreakdown.innerHTML = "";

    const totals = {
      Card: 0,
      Cash: 0,
      Other: 0
    };

    filteredSales.forEach(s => {
      const method = s.paymentMethod || "Card";
      if (totals[method] !== undefined) {
        totals[method] += Number(s.total) || 0;
      } else {
        totals.Other += Number(s.total) || 0;
      }
    });

    const methods = [
      { name: "Card Payments", key: "Card", class: "card", total: totals.Card },
      { name: "Cash Sales", key: "Cash", class: "cash", total: totals.Cash },
      { name: "Digital / Gift / Other", key: "Other", class: "other", total: totals.Other }
    ];

    methods.forEach(m => {
      const pct = totalRevenue > 0 ? Math.round((m.total / totalRevenue) * 100) : 0;
      const row = document.createElement("div");
      row.className = "payment-row";
      row.innerHTML = `
        <div class="payment-info">
          <strong>${m.name}</strong>
          <span>${formatMoney(m.total)} (${pct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${m.class}" style="width: ${pct}%;"></div>
        </div>
      `;
      paymentBreakdown.appendChild(row);
    });
  }

  function renderTransactionTable(filteredSales) {
    salesTableBody.innerHTML = "";
    transactionCountBadge.textContent = `${filteredSales.length} ${filteredSales.length === 1 ? 'record' : 'records'}`;

    if (filteredSales.length === 0) {
      salesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-muted); padding: 32px;">No sales transactions recorded within this timeframe.</td></tr>`;
      return;
    }

    filteredSales.slice(0, 50).forEach(sale => {
      const tr = document.createElement("tr");
      const d = new Date(sale.date);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const itemsCount = sale.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;

      tr.innerHTML = `
        <td><strong style="font-family: ui-monospace, monospace; color: var(--color-blue);">${sale.id}</strong></td>
        <td>${dateStr}</td>
        <td>${escapeHtml(sale.cashier || "Cashier")}</td>
        <td>${itemsCount} ${itemsCount === 1 ? "unit" : "units"}</td>
        <td><span class="badge badge-neutral">${sale.paymentMethod || "Card"}</span></td>
        <td class="text-right"><strong>${formatMoney(sale.total)}</strong></td>
      `;

      salesTableBody.appendChild(tr);
    });
  }

  function renderInventoryView() {
    productsData = loadProducts();

    const totalProducts = productsData.length;
    const invValue = productsData.reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 0)), 0);
    const lowStock = productsData.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
    const outOfStock = productsData.filter(p => (p.stock || 0) <= 0).length;

    statInvTotal.textContent = totalProducts.toLocaleString();
    statInvValue.textContent = formatMoney(invValue);
    statInvLow.textContent = lowStock.toLocaleString();
    statInvOut.textContent = outOfStock.toLocaleString();

    // Category distribution
    const catMap = {};
    productsData.forEach(p => {
      const cat = p.category || "General Electronics";
      catMap[cat] = (catMap[cat] || 0) + (p.stock || 0);
    });

    const totalStock = Object.values(catMap).reduce((a, b) => a + b, 0);
    categoryDistributionList.innerHTML = "";

    Object.entries(catMap).forEach(([catName, stockQty]) => {
      const pct = totalStock > 0 ? Math.round((stockQty / totalStock) * 100) : 0;
      const row = document.createElement("div");
      row.className = "category-row";
      row.innerHTML = `
        <div class="payment-info">
          <strong>${escapeHtml(catName)}</strong>
          <span>${stockQty} in stock (${pct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      categoryDistributionList.appendChild(row);
    });

    // Top selling products table
    const productSalesMap = {};
    salesData.forEach(s => {
      s.items?.forEach(item => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = {
            id: item.id,
            name: item.name,
            category: "Electronics",
            unitsSold: 0,
            revenue: 0
          };
        }
        const qty = item.quantity || 1;
        productSalesMap[item.id].unitsSold += qty;
        productSalesMap[item.id].revenue += (item.price || 0) * qty;
      });
    });

    // Match with products data for stock & category
    const ranked = Object.values(productSalesMap).map(item => {
      const p = productsData.find(x => x.id === item.id);
      return {
        ...item,
        category: p?.category || item.category,
        stock: p ? p.stock : 10
      };
    }).sort((a, b) => b.unitsSold - a.unitsSold);

    topProductsTableBody.innerHTML = "";
    if (ranked.length === 0) {
      topProductsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-muted); padding: 24px;">No product sales recorded yet.</td></tr>`;
      return;
    }

    ranked.forEach((prod, idx) => {
      const tr = document.createElement("tr");
      let stockBadge = '<span class="badge badge-success">In Stock</span>';
      if (prod.stock <= 0) stockBadge = '<span class="badge badge-danger">Out</span>';
      else if (prod.stock <= 5) stockBadge = `<span class="badge badge-warning">${prod.stock} left</span>`;

      tr.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${escapeHtml(prod.name)}</strong></td>
        <td><span class="badge badge-neutral">${escapeHtml(prod.category)}</span></td>
        <td>${stockBadge}</td>
        <td><strong>${prod.unitsSold}</strong> units</td>
        <td class="text-right"><strong>${formatMoney(prod.revenue)}</strong></td>
      `;
      topProductsTableBody.appendChild(tr);
    });
  }

  function renderStaffView() {
    const staffMap = {};

    salesData.forEach(sale => {
      const name = sale.cashier || "Store Cashier";
      if (!staffMap[name]) {
        staffMap[name] = {
          name,
          role: name.includes("Admin") ? "Admin" : "Staff",
          ordersCount: 0,
          unitsCount: 0,
          revenue: 0
        };
      }
      staffMap[name].ordersCount += 1;
      const units = sale.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;
      staffMap[name].unitsCount += units;
      staffMap[name].revenue += Number(sale.total) || 0;
    });

    staffPerformanceTableBody.innerHTML = "";
    const list = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue);

    if (list.length === 0) {
      staffPerformanceTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-muted); padding: 24px;">No cashier POS records found.</td></tr>`;
      return;
    }

    list.forEach(member => {
      const avgBasket = member.ordersCount > 0 ? (member.revenue / member.ordersCount) : 0;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(member.name)}</strong></td>
        <td><span class="badge badge-${member.role.toLowerCase()}">${member.role}</span></td>
        <td>${member.ordersCount} sales</td>
        <td>${member.unitsCount} items</td>
        <td>${formatMoney(avgBasket)}</td>
        <td class="text-right"><strong>${formatMoney(member.revenue)}</strong></td>
      `;
      staffPerformanceTableBody.appendChild(tr);
    });
  }

  function exportCSV() {
    const filtered = filterSalesByDate();
    if (filtered.length === 0) {
      alert("No data available to export for the selected timeframe.");
      return;
    }

    let csvContent = "Transaction ID,Date,Cashier,Payment Method,Units,Total Amount\n";
    filtered.forEach(s => {
      const units = s.items?.reduce((a, b) => a + (b.quantity || 1), 0) || 1;
      const cleanCashier = (s.cashier || "").replace(/"/g, '""');
      csvContent += `"${s.id}","${s.date}","${cleanCashier}","${s.paymentMethod || 'Card'}","${units}","${(s.total || 0).toFixed(2)}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `voltix-sales-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Event Listeners for Date Presets
  dateBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      dateBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRange = btn.dataset.range;
      renderSalesView();
    });
  });

  btnApplyCustomDate.addEventListener("click", () => {
    const start = dateStartInput.value;
    const end = dateEndInput.value;
    if (!start || !end) {
      alert("Select both a start and an end date.");
      return;
    }
    dateBtns.forEach(b => b.classList.remove("active"));
    currentRange = "custom";
    customStartDate = start;
    customEndDate = end;
    renderSalesView();
  });

  // Tab Switching
  function switchTab(activeBtn, activeView) {
    [tabBtnSales, tabBtnProducts, tabBtnStaff].forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    [viewSales, viewProducts, viewStaff].forEach(v => {
      v.classList.remove("active");
      v.hidden = true;
    });

    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-selected", "true");
    activeView.classList.add("active");
    activeView.hidden = false;
  }

  tabBtnSales.addEventListener("click", () => {
    switchTab(tabBtnSales, viewSales);
    renderSalesView();
  });

  tabBtnProducts.addEventListener("click", () => {
    switchTab(tabBtnProducts, viewProducts);
    renderInventoryView();
  });

  tabBtnStaff.addEventListener("click", () => {
    switchTab(tabBtnStaff, viewStaff);
    renderStaffView();
  });

  btnExportCsv.addEventListener("click", exportCSV);
  btnPrintReport.addEventListener("click", () => window.print());

  // Expose global helper API
  window.VoltixReports = {
    refresh: () => {
      salesData = loadSales();
      productsData = loadProducts();
      renderSalesView();
      renderInventoryView();
      renderStaffView();
    }
  };

  // Initial load
  renderSalesView();
})();
