// js/order-history.js - Lịch sử đặt hàng của khách hàng

async function loadOrderHistory() {
    const container = document.getElementById('orderHistoryContainer');
    if (!container) return;

    try {
        // Lấy thông tin user hiện tại
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Vui lòng <a href="auth.html">đăng nhập</a> để xem lịch sử đặt hàng.</p>
                </div>
            `;
            return;
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>Bạn chưa có đơn hàng nào</h3>
                    <a href="products.html" class="btn">Tiếp tục mua sắm →</a>
                </div>
            `;
            return;
        }

        let html = '';

        orders.forEach(order => {
            const statusClass = {
                'pending': 'status-pending',
                'confirmed': 'status-confirmed',
                'shipping': 'status-shipping',
                'completed': 'status-completed',
                'cancelled': 'status-cancelled'
            }[order.status] || 'status-pending';

            const statusText = {
                'pending': 'Đang chờ xử lý',
                'confirmed': 'Đã xác nhận',
                'shipping': 'Đang giao hàng',
                'completed': 'Hoàn thành',
                'cancelled': 'Đã hủy'
            }[order.status] || 'Đang chờ xử lý';

            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    itemsHtml += `
                        <div class="order-item">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    `;
                });
            }

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Mã đơn: #${order.id.slice(0,8).toUpperCase()}</strong><br>
                            <small>${new Date(order.created_at).toLocaleDateString('vi-VN')}</small>
                        </div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    
                    <div class="order-total">
                        Tổng tiền: <strong>${Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <p class="error-message">Có lỗi khi tải lịch sử đơn hàng. Vui lòng thử lại sau.</p>
        `;
    }
}

// ==================== KHỞI CHẠY ====================
document.addEventListener('DOMContentLoaded', loadOrderHistory);