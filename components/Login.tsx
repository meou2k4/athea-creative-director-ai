import React, { useState } from 'react';
import { Button } from './Button'; // Giữ nguyên component Button của bạn
import { User } from '../types';   // Giữ nguyên type User của bạn

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    // 1. Validate cơ bản phía Client
    if (!email || !password) {
      setIsLoading(false);
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (isRegistering && !name) {
      setIsLoading(false);
      setError("Vui lòng nhập họ tên.");
      return;
    }

    try {
      // 2. Gọi API Serverless của Vercel (file api/auth.js)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isRegistering ? 'register' : 'login',
          email,
          password,
          name: isRegistering ? name : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Nếu API trả về lỗi (400, 401, 403...)
        throw new Error(data.message || 'Có lỗi xảy ra');
      }

      // 3. Xử lý thành công
      if (isRegistering) {
        // Đăng ký thành công -> Thông báo chờ duyệt
        setSuccessMsg(data.message); // "Đăng ký thành công! Vui lòng chờ Admin duyệt."
        setIsRegistering(false);     // Chuyển về form đăng nhập
        setEmail('');
        setPassword('');
        setName('');
      } else {
        // Đăng nhập thành công -> Vào app
        const user: User = {
          email: data.user.email,
          name: data.user.name,
        };
        onLogin(user);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#0f0f0f] border border-gray-800 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-serif font-bold text-3xl shadow-[0_0_15px_rgba(212,175,55,0.4)] mb-4">A</div>
            <h1 className="text-2xl font-serif text-white tracking-wide">ATHEA Creative</h1>
            <p className="text-xs text-brand-gold uppercase tracking-widest mt-1">Trợ Lý Thời Trang AI</p>
        </div>

        <h2 className="text-xl text-white font-medium mb-6 text-center border-b border-gray-800 pb-4">
          {isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
        </h2>

        {/* Thông báo thành công (khi vừa đăng ký xong) */}
        {successMsg && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800 text-green-400 text-sm rounded text-center">
                {successMsg}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Họ và Tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                placeholder="Nhập họ tên của bạn"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/10 p-2 rounded border border-red-900/30">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            isLoading={isLoading} 
            className="w-full mt-4"
          >
            {isRegistering ? 'Tạo Tài Khoản' : 'Đăng Nhập'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccessMsg(null);
              }}
              className="ml-2 text-brand-gold hover:underline font-medium"
            >
              {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>
      </div>
      
      <p className="text-gray-600 text-xs mt-8 absolute bottom-4">© 2024 ATHEA AI. All rights reserved.</p>
    </div>
  );
};