from flask import Blueprint,  jsonify, send_file
from db import get_db_connection
from utils.helpers import get_current_user, validate_fields, save_listing_details, delete_listing_details
import pandas as pd
import io

analytics_bp = Blueprint("analytics", __name__)

# ===== АНАЛИТИКА =====
@analytics_bp.route("/api/analytics")
def analytics():
    user_id, _ = get_current_user()
    if not user_id:
        return jsonify({"error": "Не авторизован"}), 401

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*), ROUND(AVG(price), 2) FROM listings WHERE user_id = %s", (user_id,))
        count, avg_price = cur.fetchone()

        cur.execute("""SELECT city, COUNT(*) FROM listings
                       WHERE user_id = %s GROUP BY city ORDER BY COUNT(*) DESC LIMIT 3""", (user_id,))
        top_cities = cur.fetchall()

        cur.execute("SELECT status, COUNT(*) FROM listings WHERE user_id = %s GROUP BY status", (user_id,))
        status_counts = dict(cur.fetchall())

        cur.execute("""SELECT CASE WHEN status = 'продано' THEN 'продано' ELSE 'не продано' END AS category,
                              SUM(price) FROM listings WHERE user_id = %s GROUP BY category""", (user_id,))
        price_summary = dict(cur.fetchall())

        cur.execute("""
            SELECT range_label, COUNT(*) FROM (
                SELECT CASE
                    WHEN price BETWEEN 1000000 AND 4999999 THEN '1–5 млн ₽'
                    WHEN price BETWEEN 5000000 AND 9999999 THEN '5–10 млн ₽'
                    WHEN price BETWEEN 10000000 AND 14999999 THEN '10–15 млн ₽'
                    WHEN price BETWEEN 15000000 AND 19999999 THEN '15–20 млн ₽'
                    WHEN price BETWEEN 20000000 AND 29999999 THEN '20–30 млн ₽'
                    ELSE 'другое'
                END AS range_label FROM listings WHERE user_id = %s
            ) sub GROUP BY range_label
        """, (user_id,))
        price_ranges = [{"label": label, "count": count} for label, count in cur.fetchall()]

        total_price = sum(price_summary.values())

        return jsonify({
            "total_listings": count,
            "avg_price": avg_price,
            "top_cities": [{"city": c, "count": n} for c, n in top_cities],
            "status_distribution": status_counts,
            "status_prices": price_summary,
            "total_price": total_price,
            "price_ranges": price_ranges
        })
    finally:
        cur.close()
        conn.close()

@analytics_bp.route("/export")
def export_excel():
    user_id, _ = get_current_user()
    if not user_id:
        return jsonify({"error": "Не авторизован"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT l.title, l.type, l.city, l.address, l.price, l.status, l.description, l.created_at,
               a.area, a.rooms, a.floor,
               h.area, h.floors, h.plot_size
        FROM listings l
        LEFT JOIN apartment_details a ON l.id = a.listing_id
        LEFT JOIN house_details h ON l.id = h.listing_id
        WHERE l.user_id = %s
        ORDER BY l.created_at DESC
    """, (user_id,))

    data = []
    for row in cur.fetchall():
        (
            title, type_, city, address, price, status, desc, created_at,
            apt_area, apt_rooms, apt_floor,
            house_area, house_floors, plot_size
        ) = row

        base = {
            "Название": title,
            "Тип": type_,
            "Город": city,
            "Адрес": address,
            "Цена": price,
            "Статус": status,
            "Описание": desc,
            "Дата": created_at.strftime("%Y-%m-%d %H:%M")
        }

        if type_ == "квартира":
            base.update({
                "Площадь (м²)": apt_area,
                "Комнат": apt_rooms,
                "Этаж": apt_floor,
                "Этажей": "",
                "Участок (сот.)": ""
            })
        elif type_ == "дом":
            base.update({
                "Площадь (м²)": house_area,
                "Комнат": "",
                "Этаж": "",
                "Этажей": house_floors,
                "Участок (сот.)": plot_size
            })
        else:
            base.update({
                "Площадь (м²)": "",
                "Комнат": "",
                "Этаж": "",
                "Этажей": "",
                "Участок (сот.)": ""
            })

        data.append(base)

    cur.close()
    conn.close()

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Объявления")
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="listings.xlsx"
    )

