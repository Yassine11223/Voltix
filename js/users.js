(() => {
  "use strict";

  const STORAGE_KEY = "voltix.users";
  const session = window.VoltixApp?.session;
  if (!session) return;

  const isAdmin = session.role === "admin";
  const accessDeniedBanner = document.getElementById("access-denied-banner");
  const usersView = document.getElementById("users-view");

  if (!isAdmin) {
    if (accessDeniedBanner) accessDeniedBanner.hidden = false;
    if (usersView) usersView.hidden = true;
    return;
  }

  // Default seed dataset
  const DEFAULT_USERS = [
    {
      id: "user-admin",
      employeeId: "EMP-001",
      name: "Store Administrator",
      email: "admin@voltix.test",
      password: "Admin123!",
      role: "admin",
      status: "active",
      phone: "+1 (555) 019-2001",
      lastActive: "Active now",
      createdAt: "2026-09-01"
    },
    {
      id: "user-staff",
      employeeId: "EMP-002",
      name: "Front Cashier Staff",
      email: "staff@voltix.test",
      password: "Staff123!",
      role: "staff",
      status: "active",
      phone: "+1 (555) 019-2002",
      lastActive: "Today, 10:15 AM",
      createdAt: "2026-09-05"
    },
    {
      id: "user-emp-003",
      employeeId: "EMP-003",
      name: "Sarah Jenkins",
      email: "sarah.j@voltix.test",
      password: "Sarah123!",
      role: "staff",
      status: "active",
      phone: "+1 (555) 019-2003",
      lastActive: "Yesterday",
      createdAt: "2026-09-12"
    },
    {
      id: "user-emp-004",
      employeeId: "EMP-004",
      name: "Omar Khaled",
      email: "omar.k@voltix.test",
      password: "Omar123!",
      role: "admin",
      status: "active",
      phone: "+1 (555) 019-2004",
      lastActive: "Oct 21, 2026",
      createdAt: "2026-09-15"
    },
    {
      id: "user-emp-005",
      employeeId: "EMP-005",
      name: "Marcus Vance",
      email: "marcus.v@voltix.test",
      password: "Marcus123!",
      role: "staff",
      status: "suspended",
      phone: "+1 (555) 019-2005",
      lastActive: "Oct 14, 2026",
      createdAt: "2026-09-20"
    }
  ];

  function loadUsers() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        return [...DEFAULT_USERS];
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return [...DEFAULT_USERS];
    } catch {
      return [...DEFAULT_USERS];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      return true;
    } catch (err) {
      console.error("Failed to save users to localStorage:", err);
      showToast("Unable to save data to local storage.", "error");
      return false;
    }
  }

  let users = loadUsers();
  let userToDeleteId = null;

  // DOM Elements
  const tableBody = document.getElementById("users-table-body");
  const emptyState = document.getElementById("users-empty");
  const searchInput = document.getElementById("user-search-input");
  const roleFilter = document.getElementById("role-filter");
  const statusFilter = document.getElementById("status-filter");
  const resetFiltersBtn = document.getElementById("btn-reset-filters");
  const countBadge = document.getElementById("user-count-badge");

  // Metrics elements
  const statTotal = document.getElementById("stat-total-users");
  const statAdmin = document.getElementById("stat-admin-users");
  const statStaff = document.getElementById("stat-staff-users");
  const statActive = document.getElementById("stat-active-users");

  // Modal elements
  const userModal = document.getElementById("user-modal");
  const userForm = document.getElementById("user-form");
  const modalTitle = document.getElementById("modal-title");
  const modalError = document.getElementById("modal-error");
  const editUserId = document.getElementById("edit-user-id");
  const formName = document.getElementById("form-name");
  const formEmployeeId = document.getElementById("form-employee-id");
  const formEmail = document.getElementById("form-email");
  const formRole = document.getElementById("form-role");
  const formStatus = document.getElementById("form-status");
  const formPassword = document.getElementById("form-password");
  const formPhone = document.getElementById("form-phone");
  const btnTogglePwd = document.getElementById("btn-toggle-pwd");
  const passwordReqMark = document.getElementById("password-req-mark");
  const passwordHint = document.getElementById("password-hint");
  const btnAddUser = document.getElementById("btn-add-user");
  const btnModalClose = document.getElementById("btn-modal-close");
  const btnModalCancel = document.getElementById("btn-modal-cancel");

  // Delete modal elements
  const deleteModal = document.getElementById("delete-modal");
  const deleteUserName = document.getElementById("delete-user-name");
  const btnDeleteCancel = document.getElementById("btn-delete-cancel");
  const btnDeleteCancelX = document.getElementById("btn-delete-cancel-x");
  const btnDeleteConfirm = document.getElementById("btn-delete-confirm");

  const toastContainer = document.getElementById("toast-container");

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 200ms ease";
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  function updateMetrics() {
    statTotal.textContent = users.length;
    statAdmin.textContent = users.filter(u => u.role === "admin").length;
    statStaff.textContent = users.filter(u => u.role === "staff").length;
    statActive.textContent = users.filter(u => u.status === "active").length;
  }

  function generateNextEmployeeId() {
    const maxNum = users.reduce((acc, u) => {
      const match = u.employeeId && u.employeeId.match(/EMP-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(acc, isNaN(num) ? 0 : num);
      }
      return acc;
    }, 0);
    const next = maxNum + 1;
    return `EMP-${String(next).padStart(3, "0")}`;
  }

  function filterUsers() {
    const query = searchInput.value.trim().toLowerCase();
    const roleVal = roleFilter.value;
    const statusVal = statusFilter.value;

    return users.filter(user => {
      const matchesSearch = !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(query));

      const matchesRole = roleVal === "all" || user.role === roleVal;
      const matchesStatus = statusVal === "all" || user.status === statusVal;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  function renderTable() {
    const filtered = filterUsers();
    tableBody.innerHTML = "";
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? "member" : "members"}`;

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filtered.forEach(user => {
      const tr = document.createElement("tr");

      // Avatar letter
      const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
      const isSelf = user.email.toLowerCase() === session.email.toLowerCase();

      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <span class="user-avatar-sm" aria-hidden="true">${initials}</span>
            <div>
              <strong>${escapeHtml(user.name)} ${isSelf ? '<span class="badge badge-neutral" style="font-size: 9px; padding: 2px 6px;">You</span>' : ''}</strong>
              <span class="user-id-code">${escapeHtml(user.employeeId || "—")}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="contact-email">${escapeHtml(user.email)}</span>
          <span class="contact-phone">${escapeHtml(user.phone || "No phone")}</span>
        </td>
        <td>
          <span class="badge badge-${user.role}">${user.role === "admin" ? "Admin" : "Staff"}</span>
        </td>
        <td>
          <span class="badge badge-${user.status}">${user.status === "active" ? "Active" : "Suspended"}</span>
        </td>
        <td>
          <span style="font-size: 12px; color: var(--color-muted);">${escapeHtml(user.lastActive || "Recently")}</span>
        </td>
        <td class="text-right">
          <div class="table-actions">
            <button class="action-btn" type="button" title="Edit employee" data-action="edit" data-id="${user.id}">
              <svg><use href="#icon-edit"/></svg>
            </button>
            <button class="action-btn" type="button" title="${user.status === 'active' ? 'Suspend account' : 'Activate account'}" data-action="toggle-status" data-id="${user.id}">
              <svg><use href="#icon-shield"/></svg>
            </button>
            <button class="action-btn delete-btn" type="button" title="Delete employee" data-action="delete" data-id="${user.id}">
              <svg><use href="#icon-trash"/></svg>
            </button>
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });
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

  function openAddModal() {
    editUserId.value = "";
    modalTitle.textContent = "Add Employee";
    formName.value = "";
    formEmployeeId.value = generateNextEmployeeId();
    formEmail.value = "";
    formRole.value = "staff";
    formStatus.value = "active";
    formPassword.value = "";
    formPhone.value = "";
    formPassword.required = true;
    passwordReqMark.hidden = false;
    passwordHint.textContent = "Create an initial password (minimum 6 characters).";
    modalError.hidden = true;
    userModal.hidden = false;
    formName.focus();
  }

  function openEditModal(user) {
    editUserId.value = user.id;
    modalTitle.textContent = `Edit Employee — ${user.name}`;
    formName.value = user.name;
    formEmployeeId.value = user.employeeId || "";
    formEmail.value = user.email;
    formRole.value = user.role;
    formStatus.value = user.status;
    formPassword.value = "";
    formPhone.value = user.phone || "";
    formPassword.required = false;
    passwordReqMark.hidden = true;
    passwordHint.textContent = "Leave blank to keep existing password.";
    modalError.hidden = true;
    userModal.hidden = false;
    formName.focus();
  }

  function closeUserModal() {
    userModal.hidden = true;
    userForm.reset();
    modalError.hidden = true;
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    modalError.hidden = true;

    const id = editUserId.value;
    const isEditing = Boolean(id);
    const name = formName.value.trim();
    const email = formEmail.value.trim().toLowerCase();
    const role = formRole.value;
    const status = formStatus.value;
    const password = formPassword.value;
    const phone = formPhone.value.trim();
    const employeeId = formEmployeeId.value.trim();

    if (!name) {
      showModalError("Employee name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showModalError("Enter a valid email address (e.g. employee@voltix.test).");
      return;
    }

    // Duplicate email check
    const duplicate = users.find(u => u.email.toLowerCase() === email && u.id !== id);
    if (duplicate) {
      showModalError(`Email "${email}" is already used by ${duplicate.name}.`);
      return;
    }

    // Password validation
    if (!isEditing && (!password || password.length < 6)) {
      showModalError("Password must be at least 6 characters long.");
      return;
    }
    if (isEditing && password && password.length < 6) {
      showModalError("New password must be at least 6 characters long.");
      return;
    }

    // Role protection: Cannot downgrade yourself from admin if you are the current admin
    if (isEditing && id === session.id && role !== "admin") {
      showModalError("You cannot remove your own admin privileges.");
      return;
    }

    // Status protection: Cannot suspend yourself
    if (isEditing && id === session.id && status !== "active") {
      showModalError("You cannot suspend your own active account.");
      return;
    }

    if (isEditing) {
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx].name = name;
        users[idx].email = email;
        users[idx].role = role;
        users[idx].status = status;
        users[idx].phone = phone;
        if (password) {
          users[idx].password = password;
        }
        saveUsers(users);
        showToast(`Employee "${name}" updated successfully.`);
      }
    } else {
      const newUser = {
        id: `user-${Date.now()}`,
        employeeId: employeeId || generateNextEmployeeId(),
        name,
        email,
        password,
        role,
        status,
        phone,
        lastActive: "Never",
        createdAt: new Date().toISOString().split("T")[0]
      };
      users.push(newUser);
      saveUsers(users);
      showToast(`Employee "${name}" created successfully.`);
    }

    closeUserModal();
    updateMetrics();
    renderTable();
  }

  function showModalError(msg) {
    modalError.textContent = msg;
    modalError.hidden = false;
  }

  function handleToggleStatus(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.email.toLowerCase() === session.email.toLowerCase()) {
      showToast("You cannot suspend your own account.", "error");
      return;
    }

    // Check if suspending the last active admin
    if (user.role === "admin" && user.status === "active") {
      const activeAdmins = users.filter(u => u.role === "admin" && u.status === "active");
      if (activeAdmins.length <= 1) {
        showToast("Cannot suspend the only remaining active admin.", "error");
        return;
      }
    }

    user.status = user.status === "active" ? "suspended" : "active";
    saveUsers(users);
    showToast(`Account status for ${user.name} changed to ${user.status}.`);
    updateMetrics();
    renderTable();
  }

  function openDeleteDialog(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.email.toLowerCase() === session.email.toLowerCase()) {
      showToast("You cannot delete your own account.", "error");
      return;
    }

    if (user.role === "admin") {
      const activeAdmins = users.filter(u => u.role === "admin");
      if (activeAdmins.length <= 1) {
        showToast("Cannot delete the only remaining admin account.", "error");
        return;
      }
    }

    userToDeleteId = userId;
    deleteUserName.textContent = user.name;
    deleteModal.hidden = false;
  }

  function closeDeleteDialog() {
    deleteModal.hidden = true;
    userToDeleteId = null;
  }

  function confirmDelete() {
    if (!userToDeleteId) return;
    const user = users.find(u => u.id === userToDeleteId);
    users = users.filter(u => u.id !== userToDeleteId);
    saveUsers(users);
    closeDeleteDialog();
    showToast(`Employee "${user?.name || ''}" removed.`, "success");
    updateMetrics();
    renderTable();
  }

  // Event Listeners
  btnAddUser.addEventListener("click", openAddModal);
  btnModalClose.addEventListener("click", closeUserModal);
  btnModalCancel.addEventListener("click", closeUserModal);
  userForm.addEventListener("submit", handleFormSubmit);

  btnTogglePwd.addEventListener("click", () => {
    const isPwd = formPassword.type === "password";
    formPassword.type = isPwd ? "text" : "password";
    btnTogglePwd.textContent = isPwd ? "Hide" : "Show";
  });

  searchInput.addEventListener("input", renderTable);
  roleFilter.addEventListener("change", renderTable);
  statusFilter.addEventListener("change", renderTable);

  resetFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    roleFilter.value = "all";
    statusFilter.value = "all";
    renderTable();
  });

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "edit") {
      const u = users.find(x => x.id === id);
      if (u) openEditModal(u);
    } else if (action === "toggle-status") {
      handleToggleStatus(id);
    } else if (action === "delete") {
      openDeleteDialog(id);
    }
  });

  btnDeleteCancel.addEventListener("click", closeDeleteDialog);
  btnDeleteCancelX.addEventListener("click", closeDeleteDialog);
  btnDeleteConfirm.addEventListener("click", confirmDelete);

  // Close modals on backdrop click or Escape key
  [userModal, deleteModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.hidden = true;
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!userModal.hidden) closeUserModal();
      if (!deleteModal.hidden) closeDeleteDialog();
    }
  });

  // Expose helper API for other modules if needed
  window.VoltixUsers = {
    getAll: () => loadUsers(),
    getById: (id) => loadUsers().find(u => u.id === id)
  };

  // Initial render
  updateMetrics();
  renderTable();
})();
