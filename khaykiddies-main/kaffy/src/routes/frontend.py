from flask import Blueprint, jsonify
from src.models.product import Product

frontend_bp = Blueprint('frontend', __name__)

@frontend_bp.route('/products-data', methods=['GET'])
def get_products_data():
    """Get formatted product data for the frontend"""
    try:
        products = Product.query.all()
        formatted_products = []
        
        for product in products:
            formatted_product = {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'category': product.category,
                'inStock': product.in_stock,
                'imageUrl': product.image_url,
                'imageUrls': product.get_image_urls(),
                'createdAt': product.created_at.isoformat() if product.created_at else None,
                'updatedAt': product.updated_at.isoformat() if product.updated_at else None
            }
            formatted_products.append(formatted_product)
        
        # Get unique categories
        categories = list(set(p.category for p in products if p.category))
        
        return jsonify({
            'products': formatted_products,
            'categories': categories,
            'stats': {
                'total': len(products),
                'inStock': sum(1 for p in products if p.in_stock),
                'outOfStock': sum(1 for p in products if not p.in_stock),
                'categories': len(categories)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

