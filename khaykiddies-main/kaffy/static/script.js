// Global variables
let cart = JSON.parse(localStorage.getItem('kiddiesCart')) || [];
let isCartOpen = false;

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateCartDisplay();
    initializeImageLoading();
    initializeNavigation();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Close mobile menu if open
                document.querySelector('.nav-links').classList.remove('active');
            }
        });
    });
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.nav').offsetHeight;
        const sectionTop = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Search functionality
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const productCards = document.querySelectorAll('.product-card');
    
    if (!searchTerm) {
        productCards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    productCards.forEach(card => {
        const productName = card.getAttribute('data-name').toLowerCase();
        const productTitle = card.querySelector('h3').textContent.toLowerCase();
        const productDescription = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || 
            productTitle.includes(searchTerm) || 
            productDescription.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Scroll to products section
    scrollToSection('products');
}

// Add event listener for Enter key in search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
});

// Cart functionality
function addToCart(name, price, image) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    updateCartCount();
    updateCartDisplay();
    saveCart();
    showCartNotification(name);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartCount();
    updateCartDisplay();
    saveCart();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartCount();
            updateCartDisplay();
            saveCart();
        }
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '0';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₦${item.price.toLocaleString()}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = total.toLocaleString();
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    isCartOpen = !isCartOpen;
    
    if (isCartOpen) {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function saveCart() {
    localStorage.setItem('kiddiesCart', JSON.stringify(cart));
}

function showCartNotification(productName) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #06d6a0;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = `${productName} added to cart!`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsList = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
    
    const message = `Hello! I would like to order the following items from KHAY KIDDIES STORES:\n\n${itemsList}\n\nTotal: ₦${total.toLocaleString()}\n\nPlease let me know how to proceed with the payment and delivery.`;
    
    const whatsappUrl = `https://wa.me/2349123703546?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Quick view functionality
function quickView(productId) {
    const productData = {
        'children-tab': {
            name: 'Children\'s Tablet',
            price: '₦10,000',
            description: 'Educational tablet designed specifically for kids with parental controls, educational apps, and durable design. Perfect for learning and entertainment.',
            features: ['Parental Controls', 'Educational Apps', 'Durable Design', 'Kid-Safe Browser']
        },
        'play-mat': {
            name: 'Kids Play Mat',
            price: '₦15,500',
            description: 'Interactive road map play mat that encourages imaginative play. Large size perfect for multiple children to play together.',
            features: ['Large Size', 'Interactive Design', 'Easy to Clean', 'Non-Slip Bottom']
        },
        'toy-bag': {
            name: 'Toy Storage Bag',
            price: '₦10,000',
            description: 'Convenient storage solution that doubles as a play mat. Transforms from storage bag to play surface in seconds.',
            features: ['Dual Purpose', 'Easy Storage', 'Durable Material', 'Large Capacity']
        }
    };
    
    const product = productData[productId];
    if (!product) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 100%;
            position: relative;
        ">
            <button onclick="this.closest('div').parentElement.remove()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            ">×</button>
            <h2 style="color: #444; margin-bottom: 15px; font-family: 'Quicksand', sans-serif;">${product.name}</h2>
            <div style="color: #ff91a4; font-size: 1.5rem; font-weight: bold; margin-bottom: 20px;">${product.price}</div>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${product.description}</p>
            <h4 style="color: #444; margin-bottom: 10px;">Features:</h4>
            <ul style="color: #666; margin-bottom: 25px;">
                ${product.features.map(feature => `<li style="margin-bottom: 5px;">✓ ${feature}</li>`).join('')}
            </ul>
            <button onclick="addToCart('${product.name}', ${parseInt(product.price.replace(/[₦,]/g, ''))}, 'images/${productId.replace('-', '_')}.${productId === 'play-mat' ? 'jpg' : productId === 'toy-bag' ? 'jpeg' : 'png'}'); this.closest('div').parentElement.remove();" style="
                width: 100%;
                background: linear-gradient(135deg, #ff91a4, #ff7a8a);
                color: white;
                border: none;
                padding: 15px;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                font-size: 1.1rem;
            ">Add to Cart</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Contact form functionality
function submitContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Create WhatsApp message
    const whatsappMessage = `Hello! I'm ${name} (${email}). ${message}`;
    const whatsappUrl = `https://wa.me/2349123703546?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #06d6a0;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    successMessage.textContent = 'Message sent! We\'ll get back to you soon.';
    
    document.body.appendChild(successMessage);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        document.body.removeChild(successMessage);
    }, 3000);
    
    // Reset form
    event.target.reset();
}

// Image loading optimization
function initializeImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                    });
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
        });
    }
}

// Scroll-based navigation highlighting
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Close cart with Escape key
    if (e.key === 'Escape' && isCartOpen) {
        toggleCart();
    }
    
    // Search with Ctrl+F or Cmd+F (prevent default and focus search)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Performance optimization: Debounce search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to search
const debouncedSearch = debounce(searchProducts, 300);

// Update search input to use debounced search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debouncedSearch);
    }
});

// Add smooth animations for better UX
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll('.product-card, .testimonial-card, .about-text, .contact-form');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize scroll animations when DOM is loaded
document.addEventListener('DOMContentLoaded', addScrollAnimations);

