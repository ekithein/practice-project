from flask import session

# Утилиты
def is_authenticated():
    return 'user_id' in session

def get_current_user():
    return session.get("user_id"), session.get("name")

def validate_fields(data, fields):
    return all(data.get(f) for f in fields)

def fetch_listing_details(cur, listing_id, type_):
    table = "apartment_details" if type_ == "квартира" else "house_details"
    fields = {
        "квартира": "area, rooms, floor",
        "дом": "area, floors, plot_size"
    }
    cur.execute(f"SELECT {fields[type_]} FROM {table} WHERE listing_id = %s", (listing_id,))
    return cur.fetchone()

def save_listing_details(cur, listing_id, type_, data):
    if type_ == "квартира":
        cur.execute("""INSERT INTO apartment_details (listing_id, area, rooms, floor)
                       VALUES (%s, %s, %s, %s)""",
                    (listing_id, data.get("area"), data.get("rooms"), data.get("floor")))
    elif type_ == "дом":
        cur.execute("""INSERT INTO house_details (listing_id, area, floors, plot_size)
                       VALUES (%s, %s, %s, %s)""",
                    (listing_id, data.get("area"), data.get("floors"), data.get("plot_size")))

def delete_listing_details(cur, listing_id):
    cur.execute("DELETE FROM apartment_details WHERE listing_id = %s", (listing_id,))
    cur.execute("DELETE FROM house_details WHERE listing_id = %s", (listing_id,))

def validate_listing_data(data):
    required_fields = ["title", "type", "city", "price", "address"]
    if not all(data.get(f) for f in required_fields):
        return "Обязательные поля не заполнены"

    if data["type"] not in ["квартира", "дом"]:
        return "Недопустимый тип недвижимости"

    try:
        price = int(data["price"])
        if price <= 0:
            return "Цена должна быть положительным числом"
    except (TypeError, ValueError):
        return "Некорректная цена"

    status = data.get("status", "активен")
    if status not in ["активен", "скрыт", "продано"]:
        return "Недопустимый статус"

    if data["type"] == "квартира":
        for field in ["area", "rooms", "floor"]:
            if data.get(field) is None:
                return f"Для типа 'квартира' необходимо указать поле '{field}'"
            try:
                val = int(data[field])
                if val <= 0:
                    return f"Поле '{field}' должно быть положительным числом"
            except ValueError:
                return f"Поле '{field}' должно быть числом"

    elif data["type"] == "дом":
        for field in ["area", "floors", "plot_size"]:
            if data.get(field) is None:
                return f"Для типа 'дом' необходимо указать поле '{field}'"
            try:
                val = int(data[field])
                if val <= 0:
                    return f"Поле '{field}' должно быть положительным числом"
            except ValueError:
                return f"Поле '{field}' должно быть числом"

    return None  
