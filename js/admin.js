// ==================== js/admin.js - Admin Dashboard Trang Trại Xanh ====================

let editingProductId = null;
let selectedFiles = [];
let currentOrderData = null;   // Dùng để in hóa đơn

// ==================== CHECK LOGIN ====================
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

// ==================== LOGOUT ====================
function logoutAdmin() {
    if (confirm("Bạn có chắc muốn đăng xuất Admin?")) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminName');
        window.location.href = "admin-login.html";
    }
}

// ==================== TABS ====================
function switchTab(tab) {
    document.getElementById('tabProducts').classList.toggle('active', tab === 1);
    document.getElementById('tabOrders').classList.toggle('active', tab === 2);
    document.getElementById('contentProducts').classList.toggle('hidden', tab !== 1);
    document.getElementById('contentOrders').classList.toggle('hidden', tab !== 2);
}

// ==================== LOAD CATEGORIES ====================
async function loadCategories() {
    try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;

        const select = document.getElementById('prodCategory');
        select.innerHTML = '<option value="">Chọn danh mục</option>';
        data.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Lỗi load danh mục:", err);
    }
}

// ==================== IMAGE PREVIEW ====================
function setupImagePreview() {
    const fileInput = document.getElementById('prodImageFile');
    fileInput.addEventListener('change', (e) => {
        selectedFiles = [...selectedFiles, ...Array.from(e.target.files)];
        renderImagePreview();
    });
}

function renderImagePreview() {
    const container = document.getElementById('imagePreview');
    container.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const div = document.createElement('div');
            div.className = 'preview-item relative';
            div.innerHTML = `
                <img src="${ev.target.result}" class="w-full h-32 object-cover rounded-xl border border-emerald-200">
                <button onclick="removeFile(${index})" 
                        class="remove-btn absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none hover:bg-red-600">
                    ×
                </button>
            `;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    renderImagePreview();
};

// ==================== UPLOAD IMAGES ====================
async function uploadImages(files) {
    const urls = [];
    for (const file of files) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file, { upsert: true });

            if (uploadError) continue;

            const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            urls.push(urlData.publicUrl);
        } catch (err) {
            console.error("Upload failed:", err);
        }
    }
    return urls;
}

// ==================== SAVE PRODUCT ====================
async function saveProduct() {
    const name = document.getElementById('prodName').value.trim();
    const category_id = document.getElementById('prodCategory').value;
    let priceInput = document.getElementById('prodPrice').value.trim();
    const short_desc = document.getElementById('prodShortDesc').value.trim();
    const description = document.getElementById('prodDescription').value.trim();

    if (!name || !category_id) {
        alert("Vui lòng nhập tên sản phẩm và chọn danh mục!");
        return;
    }

    const price = (priceInput && !['liên hệ', 'lien he', 'lienhe'].includes(priceInput.toLowerCase())) 
                  ? parseFloat(priceInput) : null;

    try {
        let imageUrls = [];
        if (selectedFiles.length > 0) {
            imageUrls = await uploadImages(selectedFiles);
        }

        const productData = {
            name: name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            category_id: parseInt(category_id),
            price: price,
            short_desc: short_desc || null,
            description: description || null,
            image_url: imageUrls[0] || null,
            image_gallery: imageUrls.length > 0 ? imageUrls : null,
            updated_at: new Date().toISOString()
        };

        if (editingProductId) {
            const { error } = await supabase.from('products').update(productData).eq('id', editingProductId);
            if (error) throw error;
            alert("✅ Cập nhật sản phẩm thành công!");
        } else {
            const { error } = await supabase.from('products').insert([productData]);
            if (error) throw error;
            alert("✅ Thêm sản phẩm mới thành công!");
        }

        resetForm();
        loadAdminProducts();

    } catch (err) {
        console.error(err);
        alert("❌ Lỗi khi lưu sản phẩm: " + (err.message || "Vui lòng kiểm tra lại"));
    }
}

// ==================== EDIT & DELETE PRODUCT ====================
async function editProduct(id) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .eq('id', id)
            .single();

        if (error) throw error;

        editingProductId = id;
        document.getElementById('formTitle').textContent = 'Sửa Sản Phẩm';

        document.getElementById('prodName').value = data.name || '';
        document.getElementById('prodCategory').value = data.category_id || '';
        document.getElementById('prodPrice').value = data.price || 'Liên hệ';
        document.getElementById('prodShortDesc').value = data.short_desc || '';
        document.getElementById('prodDescription').value = data.description || '';

        selectedFiles = [];
        document.getElementById('imagePreview').innerHTML = '';

        const images = data.image_gallery || (data.image_url ? [data.image_url] : []);
        images.forEach(url => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${url}" class="w-full h-32 object-cover rounded-xl">`;
            document.getElementById('imagePreview').appendChild(div);
        });

    } catch (err) {
        alert("Không tìm thấy sản phẩm!");
    }
}

async function deleteProduct(id) {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        alert("✅ Đã xóa sản phẩm!");
        loadAdminProducts();
    } catch (err) {
        alert("Lỗi khi xóa: " + err.message);
    }
}

function resetForm() {
    editingProductId = null;
    selectedFiles = [];
    document.getElementById('formTitle').textContent = 'Thêm Sản Phẩm Mới';
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodShortDesc').value = '';
    document.getElementById('prodDescription').value = '';
    document.getElementById('prodImageFile').value = '';
    document.getElementById('imagePreview').innerHTML = '';
}

