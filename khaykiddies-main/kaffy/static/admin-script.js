// Authentication state
let isAuthenticated = false;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/check-auth');
        const data = await response.json();
        isAuthenticated = data.authenticated;
        updateUIBasedOnAuth();
    } catch (error) {
        console.error('Error checking authentication:', error);
        showLoginModal();
    }
});

// Login form handling
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success) {
            isAuthenticated = true;
            updateUIBasedOnAuth();
            loadDashboardData();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Logout handling
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        isAuthenticated = false;
        updateUIBasedOnAuth();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// UI update based on authentication
function updateUIBasedOnAuth() {
    const loginModal = document.getElementById('loginModal');
    const dashboard = document.getElementById('dashboard');

    if (isAuthenticated) {
        loginModal.style.display = 'none';
        dashboard.style.display = 'block';
    } else {
        loginModal.style.display = 'block';
        dashboard.style.display = 'none';
    }
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

let currentPage = 1;
let currentFilters = {
    category: '',
    search: '',
    min_price: '',
    max_price: '',
    in_stock: '',
    sort_by: 'id',
    order: 'asc',
    per_page: 10
};

// Load dashboard data
async function loadDashboardData() {
    if (!isAuthenticated) return;

    try {
        const queryParams = new URLSearchParams({
            ...currentFilters,
            page: currentPage
        });

        const [productsResponse, statsResponse] = await Promise.all([
            fetch(`/api/products?${queryParams}`, { credentials: 'include' }),
            fetch('/api/products/stats', { credentials: 'include' })
        ]);

        const productsData = await productsResponse.json();
        const statsData = await statsResponse.json();

        // Update statistics
        document.getElementById('totalProducts').textContent = statsData.total_products;
        document.getElementById('inStock').textContent = statsData.in_stock_count;
        document.getElementById('categories').textContent = Object.keys(statsData.categories).length;

        // Update category filter
        const filterCategory = document.getElementById('filterCategory');
        filterCategory.innerHTML = '<option value="">All Categories</option>';
        Object.entries(statsData.categories).forEach(([category, count]) => {
            filterCategory.innerHTML += `<option value="${category}">${category} (${count})</option>`;
        });

        // Update price range if available
        if (statsData.price_stats) {
            document.getElementById('minPrice').min = statsData.price_stats.min;
            document.getElementById('minPrice').max = statsData.price_stats.max;
            document.getElementById('maxPrice').min = statsData.price_stats.min;
            document.getElementById('maxPrice').max = statsData.price_stats.max;
        }

        // Populate product table and update pagination
        updateProductTable(productsData.products);
        updatePagination(productsData.total, productsData.pages, productsData.current_page);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateFilters(key, value) {
    currentFilters[key] = value;
    currentPage = 1; // Reset to first page when filters change
    loadDashboardData();
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage > 0) {
        currentPage = newPage;
        loadDashboardData();
    }
}

function updatePagination(total, totalPages, currentPage) {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    // Calculate range of pages to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Always show first page
    if (startPage > 1) {
        pageNumbers.innerHTML += `<button onclick="currentPage=1;loadDashboardData()">1</button>`;
        if (startPage > 2) pageNumbers.innerHTML += '<span>...</span>';
    }
    
    // Show page numbers
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.innerHTML += `
            <button 
                onclick="currentPage=${i};loadDashboardData()"
                class="${i === currentPage ? 'active' : ''}"
            >${i}</button>
        `;
    }
    
    // Always show last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.innerHTML += '<span>...</span>';
        pageNumbers.innerHTML += `<button onclick="currentPage=${totalPages};loadDashboardData()">${totalPages}</button>`;
    }
    
    // Update button states
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function updateProductTable(products) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px;"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.in_stock ? 'Yes' : 'No'}</td>
            <td>
                <button onclick="editProduct(${product.id})" class="btn btn-secondary">Edit</button>
                <button onclick="showDeleteModal(${product.id})" class="btn btn-danger">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Product search functionality
document.getElementById('searchProduct').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.getElementById('productTableBody').getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const name = row.cells[2].textContent.toLowerCase();
        row.style.display = name.includes(searchTerm) ? '' : 'none';
    });
});

// Category filter functionality
document.getElementById('filterCategory').addEventListener('change', (e) => {
    const category = e.target.value;
    const rows = document.getElementById('productTableBody').getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const rowCategory = row.cells[3].textContent;
        row.style.display = !category || rowCategory === category ? '' : 'none';
    });
});

// Product form handling
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        in_stock: document.getElementById('productStock').checked,
        image_urls: document.getElementById('productImages').value.split('\n').filter(url => url.trim())
    };

    const productId = document.getElementById('productId').value;
    const method = productId ? 'PUT' : 'POST';
    const url = productId ? `/api/products/${productId}` : '/api/products';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });

        if (response.ok) {
            document.getElementById('productModal').style.display = 'none';
            loadDashboardData();
        } else {
            alert('Error saving product');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product');
    }
});

// Bulk product import handling
document.getElementById('bulkImportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('bulkImportFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }

    try {
        const content = await file.text();
        const products = JSON.parse(content);
        
        if (!Array.isArray(products)) {
            throw new Error('File content must be an array of products');
        }

        const response = await fetch('/api/products/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products }),
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Successfully imported ${result.imported_count} products`);
            document.getElementById('bulkImportModal').style.display = 'none';
            loadDashboardData();
        } else {
            throw new Error('Bulk import failed');
        }
    } catch (error) {
        console.error('Bulk import error:', error);
        alert('Error importing products: ' + error.message);
    }
});

// Export products function
function exportProducts() {
    const queryParams = new URLSearchParams(currentFilters);
    fetch(`/products?${queryParams}`)
        .then(response => response.json())
        .then(data => {
            const products = data.products;
            const exportData = JSON.stringify(products, null, 2);
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products_export.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error exporting products:', error);
            alert('Error exporting products: ' + error.message);
        });
}

// Add product button
document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').style.display = 'block';
});

// Edit product
async function editProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`, {
            credentials: 'include'
        });
        const product = await response.json();

        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').checked = product.in_stock;
        document.getElementById('productImages').value = product.image_urls.join('\n');

        document.getElementById('productModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Error loading product');
    }
}

// Delete product
let productToDelete = null;

function showDeleteModal(id) {
    productToDelete = id;
    document.getElementById('deleteModal').style.display = 'block';
}

document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (!productToDelete) return;

    try {
        const response = await fetch(`/api/products/${productToDelete}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            document.getElementById('deleteModal').style.display = 'none';
            loadDashboardData();
        } else {
            alert('Error deleting product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }

    productToDelete = null;
});

// Modal close buttons
document.querySelectorAll('.close, #cancelDelete').forEach(button => {
    button.addEventListener('click', () => {
        document.getElementById('productModal').style.display = 'none';
        document.getElementById('deleteModal').style.display = 'none';
    });
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

