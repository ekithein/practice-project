// отрисовка и управление интерфейсом
import { API_BASE } from "./utils.js";
console.log("ui.js загружен");

export function loadListings(queryString = "") {
  const container = document.getElementById("listings");
  if (!container) return;

  fetch(queryString ? `${API_BASE}?${queryString}` : API_BASE)
    .then((res) => {
      if (res.status === 401) return (window.location.href = "/");
      return res.json();
    })
    .then((data) => {
      container.innerHTML = "";
      const emptyMsg = document.getElementById("empty-message");
      if (!data.length) {
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
      }
      if (emptyMsg) emptyMsg.style.display = "none";
      data.forEach((listing) => {
        container.appendChild(renderListingCard(listing));
      });
    })
    .catch((err) => console.error("Ошибка загрузки:", err));
}

export function renderListingCard(listing) {
  const card = document.createElement("div");
  card.classList.add("listing-card");
  card.innerHTML = `
        <div class="card-content">
            <span class="status-badge ${listing.status}">${
    listing.status
  }</span>
            <h3>${listing.title}</h3>
            <p><strong>Тип:</strong> ${listing.type}</p>
            <p><strong>Адрес:</strong> г. ${listing.city}, ул. ${
    listing.address
  }</p>
            <p><strong>Цена:</strong> ${Number(listing.price).toLocaleString(
              "ru-RU"
            )} ₽</p>
            ${renderExtra(listing)}
            <p><strong>Описание:</strong> ${listing.description}</p>
            <p><em>${listing.created_at}</em></p>
            <button data-id="${
              listing.id
            }" class="btn btn-primary edit-btn">Редактировать</button>
            <button data-id="${
              listing.id
            }" class="btn btn-danger delete-btn">Удалить</button>
            <hr>
        </div>`;
  return card;
}

function renderExtra(listing) {
  let out = "";
  if (listing.area)
    out += `<p><strong>Площадь:</strong> ${listing.area} м²</p>`;

  if (listing.type === "квартира") {
    if (listing.rooms)
      out += `<p><strong>Комнат:</strong> ${listing.rooms}</p>`;
    if (listing.floor)
      out += `<p><strong>Этаж:</strong> ${listing.floor}</p>`;
  }

  if (listing.type === "дом") {
    if (listing.floors)
      out += `<p><strong>Этажей:</strong> ${listing.floors}</p>`;
    if (listing.plot_size)
      out += `<p><strong>Участок:</strong> ${listing.plot_size} сот.</p>`;
  }

  return out;
}


export function bindModals() {
  const openBtn = document.getElementById("open-modal");
  const closeBtn = document.getElementById("close-modal");
  const cancelEdit = document.getElementById("cancel-edit");
  const cancelDelete = document.getElementById("cancel-delete");

  const propertyType = document.getElementById("property-type");
  const aptFields = document.getElementById("apartment-fields");
  const houseFields = document.getElementById("house-fields");

  // Утилита для управления required
  const toggleRequiredFields = (container, required) => {
    Array.from(container.querySelectorAll("input")).forEach(input => {
      if (required) {
        input.setAttribute("required", "required");
      } else {
        input.removeAttribute("required");
      }
    });
  };

  if (propertyType && aptFields && houseFields) {
    const handleTypeChange = (e) => {
      const type = e.target.value;
      if (type === "квартира") {
        aptFields.style.display = "block";
        houseFields.style.display = "none";
        toggleRequiredFields(aptFields, true);
        toggleRequiredFields(houseFields, false);
      } else if (type === "дом") {
        aptFields.style.display = "none";
        houseFields.style.display = "block";
        toggleRequiredFields(aptFields, false);
        toggleRequiredFields(houseFields, true);
      } else {
        aptFields.style.display = "none";
        houseFields.style.display = "none";
        toggleRequiredFields(aptFields, false);
        toggleRequiredFields(houseFields, false);
      }
    };

    propertyType.addEventListener("change", handleTypeChange);

    // Если форма открылась с уже выбранным типом
    handleTypeChange({ target: propertyType });
  }

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      document.getElementById("modal")?.style?.setProperty("display", "flex");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("modal")?.style?.setProperty("display", "none");
    });
  }

  if (cancelEdit) {
    cancelEdit.addEventListener("click", () => {
      document.getElementById("edit-modal")?.style?.setProperty("display", "none");
    });
  }

  if (cancelDelete) {
    cancelDelete.addEventListener("click", () => {
      document.getElementById("confirm-modal")?.style?.setProperty("display", "none");
    });
  }
}

export function initFilterForm() {
  const form = document.getElementById("filter-form");
  const search = document.getElementById("search-title");
  const dropdown = document.getElementById("filter-dropdown");
  const filterType = document.getElementById("filter-type");
  const aptFields = document.getElementById("apartment-filter-fields");
  const houseFields = document.getElementById("house-filter-fields");
  const resetBtn = document.getElementById("reset-filters");

  if (
    !form ||
    !search ||
    !dropdown ||
    !filterType ||
    !aptFields ||
    !houseFields ||
    !resetBtn
  ) {
    console.warn("Не найдены элементы для фильтрации");
    return;
  }

  search.addEventListener("focus", () => (dropdown.style.display = "block"));

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== search) {
      dropdown.style.display = "none";
    }
  });

  filterType.addEventListener("change", (e) => {
    const type = e.target.value;
    aptFields.style.display = type === "квартира" ? "block" : "none";
    houseFields.style.display = type === "дом" ? "block" : "none";
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    search.value = "";
    filterType.dispatchEvent(new Event("change"));
    loadListings();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    if (search.value.trim()) {
      params.append("title", search.value.trim());
    }
    loadListings(params.toString());
  });
}
