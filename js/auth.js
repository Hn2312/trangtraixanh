// js/auth.js - Đăng nhập / Đăng ký người dùng

// ==================== ĐĂNG KÝ TÀI KHOẢN ====================
async function registerUser() {
    if (!window.supabase) {
        alert("Supabase chưa được khởi tạo!");
        return;
    }

    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!email || !password || !fullName) {
        alert("Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu!");
        return;
    }

    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }

    try {
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { 
                    full_name: fullName, 
                    phone: phone 
                }
            }
        });

        if (error) {
            console.error(error);
            alert("Đăng ký thất bại: " + error.message);
        } else {
            alert("✅ Đăng ký thành công!\n\nBạn có thể đăng nhập ngay bây giờ.");
            showLogin();
        }
    } catch (err) {
        alert("Có lỗi xảy ra: " + err.message);
    }
}

// ==================== ĐĂNG NHẬP ====================
async function loginUser() {
    if (!window.supabase) {
        alert("Lỗi: Supabase chưa được khởi tạo!");
        return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert("Vui lòng nhập Email và Mật khẩu!");
        return;
    }

    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert("Đăng nhập thất bại: " + error.message);
        } else {
            alert("✅ Đăng nhập thành công! Chào mừng bạn đến với Trang Trại Xanh.");
            window.location.href = "index.html";
        }
    } catch (err) {
        alert("Có lỗi xảy ra: " + err.message);
    }
}

// ==================== CHUYỂN ĐỔI GIỮA TAB ĐĂNG NHẬP / ĐĂNG KÝ ====================
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    
    // Cập nhật tab active
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    
    // Cập nhật tab active
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('tabRegister').classList.add('active');
}

// Export các hàm ra global để HTML gọi được
window.registerUser = registerUser;
window.loginUser = loginUser;
window.showLogin = showLogin;
window.showRegister = showRegister;