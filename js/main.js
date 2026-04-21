// js/main.js - Trang chủ

// Load Sản phẩm nổi bật (lấy từ tất cả sản phẩm, không cần is_featured)
async function loadFeaturedProducts() {
    try {
        const { data, error } = await window.supabase
            .from('products')
            .select(`
                *,
                categories (name)
            `)
            .eq('is_available', true)
            .limit(6)                    // Hiển thị 6 sản phẩm nổi bật
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Lỗi tải sản phẩm nổi bật:', error);
            return;
        }

        renderFeaturedProducts(data || []);

    } catch (err) {
        console.error('Lỗi load sản phẩm nổi bật:', err);
    }
}

// ==================== RENDER SẢN PHẨM NỔI BẬT (ĐÃ SỬA) ====================
function renderFeaturedProducts(products) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666;">
                Hiện chưa có sản phẩm nổi bật. Vui lòng thêm sản phẩm trong Admin.
            </p>
        `;
        return;
    }

    products.forEach(p => {
        // Xử lý hiển thị giá (hỗ trợ chữ "Liên hệ")
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
            : (p.description ? p.description.substring(0, 85) + '...' : '');

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image_url || '/images/default-product.jpg'}" 
                 alt="${p.name}" loading="lazy">

            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="product-price">${priceHTML}</p>
                ${shortDesc ? `<p class="product-desc">${shortDesc}</p>` : ''}
                
                <div class="product-actions">
                    <!-- Chỉ giữ nút Xem chi tiết, chuyển sang trang products.html -->
                    <button onclick="viewProductDetail('${p.id}')" class="btn-detail">Xem chi tiết</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Hàm chuyển sang trang products.html với ID sản phẩm
function viewProductDetail(productId) {
    window.location.href = `products.html?product=${productId}`;
}

// Khởi chạy trang chủ
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();

    // Nếu có giỏ hàng thì cập nhật số lượng (nếu còn giữ)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = total;
});