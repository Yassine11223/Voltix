(() => {
  "use strict";

  const STORAGE_KEY = "voltix.settings";
  const session = window.VoltixApp?.session;
  if (!session) return;

  const isAdmin = session.role === "admin";
  const accessDeniedBanner = document.getElementById("access-denied-banner");
  const settingsView = document.getElementById("settings-view");

  if (!isAdmin) {
    if (accessDeniedBanner) accessDeniedBanner.hidden = false;
    if (settingsView) settingsView.hidden = true;
    return;
  }

  const DEFAULT_SETTINGS = {
    storeName: "Voltix Electronics",
    storeBranch: "Main Downtown Retail",
    storePhone: "+1 (555) 019-2834",
    storeEmail: "support@voltix.test",
    storeAddress: "452 Tech Plaza, Silicon Ave, Suite 100",
    storeTaxId: "TAX-EG-984210",
    currencySymbol: "$",
    taxRate: 14,
    receiptHeader: "Thank you for choosing Voltix Electronics!",
    receiptFooter: "Returns or exchanges valid within 14 days of purchase with original receipt and unsealed manufacturer packaging.",
    autoPrint: true,
    scanSound: true,
    lowStockThreshold: 5,
    preventNegativeStock: true,
    autoDeductStock: true
  };

  function loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error("Failed to save settings:", err);
      return false;
    }
  }

  let settings = loadSettings();

  // Form Field Elements
  const fieldStoreName = document.getElementById("setting-store-name");
  const fieldStoreBranch = document.getElementById("setting-store-branch");
  const fieldStorePhone = document.getElementById("setting-store-phone");
  const fieldStoreEmail = document.getElementById("setting-store-email");
  const fieldStoreAddress = document.getElementById("setting-store-address");
  const fieldStoreTaxId = document.getElementById("setting-store-tax-id");
  const fieldCurrencySymbol = document.getElementById("setting-currency-symbol");
  const fieldTaxRate = document.getElementById("setting-tax-rate");
  const fieldReceiptHeader = document.getElementById("setting-receipt-header");
  const fieldReceiptFooter = document.getElementById("setting-receipt-footer");
  const fieldAutoPrint = document.getElementById("setting-auto-print");
  const fieldScanSound = document.getElementById("setting-scan-sound");
  const fieldLowStockThreshold = document.getElementById("setting-low-stock-threshold");
  const fieldPreventNegative = document.getElementById("setting-prevent-negative");
  const fieldAutoDeduct = document.getElementById("setting-auto-deduct");

  const btnSave = document.getElementById("btn-save-settings");
  const toastContainer = document.getElementById("toast-container");

  // Metrics elements
  const metricUserCount = document.getElementById("metric-user-count");
  const metricProductCount = document.getElementById("metric-product-count");
  const metricSalesCount = document.getElementById("metric-sales-count");
  const metricStorageSize = document.getElementById("metric-storage-size");

  // Utilities elements
  const btnExportBackup = document.getElementById("btn-export-backup");
  const fileRestoreInput = document.getElementById("file-restore-input");
  const btnResetDemo = document.getElementById("btn-reset-demo");
  const resetModal = document.getElementById("reset-modal");
  const btnResetCancel = document.getElementById("btn-reset-cancel");
  const btnResetCancelX = document.getElementById("btn-reset-cancel-x");
  const btnResetConfirm = document.getElementById("btn-reset-confirm");

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

  function populateForm() {
    fieldStoreName.value = settings.storeName || "";
    fieldStoreBranch.value = settings.storeBranch || "";
    fieldStorePhone.value = settings.storePhone || "";
    fieldStoreEmail.value = settings.storeEmail || "";
    fieldStoreAddress.value = settings.storeAddress || "";
    fieldStoreTaxId.value = settings.storeTaxId || "";
    fieldCurrencySymbol.value = settings.currencySymbol || "$";
    fieldTaxRate.value = settings.taxRate ?? 14;
    fieldReceiptHeader.value = settings.receiptHeader || "";
    fieldReceiptFooter.value = settings.receiptFooter || "";
    fieldAutoPrint.checked = Boolean(settings.autoPrint);
    fieldScanSound.checked = Boolean(settings.scanSound);
    fieldLowStockThreshold.value = settings.lowStockThreshold ?? 5;
    fieldPreventNegative.checked = Boolean(settings.preventNegativeStock);
    fieldAutoDeduct.checked = Boolean(settings.autoDeductStock);
  }

  function handleSave() {
    const updated = {
      storeName: fieldStoreName.value.trim() || DEFAULT_SETTINGS.storeName,
      storeBranch: fieldStoreBranch.value.trim(),
      storePhone: fieldStorePhone.value.trim(),
      storeEmail: fieldStoreEmail.value.trim(),
      storeAddress: fieldStoreAddress.value.trim(),
      storeTaxId: fieldStoreTaxId.value.trim(),
      currencySymbol: fieldCurrencySymbol.value,
      taxRate: Math.max(0, parseFloat(fieldTaxRate.value) || 0),
      receiptHeader: fieldReceiptHeader.value.trim(),
      receiptFooter: fieldReceiptFooter.value.trim(),
      autoPrint: fieldAutoPrint.checked,
      scanSound: fieldScanSound.checked,
      lowStockThreshold: Math.max(1, parseInt(fieldLowStockThreshold.value, 10) || 5),
      preventNegativeStock: fieldPreventNegative.checked,
      autoDeductStock: fieldAutoDeduct.checked
    };

    if (saveSettings(updated)) {
      settings = updated;
      showToast("Store settings saved successfully.", "success");
      updateStorageMetrics();
    } else {
      showToast("Failed to save settings to localStorage.", "error");
    }
  }

  function updateStorageMetrics() {
    let usersCount = 0;
    let productsCount = 0;
    let salesCount = 0;
    let totalBytes = 0;

    try {
      const u = JSON.parse(localStorage.getItem("voltix.users") || "[]");
      usersCount = Array.isArray(u) ? u.length : 0;
    } catch {}

    try {
      const p = JSON.parse(localStorage.getItem("voltix.products") || "[]");
      productsCount = Array.isArray(p) ? p.length : 0;
    } catch {}

    try {
      const s = JSON.parse(localStorage.getItem("voltix.sales") || "[]");
      salesCount = Array.isArray(s) ? s.length : 0;
    } catch {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("voltix.")) {
        const val = localStorage.getItem(key) || "";
        totalBytes += (key.length + val.length) * 2; // Approximate UTF-16
      }
    }

    const kb = (totalBytes / 1024).toFixed(1);

    metricUserCount.textContent = usersCount;
    metricProductCount.textContent = productsCount;
    metricSalesCount.textContent = salesCount;
    metricStorageSize.textContent = `~${kb} KB`;
  }

  function exportBackup() {
    const backup = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      store: settings.storeName,
      data: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("voltix.")) {
        try {
          backup.data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          backup.data[key] = localStorage.getItem(key);
        }
      }
    }

    const str = JSON.stringify(backup, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voltix-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("System backup downloaded.");
  }

  function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed || !parsed.data) {
          showToast("Invalid Voltix backup file format.", "error");
          return;
        }

        Object.entries(parsed.data).forEach(([k, v]) => {
          if (typeof v === "object") {
            localStorage.setItem(k, JSON.stringify(v));
          } else {
            localStorage.setItem(k, String(v));
          }
        });

        showToast("Backup restored successfully. Reloading...", "success");
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        showToast("Error parsing backup JSON file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function resetAllData() {
    // Clear only voltix keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("voltix.")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    resetModal.hidden = true;
    showToast("All demo data reset to default factory state.", "success");
    setTimeout(() => window.location.reload(), 1000);
  }

  // Event Listeners
  btnSave.addEventListener("click", handleSave);
  btnExportBackup.addEventListener("click", exportBackup);
  fileRestoreInput.addEventListener("change", handleRestoreFile);

  btnResetDemo.addEventListener("click", () => {
    resetModal.hidden = false;
  });
  btnResetCancel.addEventListener("click", () => {
    resetModal.hidden = true;
  });
  btnResetCancelX.addEventListener("click", () => {
    resetModal.hidden = true;
  });
  btnResetConfirm.addEventListener("click", resetAllData);

  // Settings section navigation active indicator
  const navLinks = document.querySelectorAll(".settings-nav-item");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Expose global helper API
  window.VoltixSettings = {
    get: () => loadSettings(),
    getTaxRate: () => loadSettings().taxRate,
    getCurrencySymbol: () => loadSettings().currencySymbol,
    getLowStockThreshold: () => loadSettings().lowStockThreshold
  };

  // Initial setup
  populateForm();
  updateStorageMetrics();
})();
