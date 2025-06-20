from flask import Blueprint, request, render_template, session, redirect
from db import get_db_connection
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/")
def login_form():
    return render_template("login.html")

@auth_bp.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, password FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user and check_password_hash(user[2], password):
        session.update({"user_id": user[0], "name": user[1]})
        return redirect("/dashboard")
    return render_template("login.html", error="Неверный логин или пароль")

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect("/")