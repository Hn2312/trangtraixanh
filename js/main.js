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

// Render sản phẩm nổi bật
function renderFeaturedProducts(products) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666;">
                Hiện chưa có sản phẩm. Vui lòng thêm sản phẩm trong Admin.
            </p>
        `;
        return;
    }

    products.forEach(p => {
        const price = Number(p.price) || 0;
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
                <p class="product-price">${price.toLocaleString('vi-VN')} VNĐ</p>
                ${shortDesc ? `<p class="product-desc">${shortDesc}</p>` : ''}
                
                <div class="product-actions">
                    <button onclick="showProductDetail('${p.id}')" class="btn-detail">Xem chi tiết</button>
                    <button onclick="addToCart('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${price}, '${p.image_url || ''}')" class="btn-cart">
                        Thêm giỏ hàng
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Khởi chạy trang chủ
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();

    // Cập nhật số lượng giỏ hàng
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = total;
});