// ==================== LOAD PRODUCTS ====================
async function loadAdminProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('productTableBody');
        tbody.innerHTML = '';

        data.forEach(p => {
            const imgSrc = p.image_gallery?.[0] || p.image_url || 'https://picsum.photos/id/237/80/80';
            const priceDisplay = p.price 
                ? Number(p.price).toLocaleString('vi-VN') + ' ₫' 
                : '<span class="text-orange-600 font-medium">Liên hệ</span>';

            const row = document.createElement('tr');
            row.className = "border-b hover:bg-emerald-50";
            row.innerHTML = `
                <td class="py-4 px-6"><img src="${imgSrc}" width="70" class="rounded-lg object-cover"></td>
                <td class="py-4 px-6 font-medium">${p.name}</td>
                <td class="py-4 px-6">${p.categories?.name || '—'}</td>
                <td class="py-4 px-6 text-right">${priceDisplay}</td>
                <td class="py-4 px-6 text-center">
                    <button onclick="editProduct('${p.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm mr-2">Sửa</button>
                    <button onclick="deleteProduct('${p.id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm">Xóa</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Lỗi load sản phẩm:", err);
    }
}

// ==================== LOAD ORDERS ====================
async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                customer_name,
                phone,
                address,
                quantity,
                total_amount,
                status,
                note,
                created_at,
                products (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('orderTableBody');
        tbody.innerHTML = '';

        data.forEach(order => {
            const productName = order.products ? order.products.name : '—';
            const total = order.total_amount 
                ? Number(order.total_amount).toLocaleString('vi-VN') + ' ₫' 
                : '—';

            const statusHTML = {
                'pending': '<span class="status-badge bg-yellow-100 text-yellow-700">Chờ xử lý</span>',
                'confirmed': '<span class="status-badge bg-blue-100 text-blue-700">Đã xác nhận</span>',
                'shipping': '<span class="status-badge bg-emerald-100 text-emerald-700">Đang giao</span>',
                'completed': '<span class="status-badge bg-teal-100 text-teal-700">Hoàn thành</span>',
                'cancelled': '<span class="status-badge bg-red-100 text-red-700">Đã hủy</span>'
            }[order.status] || '<span class="status-badge bg-gray-100 text-gray-700">Không rõ</span>';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-5 px-6 font-medium text-sm">${order.id}</td>
                <td class="py-5 px-6">${order.customer_name}</td>
                <td class="py-5 px-6">${order.phone}</td>
                <td class="py-5 px-6 text-sm">${order.address || '—'}</td>
                <td class="py-5 px-6 text-right font-medium">${total}</td>
                <td class="py-5 px-6 text-center">${statusHTML}</td>
                <td class="py-5 px-6 text-sm">${new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td class="py-5 px-6 text-center">
                    <button onclick="viewOrderDetail(${order.id})" class="text-emerald-600 hover:underline text-sm">Chi tiết</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Lỗi load đơn hàng:", err);
        const tbody = document.getElementById('orderTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-red-500">Lỗi tải đơn hàng: ${err.message}</td></tr>`;
    }
}

// ==================== XEM CHI TIẾT & IN HÓA ĐƠN ====================
window.viewOrderDetail = async (orderId) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                products (
                    name,
                    price
                )
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;

        currentOrderData = data;

        // Gọi hàm hiển thị modal từ admin.html
        if (typeof showOrderDetailModal === 'function') {
            showOrderDetailModal(data);
        } else {
            alert("Chức năng xem chi tiết đang được cập nhật. Mã đơn: #" + orderId);
        }
    } catch (err) {
        alert("Không thể tải chi tiết đơn hàng: " + err.message);
    }
};

// Hàm in hóa đơn (được gọi từ admin.html)
window.printInvoice = function() {
    if (!currentOrderData) return;

    const printWindow = window.open('', '_blank');
    const statusText = {
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        shipping: 'Đang giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy'
    }[currentOrderData.status] || currentOrderData.status;

    printWindow.document.write(`
        <html>
        <head>
            <title>Hóa đơn #${currentOrderData.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #f0f9f0; }
                .total { font-size: 1.2em; font-weight: bold; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>TRANG TRẠI XANH</h1>
                <p>Biofarm Energy • Hóa đơn bán hàng</p>
                <p>Mã đơn: #${currentOrderData.id}</p>
            </div>
            
            <p><strong>Khách hàng:</strong> ${currentOrderData.customer_name}</p>
            <p><strong>SĐT:</strong> ${currentOrderData.phone}</p>
            <p><strong>Địa chỉ:</strong> ${currentOrderData.address || 'Không có'}</p>
            <p><strong>Ngày tạo:</strong> ${new Date(currentOrderData.created_at).toLocaleString('vi-VN')}</p>
            
            <table>
                <tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
                <tr>
                    <td>${currentOrderData.products ? currentOrderData.products.name : '—'}</td>
                    <td>${currentOrderData.quantity}</td>
                    <td>${currentOrderData.products && currentOrderData.products.price ? Number(currentOrderData.products.price).toLocaleString('vi-VN') + ' ₫' : '—'}</td>
                    <td>${currentOrderData.total_amount ? Number(currentOrderData.total_amount).toLocaleString('vi-VN') + ' ₫' : '—'}</td>
                </tr>
            </table>
            
            <div class="total">Tổng tiền: ${currentOrderData.total_amount ? Number(currentOrderData.total_amount).toLocaleString('vi-VN') + ' ₫' : '—'}</div>
            
            <p style="margin-top: 50px; text-align: center;">Cảm ơn quý khách đã mua hàng tại Trang Trại Xanh!</p>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 600);
};

// ==================== KHỞI CHẠY ====================
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminLogin()) return;

    await loadCategories();
    await loadAdminProducts();
    await loadOrders();
    setupImagePreview();

    switchTab(1);
});

// Export các hàm cho HTML
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.resetForm = resetForm;
window.logoutAdmin = logoutAdmin;
window.switchTab = switchTab;
window.loadOrders = loadOrders;