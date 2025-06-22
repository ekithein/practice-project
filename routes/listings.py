from flask import jsonify, request, Blueprint
from db import get_db_connection
from utils.helpers import get_current_user, validate_listing_data, save_listing_details, delete_listing_details

listings_bp = Blueprint("listings", __name__)

@listings_bp.route("/api/listings", methods=["GET"])
def get_listings():
    user_id, _ = get_current_user()
    if not user_id:
        return jsonify({"error": "Не авторизован"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    filters = ["l.user_id = %s"]
    params = [user_id]
    args = request.args

    def append_filter(condition, value):
        if value:
            filters.append(condition)
            params.append(value)

    # Общие фильтры
    append_filter("LOWER(l.title) LIKE %s", f"%{args.get('title', '').lower()}%" if args.get("title") else None)
    append_filter("LOWER(l.city) = %s", args.get("city", "").lower())
    append_filter("l.status = %s", args.get("status"))
    append_filter("l.type = %s", args.get("type"))
    append_filter("l.price >= %s", args.get("price_min"))
    append_filter("l.price <= %s", args.get("price_max"))
    append_filter("l.area >= %s", args.get("area_min"))
    append_filter("l.area <= %s", args.get("area_max"))

    # Специфические фильтры
    append_filter("(l.type != 'квартира' OR a.rooms = %s)", args.get("filter_rooms"))
    append_filter("(l.type != 'квартира' OR a.floor = %s)", args.get("filter_floor"))
    append_filter("(l.type != 'дом' OR h.floors = %s)", args.get("filter_floors"))
    append_filter("(l.type != 'дом' OR h.plot_size >= %s)", args.get("plot_min"))
    append_filter("(l.type != 'дом' OR h.plot_size <= %s)", args.get("plot_max"))

    cur.execute(f"""
        SELECT l.id, l.title, l.type, l.city, l.price, l.status, l.description, l.address, l.created_at, l.area,
               a.rooms, a.floor,
               h.floors, h.plot_size
        FROM listings l
        LEFT JOIN apartment_details a ON l.id = a.listing_id
        LEFT JOIN house_details h ON l.id = h.listing_id
        WHERE {' AND '.join(filters)}
        ORDER BY l.created_at DESC
    """, params)

    listings = []
    for row in cur.fetchall():
        (
            id, title, type_, city, price, status, desc, address, created_at, area,
            apt_rooms, apt_floor,
            house_floors, plot_size
        ) = row

        listing = {
            "id": id, "title": title, "type": type_, "city": city,
            "price": price, "status": status, "description": desc,
            "address": address, "created_at": created_at.strftime("%Y-%m-%d %H:%M"),
            "area": area
        }

        if type_ == "квартира":
            listing.update({"rooms": apt_rooms, "floor": apt_floor})
        elif type_ == "дом":
            listing.update({"floors": house_floors, "plot_size": plot_size})

        listings.append(listing)

    cur.close()
    conn.close()
    return jsonify(listings)

@listings_bp.route("/api/listings", methods=["POST"])
def create_listing():
    user_id, _ = get_current_user()
    if not user_id:
        return jsonify({"error": "Не авторизован"}), 401

    data = request.get_json()
    error = validate_listing_data(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""INSERT INTO listings (user_id, title, type, city, price, description, status, address, area)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (user_id, data["title"], data["type"], data["city"],
                     data["price"], data.get("description"), data.get("status"), data["address"], data["area"]))
        listing_id = cur.fetchone()[0]
        save_listing_details(cur, listing_id, data["type"], data)
        conn.commit()
        return jsonify({"message": "Объявление добавлено"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@listings_bp.route("/api/listings/<int:listing_id>", methods=["PUT"])
def update_listing(listing_id):
    user_id, _ = get_current_user()
    if not user_id:
        return jsonify({"error": "Не авторизован"}), 401

    data = request.get_json()
    error = validate_listing_data(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""UPDATE listings SET title = %s, type = %s, city = %s, price = %s,
                       description = %s, status = %s, address = %s, area = %s
                       WHERE id = %s AND user_id = %s""",
                    (data["title"], data["type"], data["city"], data["price"],
                     data.get("description"), data.get("status"), data["address"], data["area"],
                     listing_id, user_id))

        delete_listing_details(cur, listing_id)
        save_listing_details(cur, listing_id, data["type"], data)
        conn.commit()
        return jsonify({"message": "Объявление обновлено"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@listings_bp.route("/api/listings/<int:listing_id>", methods=["DELETE"])
def delete_listing(listing_id):
    user_id, _ = get_current_user()
    if not user_id:
        return jsonify({"error": "Не авторизован"}), 401

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        delete_listing_details(cur, listing_id)
        cur.execute("DELETE FROM listings WHERE id = %s AND user_id = %s", (listing_id, user_id))
        conn.commit()
        return jsonify({"message": "Удалено"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
