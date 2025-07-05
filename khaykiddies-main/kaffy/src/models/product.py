from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)  # Keep for backward compatibility
    image_urls = db.Column(db.Text, nullable=True)  # JSON string for multiple images
    category = db.Column(db.String(50), nullable=True)
    in_stock = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_image_urls(self):
        """Get list of image URLs"""
        if self.image_urls:
            try:
                return json.loads(self.image_urls)
            except:
                return []
        elif self.image_url:
            return [self.image_url]
        return []

    def set_image_urls(self, urls):
        """Set multiple image URLs"""
        if urls and len(urls) > 0:
            self.image_urls = json.dumps(urls[:4])  # Limit to 4 images
            self.image_url = urls[0]  # Set first image as primary for backward compatibility
        else:
            self.image_urls = None
            self.image_url = None

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image_url': self.image_url,
            'image_urls': self.get_image_urls(),
            'category': self.category,
            'in_stock': self.in_stock,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Product {self.name}>'

