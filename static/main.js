// основное

import { loadListings, initFilterForm, bindModals } from './ui.js';
import { bindCreateForm, bindEditForm, bindDeleteButtons } from './handlers.js';

console.log("main.js загружен");

// Только если есть секция с объявлениями — выполняем объявления
if (document.getElementById("listings-block")) {
  loadListings();
  initFilterForm();
  bindModals();
  bindCreateForm();
  bindEditForm();
  bindDeleteButtons();
}

// Обработка модалки настроек
const settingsLink = document.getElementById("open-settings");
const settingsModal = document.getElementById("settings-modal");
const closeSettings = document.getElementById("close-settings");
const logoutBtn = document.getElementById("logout-btn");

if (settingsLink && settingsModal && closeSettings) {
  settingsLink.addEventListener("click", (e) => {
    e.preventDefault();
    settingsModal.style.display = "flex";
  });

  closeSettings.addEventListener("click", () => {
    settingsModal.style.display = "none";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    window.location.href = "/logout";
  });
}

const downloadBtn = document.getElementById("download-data");
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    window.location.href = "/export";
  });
}
