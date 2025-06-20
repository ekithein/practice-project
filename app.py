from flask import Flask
import os
from dotenv import load_dotenv
from routes.auth import auth_bp
from routes.pages import pages_bp
from routes.listings import listings_bp
from routes.analytics import analytics_bp

load_dotenv(".env")
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret")

# Регистрация маршрутов
app.register_blueprint(auth_bp)
app.register_blueprint(pages_bp)
app.register_blueprint(listings_bp)
app.register_blueprint(analytics_bp)

if __name__ == "__main__":
    app.run(debug=True)
