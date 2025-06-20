from getpass import getpass
from werkzeug.security import generate_password_hash
from db import get_db_connection


# Скрипт для добавления пользователя
def main():
    print("Добавление нового пользователя")
    username = input("Логин: ").strip()
    name = input("Имя: ").strip()

    while True:
        password = getpass("Пароль: ").strip()
        confirm = getpass("Повторите пароль: ").strip()
        if password != confirm:
            print("Пароли не совпадают. Попробуйте снова.")
        elif not password:
            print("Пароль не может быть пустым.")
        else:
            break

    hashed_password = generate_password_hash(password)

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Проверка уникальности логина
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            print(f"Пользователь с логином '{username}' уже существует.")
        else:
            cur.execute(
                "INSERT INTO users (username, password, name) VALUES (%s, %s, %s)",
                (username, hashed_password, name)
            )
            conn.commit()
            print("Пользователь успешно добавлен!")

        cur.close()
        conn.close()

    except Exception as e:
        print("Ошибка:", e)

if __name__ == "__main__":
    main()
