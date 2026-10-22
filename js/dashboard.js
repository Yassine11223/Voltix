(() => {
  "use strict";

  const session = window.VoltixApp?.session;
  if (!session) return;
  const isAdmin = session.role === "admin";

  // data.js and storage.js are currently empty. Do not invent business totals,
  // storage keys, or a data API. Replace these empty states once that API is agreed.
  const statistics = isAdmin
    ? [
      ["Total products", "products", "Awaiting inventory data"],
      ["Today's transactions", "sales", "Awaiting sales data"],
      ["Today's revenue", "revenue", "Awaiting sales data"],
      ["Low-stock products", "stock", "Awaiting inventory data"]
    ]
    : [
      ["Total available products", "products", "Awaiting inventory data"],
      ["Your transactions today", "sales", "Awaiting your sales data"],
      ["Low-stock products", "stock", "Awaiting inventory data"]
    ];

  function createIcon(name) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("icon");
    icon.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#icon-" + name);
    icon.append(use);
    return icon;
  }

  function renderStatistics() {
    const grid = document.getElementById("dashboard-stats");
    grid.classList.toggle("staff-stats", !isAdmin);
    statistics.forEach(([title, iconName, note]) => {
      const card = document.createElement("article");
      card.className = "stat-card" + (iconName === "stock" ? " stock-card" : "");
      const top = document.createElement("div");
      top.className = "stat-top";
      const heading = document.createElement("h2");
      heading.textContent = title;
      const icon = document.createElement("span");
      icon.className = "stat-icon";
      icon.append(createIcon(iconName));
      top.append(heading, icon);
      const value = document.createElement("p");
      value.className = "stat-value";
      value.textContent = "—";
      value.setAttribute("aria-label", "Data not available");
      const description = document.createElement("p");
      description.className = "stat-note";
      description.textContent = note;
      card.append(top, value, description);
      grid.append(card);
    });
  }

  function renderTransactions() {
    const heading = isAdmin ? "Recent transactions" : "Your recent transactions";
    document.getElementById("transactions-heading").textContent = heading;
    document.getElementById("transactions-caption").textContent = heading;
    document.getElementById("transactions-description").textContent = isAdmin
      ? "Recent sales from all staff."
      : "Your own sales activity.";
    const columns = isAdmin
      ? ["Transaction", "Staff", "Date", "Total", "Status"]
      : ["Transaction", "Date", "Total", "Status"];
    const header = document.getElementById("transaction-columns");
    columns.forEach((title) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = title;
      header.append(cell);
    });
    const emptyState = document.createElement("div");
    emptyState.className = "transaction-empty";
    const icon = document.createElement("span");
    icon.className = "empty-symbol";
    icon.append(createIcon("sales"));
    const title = document.createElement("h3");
    title.textContent = "No sales recorded yet";
    const description = document.createElement("p");
    description.textContent = isAdmin
      ? "Sales from your store team will appear here once transaction data is available."
      : "Your completed POS transactions will appear here once transaction data is available.";
    emptyState.append(icon, title, description);
    document.getElementById("transactions-empty").append(emptyState);
  }

  function renderQuickActions() {
    const actions = [
      ["pos", "New sale", "Open the point of sale"],
      ["products", isAdmin ? "Manage products" : "View products", "Browse the product catalog"]
    ];
    if (isAdmin) actions.push(["inventory", "Manage inventory", "Open stock management"]);
    const list = document.getElementById("quick-actions");
    actions.forEach(([page, title, description]) => {
      const link = document.createElement("a");
      link.className = "quick-action";
      link.href = page + ".html";
      const icon = document.createElement("span");
      icon.className = "quick-action-icon";
      icon.append(createIcon(page));
      const copy = document.createElement("span");
      copy.className = "quick-action-copy";
      const name = document.createElement("strong");
      name.textContent = title;
      const detail = document.createElement("span");
      detail.textContent = description;
      copy.append(name, detail);
      link.append(icon, copy, createIcon("arrow"));
      list.append(link);
    });
  }

  document.getElementById("welcome-message").textContent = "Welcome back, " + session.name +
    (isAdmin ? ". Here’s your store at a glance." : ". Here’s your workspace for today.");
  document.getElementById("stock-access-note").textContent = isAdmin
    ? "Inventory overview"
    : "Read-only · Stock changes are managed by an admin.";
  document.getElementById("workspace-note-description").textContent = isAdmin
    ? "Move between sales, products, and stock management from one place."
    : "Open POS to start a sale, or view products and stock information before your next transaction.";
  document.getElementById("workspace-role-badge").textContent = isAdmin ? "Admin workspace" : "Staff workspace · View-only inventory";
  renderStatistics();
  renderTransactions();
  renderQuickActions();
})();
