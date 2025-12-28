import React, { useState } from 'react';
import { Button } from './Button'; 
import { User } from '../types';
import { getApiUrl } from '../utils/api';   

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hàm validation
  const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === '') return 'Vui lòng nhập email.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email không hợp lệ.';
    if (email.length > 100) return 'Email quá dài.';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password || password.trim() === '') return 'Vui lòng nhập mật khẩu.';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (password.length > 50) return 'Mật khẩu quá dài.';
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name || name.trim() === '') return 'Vui lòng nhập họ tên.';
    const trimmedName = name.trim();
    if (trimmedName.length < 2) return 'Họ tên quá ngắn.';
    if (trimmedName.length > 50) return 'Họ tên quá dài.';
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(trimmedName)) return 'Họ tên chỉ được chứa chữ cái.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    // 1. Validate phía Client
    if (isRegistering) {
      const nameError = validateName(name);
      if (nameError) {
        setIsLoading(false);
        setError(nameError);
        return;
      }
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setIsLoading(false);
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setIsLoading(false);
      setError(passwordError);
      return;
    }

    try {
      // 2. Gọi API Serverless
      const res = await fetch(getApiUrl('/api/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegistering ? 'register' : 'login',
          email,
          password,
          name: isRegistering ? name : undefined,
        }),
      });

      // Xử lý response text/json an toàn
      const contentType = res.headers.get('content-type');
      let data: any = {};
      let responseText = '';

      try {
        responseText = await res.text();
        if (contentType && contentType.includes('application/json')) {
          if (responseText) data = JSON.parse(responseText);
        } else {
            throw new Error(`Lỗi server (${res.status}): ${responseText.substring(0, 100)}`);
        }
      } catch (err: any) {
        throw new Error(err.message || 'Không đọc được phản hồi từ server');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || `Lỗi ${res.status}`);
      }

      // 3. Xử lý thành công
      if (isRegistering) {
        setSuccessMsg(data.message || 'Đăng ký thành công!');
        setIsRegistering(false);
        setEmail('');
        setPassword('');
        setName('');
      } else {
        // --- ĐOẠN CODE QUAN TRỌNG ĐÃ SỬA ---
        if (!data.user) throw new Error('Dữ liệu người dùng lỗi');
        
        const user: User = {
          id: data.user.id,      // <-- Lấy ID từ server trả về
          email: data.user.email,
          name: data.user.name,
        };
        onLogin(user);
        // -----------------------------------
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fashion-accent/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fashion-accent/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-xl z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-fashion-accent rounded-full flex items-center justify-center text-white font-serif font-bold text-3xl shadow-[0_0_15px_rgba(212,175,55,0.4)] mb-4">A</div>
            <h1 className="text-2xl font-serif text-fashion-black tracking-wide">ATHEA Creative</h1>
            <p className="text-xs text-fashion-accent uppercase tracking-widest mt-1">Trợ Lý Thời Trang AI</p>
        </div>

        <h2 className="text-xl text-fashion-black font-medium mb-6 text-center border-b border-gray-200 pb-4">
          {isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
        </h2>

        {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded text-center">{successMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Họ và Tên</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-fashion-black focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 outline-none transition-all" placeholder="Nhập họ tên" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-fashion-black focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 outline-none transition-all" placeholder="name@company.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-fashion-black focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 outline-none transition-all" placeholder="••••••••" />
          </div>

          {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded border border-red-200">{error}</div>}

          <Button type="submit" isLoading={isLoading} className="w-full mt-4">
            {isRegistering ? 'Tạo Tài Khoản' : 'Đăng Nhập'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button onClick={() => { setIsRegistering(!isRegistering); setError(null); setSuccessMsg(null); }} className="ml-2 text-fashion-accent hover:underline font-medium">
              {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>
      </div>
      <p className="text-gray-500 text-xs mt-8 absolute bottom-4">© 2024 ATHEA AI. All rights reserved.</p>
    </div>
  );
};