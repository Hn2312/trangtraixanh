// js/admin-auth.js - Đăng nhập Admin

// ==================== ĐĂNG NHẬP ADMIN ====================
async function loginAdmin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập tên đăng nhập và mật khẩu!");
        return;
    }

    try {
        // Sử dụng RPC để kiểm tra tài khoản admin (an toàn hơn)
        const { data, error } = await supabase.rpc('check_admin_login', {
            input_username: username,
            input_password: password
        });

        if (error) {
            console.error("Lỗi RPC:", error);
            alert("Lỗi hệ thống! Vui lòng thử lại sau.");
            return;
        }

        if (data && data.length > 0) {
            const user = data[0];

            // Lưu thông tin admin vào localStorage
            localStorage.setItem('isAdminLoggedIn', 'true');
            localStorage.setItem('adminName', user.full_name || 'Admin');

            alert("✅ Đăng nhập Admin thành công!");
            window.location.href = "admin.html";
        } else {
            alert("❌ Sai tên đăng nhập hoặc mật khẩu!");
        }

    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi đăng nhập Admin.");
    }
}

// ==================== KIỂM TRA ĐĂNG NHẬP ADMIN (dùng trong admin.html) ====================
function checkAdminLogin() {
    if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
        alert("Bạn chưa đăng nhập Admin!");
        window.location.href = "admin-login.html";
        return false;
    }
    return true;
}

// Export các hàm ra global
window.loginAdmin = loginAdmin;
window.checkAdminLogin = checkAdminLogin;