// js/admin.js - Phiên bản sửa lỗi logoutAdmin và insert 400

let editingProductId = null;
let selectedFiles = [];

// ==================== CHECK LOGIN ====================
function checkAdminLogin() {
    if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
        alert("Bạn chưa đăng nhập Admin!");
        window.location.href = "admin-login.html";
        return false;
    }
    document.getElementById('adminName').textContent = `Xin chào, ${localStorage.getItem('adminName') || 'Admin'}`;
    return true;
}

// ==================== LOGOUT ADMIN ====================
function logoutAdmin() {
    if (confirm("Đăng xuất Admin?")) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminName');
        window.location.href = "admin-login.html";
    }
}

// ==================== TABS ====================
function switchTab(tab) {
    document.getElementById('tabProducts').classList.toggle('active', tab === 1);
    document.getElementById('tabOrders').classList.toggle('active', tab === 2);
    document.getElementById('contentProducts').style.display = tab === 1 ? 'block' : 'none';
    document.getElementById('contentOrders').style.display = tab === 2 ? 'block' : 'none';
}

// ==================== LOAD CATEGORIES ====================
async function loadCategories() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) return console.error(error);

    const select = document.getElementById('prodCategory');
    select.innerHTML = '<option value="">Chọn danh mục</option>';
    data.forEach(cat => select.add(new Option(cat.name, cat.id)));
}

// ==================== PREVIEW ẢNH ====================
function setupImagePreview() {
    document.getElementById('prodImageFile').addEventListener('change', (e) => {
        selectedFiles = [...selectedFiles, ...Array.from(e.target.files)];
        renderPreview();
    });
}

function renderPreview() {
    const container = document.getElementById('imagePreview');
    container.innerHTML = '';
    selectedFiles.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${ev.target.result}"><button class="remove-btn" onclick="removeFile(${i})">×</button>`;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    renderPreview();
};

// ==================== UPLOAD ẢNH ====================
async function uploadImages(files) {
    const urls = [];
    for (const file of files) {
        try {
            const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, file);
            if (error) {
                console.error("Upload lỗi:", error);
                continue;
            }
            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            urls.push(data.publicUrl);
        } catch (err) {
            console.error(err);
        }
    }
    return urls;
}

// ==================== SAVE PRODUCT (đã tối ưu tránh lỗi 400) ====================
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

    const priceValue = (priceInput && !['liên hệ', 'lien he', 'lienhe'].includes(priceInput.toLowerCase())) 
                       ? priceInput : null;

    try {
        let imageUrls = [];
        if (selectedFiles.length > 0) {
            imageUrls = await uploadImages(selectedFiles);
        }

        const productData = {
            name: name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            category_id: parseInt(category_id),
            price: priceValue,
            short_desc: short_desc || null,
            description: description || null,
            image_url: imageUrls[0] || null,
            image_gallery: imageUrls.length > 1 ? imageUrls : null,
            updated_at: new Date().toISOString()
        };

        if (editingProductId) {
            await supabase.from('products').update(productData).eq('id', editingProductId);
            alert("✅ Cập nhật sản phẩm thành công!");
        } else {
            await supabase.from('products').insert([productData]);
            alert("✅ Thêm sản phẩm mới thành công!");
        }

        resetForm();
        loadAdminProducts();

    } catch (err) {
        console.error("Lỗi lưu sản phẩm:", err);
        alert("Lỗi khi lưu: " + (err.message || "Kiểm tra lại Policy bucket hoặc ràng buộc bảng products"));
    }
}

// ==================== EDIT PRODUCT ====================
async function editProduct(id) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return alert("Không tìm thấy sản phẩm");

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
        div.innerHTML = `<img src="${url}">`;
        document.getElementById('imagePreview').appendChild(div);
    });
}

// ==================== DELETE & RESET ====================
async function deleteProduct(id) {
    if (!confirm("Xóa sản phẩm này?")) return;
    await supabase.from('products').delete().eq('id', id);
    alert("✅ Đã xóa sản phẩm!");
    loadAdminProducts();
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
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    if (error) return console.error(error);

    const tbody = document.querySelector('#productTable tbody');
    tbody.innerHTML = '';

    data.forEach(p => {
        const imgSrc = p.image_gallery?.[0] || p.image_url || 'https://picsum.photos/70/70';
        const priceDisplay = p.price ? Number(p.price).toLocaleString('vi-VN') + ' VNĐ' : '<strong>Liên hệ</strong>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${imgSrc}" width="70" style="border-radius:8px; object-fit:cover;"></td>
            <td>${p.name}</td>
            <td>${p.categories?.name || '—'}</td>
            <td>${priceDisplay}</td>
            <td>
                <button onclick="editProduct('${p.id}')" style="background:#228B22;color:white;border:none;padding:6px 12px;border-radius:6px;margin-right:5px;">Sửa</button>
                <button onclick="deleteProduct('${p.id}')" style="background:#ff4757;color:white;border:none;padding:6px 12px;border-radius:6px;">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== KHỞI CHẠY ====================
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminLogin()) return;
    await loadCategories();
    await loadAdminProducts();
    setupImagePreview();
    switchTab(1);
});

// Export tất cả hàm
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.resetForm = resetForm;
window.logoutAdmin = logoutAdmin;
window.switchTab = switchTab;