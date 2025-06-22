// вспомогательные функции

export const API_BASE = "/api/listings";

export function formatPrice(value) {
    return Number(value).toLocaleString("ru-RU");
}

export function getText(card, label) {
    const p = Array.from(card.querySelectorAll("p")).find(el => el.innerText.startsWith(label));
    return p
        ? p.innerText
            .replace(`${label}: `, "")
            .replace(" м²", "")
            .replace(" ₽", "")
            .replace(" сот.", "")
        : "";
}
