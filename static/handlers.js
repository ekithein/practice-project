// логика создания, редактирования, удаления

import { loadListings } from './ui.js';
import { API_BASE, getText } from './utils.js';

console.log("handlers.js загружен");

let currentEditId = null;

export function bindCreateForm() {
    const form = document.getElementById("add-form");
    const modal = document.getElementById("modal");
    const errorBlock = document.getElementById("add-form-error");

    if (!form || !modal || !errorBlock) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = form.type.value;
        const formData = extractFormData(form, type);

        errorBlock.textContent = "";

        try {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.status === 401) return (window.location.href = "/");

            if (!response.ok) {
                errorBlock.textContent = result.error || "Ошибка при добавлении";
                return;
            }

            form.reset();
            modal.style.display = "none";
            loadListings();
        } catch (err) {
            errorBlock.textContent = "Не удалось добавить объявление.";
            console.error(err);
        }
    });
}


export function bindEditForm() {
    const listings = document.getElementById("listings");
    const form = document.getElementById("edit-form");
    const modal = document.getElementById("edit-modal");
    const errorBlock = document.getElementById("edit-form-error");

    if (!listings || !form || !modal || !errorBlock) return;

    listings.addEventListener("click", (e) => {
        if (!e.target.classList.contains("edit-btn")) return;
        const id = e.target.dataset.id;
        const card = e.target.closest(".card-content");

        form.title.value = card.querySelector("h3").innerText;
        form.type.value = card.querySelector("p:nth-of-type(1)").innerText.replace("Тип: ", "");
        const rawAddr = getText(card, "Адрес");
        form.city.value = rawAddr.split(", ул. ")[0].replace("г. ", "");
        form.address.value = rawAddr.split(", ул. ")[1] || "";
        form.price.value = getText(card, "Цена").replace(" ₽", "").replace(/\s/g, "");
        form.status.value = card.querySelector(".status-badge")?.innerText.toLowerCase() || "активен";
        form.description.value = getText(card, "Описание");

        const type = form.type.value;
        const aptFields = document.getElementById("apartment-edit-fields");
        const houseFields = document.getElementById("house-edit-fields");

        const toggleRequired = (container, required) => {
            Array.from(container.querySelectorAll("input")).forEach(inp => {
                required ? inp.setAttribute("required", "required") : inp.removeAttribute("required");
            });
        };

        if (type === "квартира") {
            aptFields.style.display = "block";
            houseFields.style.display = "none";
            toggleRequired(aptFields, true);
            toggleRequired(houseFields, false);

            if (form.area) {
                form.area.value = getText(card, "Площадь");
            }

            form.rooms.value = getText(card, "Комнат");
            form.floor.value = getText(card, "Этаж");

        } else if (type === "дом") {
            aptFields.style.display = "none";
            houseFields.style.display = "block";
            toggleRequired(aptFields, false);
            toggleRequired(houseFields, true);

            if (form.area) {
                form.area.value = getText(card, "Площадь");
            }


            form.floors.value = getText(card, "Этажей");
            form.plot_size.value = getText(card, "Участок");
        }
        else {
            aptFields.style.display = "none";
            houseFields.style.display = "none";
            toggleRequired(aptFields, false);
            toggleRequired(houseFields, false);
        }

        currentEditId = id;
        modal.style.display = "flex";
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBlock.textContent = "";

        const type = form.type.value;
        const formData = extractFormData(form, type);

        try {
            const response = await fetch(`${API_BASE}/${currentEditId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.status === 401) return window.location.href = "/";
            if (!response.ok) {
                errorBlock.textContent = result.error || "Ошибка обновления";
                return;
            }

            modal.style.display = "none";
            loadListings();
        } catch (err) {
            errorBlock.textContent = "Не удалось сохранить изменения.";
            console.error(err);
        }
    });
}

export function bindDeleteButtons() {
    let deleteId = null;
    document.getElementById("listings").addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            deleteId = e.target.dataset.id;
            document.getElementById("confirm-modal").style.display = "flex";
        }
    });
    document.getElementById("confirm-delete").addEventListener("click", async () => {
        try {
            const response = await fetch(`${API_BASE}/${deleteId}`, { method: "DELETE" });
            if (response.status === 401) return window.location.href = "/";
            if (!response.ok) throw new Error("Ошибка удаления");
            deleteId = null;
            document.getElementById("confirm-modal").style.display = "none";
            loadListings();
        } catch (err) {
            alert("Не удалось удалить.");
            console.error(err);
        }
    });
}

function extractFormData(form, type) {
    const data = {
        title: form.title.value,
        type: type,
        city: form.city.value,
        price: parseInt(form.price.value),
        description: form.description.value,
        status: form.status.value,
        address: form.address.value,
        area: parseInt(form.area?.value) || null
    };

    if (type === "квартира") {
        data.rooms = parseInt(form.rooms?.value) || null;
        data.floor = parseInt(form.floor?.value) || null;
    }

    if (type === "дом") {
        data.floors = parseInt(form.floors?.value) || null;
        data.plot_size = parseInt(form.plot_size?.value) || null;
    }

    return data;
}
