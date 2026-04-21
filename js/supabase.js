// js/supabase.js - Khởi tạo Supabase Client

const SUPABASE_URL = 'https://frivjaxzghatqwwrfxhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaXZqYXh6Z2hhdHF3d3JmeGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Mjk4MTAsImV4cCI6MjA5MTMwNTgxMH0.yDy6IXnB74hIoPlqJAgQOE7DE-fUerjXcFrBYbcrreo';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabase = supabaseClient;

console.log('✅ Supabase đã khởi tạo thành công');

// ==================== CẬP NHẬT GIAO DIỆN AUTH ====================
function updateAuthUI(session) {
    const authContainer = document.querySelector('.auth-button-container');
    if (!authContainer) return;

    if (session) {
        const user = session.user;
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Người dùng';

        authContainer.innerHTML = `
            <div class="auth-user">
                <span>Xin chào, <strong>${fullName}</strong></span>
                <button onclick="logout()" class="btn-auth">Đăng xuất</button>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <a href="auth.html" class="btn-auth">
                <i class="fas fa-user"></i> Đăng nhập
            </a>
        `;
    }
}

// ==================== ĐĂNG XUẤT ====================
async function logout() {
    await supabase.auth.signOut();
    alert("Đã đăng xuất thành công!");
    window.location.reload();
}

// ==================== KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP ====================
async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    updateAuthUI(session);
}

// Tự động chạy khi trang load
document.addEventListener('DOMContentLoaded', checkAuthStatus);