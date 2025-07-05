from flask import Blueprint, request, jsonify
from src.models.product import db, Product
from src.routes.auth import login_required

product_bp = Blueprint('product', __name__)

@product_bp.route('/products', methods=['GET'])
def get_products():
    try:
        # Get query parameters
        category = request.args.get('category')
        search = request.args.get('search')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        in_stock = request.args.get('in_stock', type=lambda v: v.lower() == 'true' if v else None)
        sort_by = request.args.get('sort_by', 'id')
        order = request.args.get('order', 'asc')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # Build query
        query = Product.query

        # Apply filters
        if category:
            query = query.filter(Product.category == category)
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.category.ilike(search_term)
                )
            )
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        if in_stock is not None:
            query = query.filter(Product.in_stock == in_stock)

        # Apply sorting
        if hasattr(Product, sort_by):
            sort_column = getattr(Product, sort_by)
            if order == 'desc':
                sort_column = sort_column.desc()
            query = query.order_by(sort_column)

        # Apply pagination
        paginated_products = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'products': [product.to_dict() for product in paginated_products.items],
            'total': paginated_products.total,
            'pages': paginated_products.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        return jsonify(product.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/bulk', methods=['POST'])
@login_required
def bulk_create_products():
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'error': 'Expected an array of products'}), 400

        products = []
        for item in data:
            # Validate required fields
            if not all(field in item for field in ['name', 'price']):
                return jsonify({'error': 'Each product must have name and price'}), 400

            # Create product
            product = Product(
                name=item['name'],
                description=item.get('description', ''),
                price=float(item['price']),
                category=item.get('category', ''),
                in_stock=item.get('in_stock', True)
            )

            # Handle image URLs
            image_urls = item.get('image_urls', [])
            if image_urls:
                product.set_image_urls(image_urls)
                product.image_url = image_urls[0]

            products.append(product)

        db.session.bulk_save_objects(products)
        db.session.commit()

        return jsonify({
            'message': f'{len(products)} products created successfully',
            'products': [product.to_dict() for product in products]
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/stats', methods=['GET'])
def get_product_stats():
    try:
        total_products = Product.query.count()
        in_stock_count = Product.query.filter_by(in_stock=True).count()
        categories = db.session.query(Product.category, db.func.count(Product.id)).\
            group_by(Product.category).all()
        price_stats = db.session.query(
            db.func.min(Product.price),
            db.func.max(Product.price),
            db.func.avg(Product.price)
        ).first()

        return jsonify({
            'total_products': total_products,
            'in_stock_count': in_stock_count,
            'out_of_stock_count': total_products - in_stock_count,
            'categories': dict(categories),
            'price_stats': {
                'min': float(price_stats[0]) if price_stats[0] else 0,
                'max': float(price_stats[1]) if price_stats[1] else 0,
                'average': float(price_stats[2]) if price_stats[2] else 0
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products', methods=['POST'])
@login_required
def create_product():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create new product
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            category=data.get('category', ''),
            in_stock=data.get('in_stock', True)
        )
        
        # Handle image URLs
        image_urls = data.get('image_urls', [])
        if image_urls:
            product.set_image_urls(image_urls)
            product.image_url = image_urls[0]  # Set primary image
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['PUT'])
@login_required
def update_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'category' in data:
            product.category = data['category']
        if 'in_stock' in data:
            product.in_stock = data['in_stock']
        
        # Update image URLs
        if 'image_urls' in data:
            product.set_image_urls(data['image_urls'])
            if data['image_urls']:
                product.image_url = data['image_urls'][0]
        
        db.session.commit()
        return jsonify(product.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500