(() => {
  "use strict";

  // Frontend demo only: browser sessions and role-based UI are not production
  // authentication or authorization. Real access checks require a trusted backend.
  const SESSION_KEY = "voltix.session";
  const LOGIN_PATH = "../index.html";
  const shell = document.getElementById("app-shell");
  if (!shell) return;

  function readSession() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (!value || !["admin", "staff"].includes(value.role)) return null;
      if (!["id", "name", "email"].every((key) =>
        typeof value[key] === "string" && value[key].trim().length > 0
      )) return null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return null;
      return { id: value.id, name: value.name, email: value.email, role: value.role };
    } catch {
      return null;
    }
  }

  function returnToLogin() {
    shell.hidden = true;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Navigation still works when browser storage has become unavailable.
    }
    window.location.replace(LOGIN_PATH);
  }

  const session = readSession();
  if (!session) {
    returnToLogin();
    return;
  }

  const navigation = [
    ["dashboard", "Dashboard"], ["pos", "POS"], ["products", "Products"],
    ["inventory", "Inventory"], ["sales", "Sales"], ["suppliers", "Suppliers"],
    ["reports", "Reports"], ["users", "Users"], ["returns", "Returns"],
    ["settings", "Settings"]
  ];
  const staffPages = new Set(["dashboard", "pos", "products", "inventory", "sales"]);
  const navList = document.getElementById("primary-navigation");
  const currentPage = window.location.pathname.split("/").pop();

  navigation.forEach(([page, label]) => {
    if (session.role === "staff" && !staffPages.has(page)) return;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = page + ".html";
    if (currentPage === page + ".html") link.setAttribute("aria-current", "page");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("icon");
    icon.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#icon-" + page);
    icon.append(use);
    const text = document.createElement("span");
    text.textContent = label;
    link.append(icon, text);

    if (session.role === "staff" && ["products", "inventory"].includes(page)) {
      const note = document.createElement("span");
      note.className = "nav-meta";
      note.textContent = "View";
      link.append(note);
    }
    item.append(link);
    navList.append(item);
  });

  document.getElementById("current-user-name").textContent = session.name;
  document.getElementById("current-user-role").textContent = session.role;
  document.getElementById("user-avatar").textContent = session.name.trim().charAt(0).toUpperCase();
  document.getElementById("logout-button").addEventListener("click", returnToLogin);

  const sidebar = document.getElementById("app-sidebar");
  const workspace = document.getElementById("workspace");
  const menuButton = document.getElementById("menu-toggle");
  const closeButton = document.getElementById("close-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const mobile = window.matchMedia("(max-width: 980px)");
  let sidebarOpen = false;

  function setSidebarOpen(open, restoreFocus = true) {
    sidebarOpen = open && mobile.matches;
    document.body.classList.toggle("sidebar-open", sidebarOpen);
    menuButton.setAttribute("aria-expanded", String(sidebarOpen));
    menuButton.setAttribute("aria-label", sidebarOpen ? "Close navigation" : "Open navigation");
    backdrop.hidden = !sidebarOpen;
    sidebar.inert = mobile.matches && !sidebarOpen;
    workspace.inert = sidebarOpen;
    if (sidebarOpen) {
      sidebar.setAttribute("role", "dialog");
      sidebar.setAttribute("aria-modal", "true");
      closeButton.focus();
    } else {
      sidebar.removeAttribute("role");
      sidebar.removeAttribute("aria-modal");
      if (restoreFocus && mobile.matches) menuButton.focus();
    }
  }

  menuButton.addEventListener("click", () => setSidebarOpen(!sidebarOpen));
  closeButton.addEventListener("click", () => setSidebarOpen(false));
  backdrop.addEventListener("click", () => setSidebarOpen(false));
  navList.addEventListener("click", (event) => {
    if (event.target.closest("a") && mobile.matches) setSidebarOpen(false, false);
  });
  document.addEventListener("keydown", (event) => {
    if (!sidebarOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setSidebarOpen(false);
    } else if (event.key === "Tab") {
      const targets = Array.from(sidebar.querySelectorAll("a[href], button:not(:disabled)"))
        .filter((element) => element.getClientRects().length > 0);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  mobile.addEventListener("change", () => setSidebarOpen(false, false));
  setSidebarOpen(false, false);

  // This object shares the validated identity with page rendering, not business data.
  window.VoltixApp = Object.freeze({ session: Object.freeze(session) });
  shell.hidden = false;

  // Recheck pages restored from the browser's back/forward cache after logout.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    const current = readSession();
    if (!current) returnToLogin();
    else if (JSON.stringify(current) !== JSON.stringify(session)) window.location.reload();
  });
})();
