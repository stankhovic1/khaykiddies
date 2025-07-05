from functools import wraps
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

# In a real application, this should be stored in a database
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = generate_password_hash('admin123')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized access'}), 401
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD, password):
        session['admin_logged_in'] = True
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/check-auth', methods=['GET'])
def check_auth():
    return jsonify({'authenticated': session.get('admin_logged_in', False)})