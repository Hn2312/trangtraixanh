// js/admin.js - Quản lý Admin Dashboard (Sản phẩm + Đơn hàng)

let editingProductId = null;
let currentTab = 1;

// ==================== KIỂM TRA ĐĂNG NHẬP ADMIN ====================
function checkAdminLogin() {
    if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
        alert("Bạn chưa đăng nhập Admin!");
        window.location.href = "admin-login.html";
        return false;
    }
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = `Xin chào, ${localStorage.getItem('adminName') || 'Admin'}`;
    }
    return true;
}

// ==================== CHUYỂN TAB ====================
function switchTab(tab) {
    currentTab = tab;
    
    document.getElementById('tabProducts').classList.toggle('active', tab === 1);
    document.getElementById('tabOrders').classList.toggle('active', tab === 2);
    
    document.getElementById('contentProducts').style.display = tab === 1 ? 'block' : 'none';
    document.getElementById('contentOrders').style.display = tab === 2 ? 'block' : 'none';

    if (tab === 2) loadAllOrders();
}

// ==================== LOAD DANH MỤC ====================
async function loadCategories() {
    try {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;

        const select = document.getElementById('prodCategory');
        select.innerHTML = '<option value="">Chọn danh mục</option>';

        data.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Lỗi load categories:", err);
    }
}

// ==================== PREVIEW ẢNH ====================
function setupImagePreview() {
    const fileInput = document.getElementById('prodImageFile');
    if (!fileInput) return;

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(ev) {
            const previewImg = document.getElementById('previewImg');
            const imagePreview = document.getElementById('imagePreview');
            if (previewImg && imagePreview) {
                previewImg.src = ev.target.result;
                imagePreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    });
}

// ==================== LOAD DANH SÁCH SẢN PHẨM ====================
async function loadAdminProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`*, categories(name)`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.querySelector('#productTable tbody');
        tbody.innerHTML = '';

        data.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${p.image_url || '/images/default-product.jpg'}" width="60" style="border-radius:6px;"></td>
                <td>${p.name}</td>
                <td>${p.categories?.name || '—'}</td>
                <td>${Number(p.price).toLocaleString('vi-VN')} VNĐ</td>
                <td>
                    <button onclick="editProduct('${p.id}')" class="btn-action btn-edit">Sửa</button>
                    <button onclick="deleteProduct('${p.id}')" class="btn-action btn-delete">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Lỗi load sản phẩm:", err);
    }
}

// ==================== LƯU / CẬP NHẬT SẢN PHẨM ====================
async function saveProduct() {
    const name = document.getElementById('prodName').value.trim();
    const categoryId = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const shortDesc = document.getElementById('prodShortDesc').value.trim();
    const description = document.getElementById('prodDescription').value.trim();
    const fileInput = document.getElementById('prodImageFile');

    if (!name || !categoryId || !price) {
        alert("Vui lòng điền đầy đủ Tên sản phẩm, Danh mục và Giá!");
        return;
    }

    try {
        let imageUrl = null;

        // Upload ảnh nếu có chọn file
        if (fileInput.files[0]) {
            const file = fileInput.files[0];
            const fileName = `${Date.now()}-${file.name}`;
            
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (error) throw error;

            imageUrl = supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
        }

        const productData = {
            name,
            category_id: categoryId,
            price,
            short_desc: shortDesc,
            description,
            image_url: imageUrl,
            is_available: true,
            is_featured: false
        };

        if (editingProductId) {
            // Cập nhật
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', editingProductId);
            
            if (error) throw error;
            alert("✅ Cập nhật sản phẩm thành công!");
        } else {
            // Thêm mới
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            alert("✅ Thêm sản phẩm mới thành công!");
        }

        resetForm();
        loadAdminProducts();

    } catch (err) {
        console.error(err);
        alert("Lỗi khi lưu sản phẩm: " + err.message);
    }
}

// ==================== SỬA SẢN PHẨM ====================
async function editProduct(id) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        editingProductId = id;
        document.getElementById('formTitle').textContent = 'Sửa Sản Phẩm';
        document.getElementById('prodName').value = data.name;
        document.getElementById('prodCategory').value = data.category_id;
        document.getElementById('prodPrice').value = data.price;
        document.getElementById('prodShortDesc').value = data.short_desc || '';
        document.getElementById('prodDescription').value = data.description || '';

        if (data.image_url) {
            document.getElementById('previewImg').src = data.image_url;
            document.getElementById('imagePreview').style.display = 'block';
        }

    } catch (err) {
        alert("Không thể tải thông tin sản phẩm để sửa.");
    }
}

// ==================== XÓA SẢN PHẨM ====================
async function deleteProduct(id) {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert("✅ Đã xóa sản phẩm!");
        loadAdminProducts();
    } catch (err) {
        alert("Lỗi khi xóa sản phẩm: " + err.message);
    }
}

// ==================== LÀM MỚI FORM ====================
function resetForm() {
    editingProductId = null;
    document.getElementById('formTitle').textContent = 'Thêm Sản Phẩm Mới';
    document.getElementById('editId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodShortDesc').value = '';
    document.getElementById('prodDescription').value = '';
    document.getElementById('prodImageFile').value = '';
    document.getElementById('imagePreview').style.display = 'none';
}

// ==================== LOAD ĐƠN HÀNG ====================
async function loadAllOrders() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.querySelector('#orderTable tbody');
        tbody.innerHTML = '';

        orders.forEach(order => {
            const statusClass = {
                'pending': 'status-pending',
                'confirmed': 'status-confirmed',
                'shipping': 'status-shipping',
                'completed': 'status-completed',
                'cancelled': 'status-cancelled'
            }[order.status] || 'status-pending';

            const statusText = {
                'pending': 'Đang chờ',
                'confirmed': 'Đã xác nhận',
                'shipping': 'Đang giao',
                'completed': 'Hoàn thành',
                'cancelled': 'Đã hủy'
            }[order.status] || 'Đang chờ';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id.slice(0,8).toUpperCase()}</td>
                <td>${order.full_name}</td>
                <td>${order.phone}</td>
                <td style="max-width:250px;">${order.address}</td>
                <td style="font-weight:700;">${Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</td>
                <td><span class="order-status ${statusClass}">${statusText}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                    <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Đang chờ</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Xác nhận</option>
                        <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Hủy</option>
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Lỗi load đơn hàng:", err);
    }
}

// ==================== CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ====================
async function updateOrderStatus(orderId, newStatus) {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) throw error;
        alert("Đã cập nhật trạng thái đơn hàng!");
        loadAllOrders();
    } catch (err) {
        alert("Cập nhật thất bại: " + err.message);
    }
}

// ==================== ĐĂNG XUẤT ADMIN ====================
function logoutAdmin() {
    if (confirm("Đăng xuất Admin?")) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminName');
        window.location.href = "admin-login.html";
    }
}

// ==================== KHỞI CHẠY ====================
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminLogin()) return;

    await loadCategories();
    await loadAdminProducts();
    setupImagePreview();

    // Mặc định mở tab Sản phẩm
    switchTab(1);
});

// Export các hàm ra global
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.resetForm = resetForm;
window.logoutAdmin = logoutAdmin;
window.switchTab = switchTab;
window.updateOrderStatus = updateOrderStatus;