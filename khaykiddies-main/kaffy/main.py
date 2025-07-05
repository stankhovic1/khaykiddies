import os
import sys
from datetime import timedelta

# Adjusted sys.path for Render deployment
sys.path.insert(0, os.path.dirname(__file__)) # This adds the 'kaffy' directory to sys.path

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.product import db, Product
from src.routes.user import user_bp
from src.routes.product import product_bp
from src.routes.frontend import frontend_bp
from src.routes.auth import auth_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Security configurations
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Enable CORS with security settings
CORS(app, supports_credentials=True)

# Database configuration
if os.environ.get('DATABASE_URL'):
    # Use PostgreSQL in production
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace('postgres://', 'postgresql://')
else:
    # Use SQLite in development
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(product_bp, url_prefix='/api')
app.register_blueprint(frontend_bp, url_prefix='/api')

# Static file routes
@app.route("/")
def serve_admin():
    return send_from_directory(app.static_folder, "admin.html")

@app.route("/website")
def serve_website():
    return send_from_directory(app.static_folder, "website.html")

@app.route("/<path:path>")
def serve_static(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return "File not found", 404

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if running in production
    is_production = os.environ.get('RENDER', False)
    
    if is_production:
        # Production settings
        app.config['SESSION_COOKIE_SECURE'] = True
        port = int(os.environ.get('PORT', 5002))
        app.run(host='0.0.0.0', port=port)
    else:
        # Development settings
        app.config['SESSION_COOKIE_SECURE'] = False
        app.run(host='0.0.0.0', port=5002, debug=True)
