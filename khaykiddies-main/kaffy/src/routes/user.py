from flask import Blueprint, jsonify

user_bp = Blueprint('user', __name__)

@user_bp.route('/user-info', methods=['GET'])
def get_user_info():
    """Placeholder for user info endpoint"""
    return jsonify({
        'success': True,
        'message': 'User authentication not implemented yet'
    })