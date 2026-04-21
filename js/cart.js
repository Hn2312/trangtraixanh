// js/cart.js - Quản lý giỏ hàng + Đặt hàng

let cart = [];

// ==================== LOAD & RENDER GIỎ HÀNG ====================
function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartContainer');
    const checkoutForm = document.getElementById('checkoutForm');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng của bạn đang trống</h3>
                <a href="products.html" class="btn">Tiếp tục mua sắm →</a>
            </div>
        `;
        if (checkoutForm) checkoutForm.style.display = 'none';
        updateCartCount();
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        html += `
            <div class="cart-item">
                <img src="${item.image || '/images/default-product.jpg'}" alt="${item.name}">
                <div class="cart-item-info">
                    <strong>${item.name}</strong><br>
                    <small>${item.price.toLocaleString('vi-VN')} VNĐ</small>
                </div>
                <div class="cart-quantity">
                    <button onclick="changeQuantity(${index}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-total">
                    ${itemTotal.toLocaleString('vi-VN')} VNĐ
                </div>
                <button onclick="removeFromCart(${index})" class="remove-btn">×</button>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('totalAmount').textContent = total.toLocaleString('vi-VN') + ' VNĐ';
    if (checkoutForm) checkoutForm.style.display = 'block';

    updateCartCount();
}

// ==================== THAY ĐỔI SỐ LƯỢNG & XÓA ====================
function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    saveCart();
    renderCart();
}

function removeFromCart(index) {
    if (confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
        cart.splice(index, 1);
        saveCart();
        renderCart();
    }
}

// ==================== LƯU GIỎ HÀNG ====================
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ==================== CẬP NHẬT SỐ LƯỢNG ICON ====================
function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        countEl.textContent = totalItems;
    }
}

// ==================== XÁC NHẬN ĐẶT HÀNG ====================
async function submitOrder() {
    const fullName = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!fullName || !phone || !address) {
        alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ!");
        return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('orders').insert({
            user_id: user ? user.id : null,
            full_name: fullName,
            phone: phone,
            address: address,
            total_amount: totalAmount,
            status: 'pending',
            items: cart
        });

        if (error) throw error;

        alert("✅ Đặt hàng thành công! Cảm ơn bạn đã mua hàng tại Trang Trại Xanh.");

        // Xóa giỏ hàng
        localStorage.removeItem('cart');
        window.location.href = "order-history.html";

    } catch (err) {
        console.error(err);
        alert("Đặt hàng thất bại: " + err.message);
    }
}

// ==================== KHỞI CHẠY ====================
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateCartCount();
});

// Export các hàm ra global
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;
window.submitOrder = submitOrder;