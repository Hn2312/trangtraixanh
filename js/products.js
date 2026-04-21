// js/products.js - Load sản phẩm, tìm kiếm, modal và giỏ hàng

let currentProduct = null;
let allProducts = [];

// ==================== LOAD TẤT CẢ SẢN PHẨM ====================
async function loadAllProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (name)
            `)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Lỗi tải sản phẩm:', error);
            return;
        }

        allProducts = data || [];
        renderProducts(allProducts);

    } catch (err) {
        console.error('Lỗi load sản phẩm:', err);
    }
}

// ==================== RENDER DANH SÁCH SẢN PHẨM ====================
// ==================== RENDER DANH SÁCH SẢN PHẨM (SỬA LỖI NaN) ====================
function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `<p class="no-result">Không tìm thấy sản phẩm nào phù hợp.</p>`;
        return;
    }

    products.forEach(p => {
        // Xử lý hiển thị giá thông minh
        let priceHTML = '';
        if (!p.price || p.price === '' || p.price === null) {
            priceHTML = '<span style="color:#006400; font-weight:600;">Liên hệ</span>';
        } else {
            const numPrice = Number(p.price);
            if (isNaN(numPrice)) {
                priceHTML = '<span style="color:#006400; font-weight:600;">Liên hệ</span>';
            } else {
                priceHTML = numPrice.toLocaleString('vi-VN') + ' VNĐ';
            }
        }

        const shortDesc = p.short_desc 
            ? p.short_desc 
            : (p.description ? p.description.substring(0, 95) + '...' : 'Đang cập nhật mô tả...');

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image_url || '/images/default-product.jpg'}" 
                 alt="${p.name}" 
                 loading="lazy">

            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="product-price">${priceHTML}</p>
                <p class="product-desc">${shortDesc}</p>
                
                <div class="product-actions">
                    <button onclick="showProductDetail('${p.id}')" class="btn-detail">Xem chi tiết</button>
                    <button onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${Number(p.price) || 0}, '${p.image_url || ''}')" class="btn-cart">
                        Thêm giỏ hàng
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==================== TÌM KIẾM SẢN PHẨM ====================
function searchProducts() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!keyword) {
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(keyword)
    );

    renderProducts(filtered);
}

// ==================== HIỂN THỊ MODAL CHI TIẾT (SỬA GIÁ) ====================
async function showProductDetail(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (name)
            `)
            .eq('id', productId)
            .single();

        if (error || !data) {
            alert("Không tìm thấy sản phẩm!");
            return;
        }

        currentProduct = data;

        // Hiển thị ảnh
        document.getElementById('modalImage').src = data.image_url || '/images/default-product.jpg';

        // Tên và danh mục
        document.getElementById('modalName').textContent = data.name;
        document.getElementById('modalCategory').textContent = data.categories?.name || 'Không có danh mục';

        // ==================== SỬA PHẦN GIÁ ====================
        let priceHTML = '';
        if (!data.price || data.price === '' || data.price === null) {
            priceHTML = 'Liên hệ';
        } else {
            const numPrice = Number(data.price);
            if (isNaN(numPrice)) {
                priceHTML = 'Liên hệ';
            } else {
                priceHTML = numPrice.toLocaleString('vi-VN') + ' VNĐ';
            }
        }
        document.getElementById('modalPrice').innerHTML = `<strong>${priceHTML}</strong>`;

        // Mô tả
        document.getElementById('modalDescription').textContent = 
            data.description || data.short_desc || 'Chưa có mô tả chi tiết.';

        // Hiển thị modal
        document.getElementById('productModal').style.display = 'flex';

    } catch (err) {
        console.error(err);
        alert("Có lỗi khi tải chi tiết sản phẩm.");
    }
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

// ==================== THÊM VÀO GIỎ HÀNG TỪ MODAL ====================
function addToCartFromModal() {
    if (!currentProduct) return;
    addToCart(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.image_url || '');
    closeModal();
}

// ==================== THÊM VÀO GIỎ HÀNG (YÊU CẦU ĐĂNG NHẬP) ====================
async function addToCart(productId, productName, price, image = '') {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        window.location.href = "auth.html";
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: Number(price),
            quantity: 1,
            image: image
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    alert(`✅ Đã thêm "${productName}" vào giỏ hàng!`);
    updateCartCount();
}

// ==================== CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG ====================
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = totalItems;
}

// ==================== KHỞI CHẠY ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAllProducts();
    updateCartCount();

    // Nhấn Enter để tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
});

// Export các hàm ra global
window.showProductDetail = showProductDetail;
window.closeModal = closeModal;
window.addToCartFromModal = addToCartFromModal;
window.addToCart = addToCart;
window.searchProducts = searchProducts;