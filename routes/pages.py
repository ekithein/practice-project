from flask import Blueprint, render_template, session, redirect
from utils.helpers import is_authenticated

pages_bp = Blueprint("pages", __name__)

@pages_bp.route("/dashboard")
def dashboard():
    return render_template("index.html", name=session.get("name")) if is_authenticated() else redirect("/")

@pages_bp.route("/dashboard/analytics")
def analytics_page():
    return render_template("analytics.html", name=session.get("name")) if is_authenticated() else redirect("/")