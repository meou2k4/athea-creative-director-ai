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
      // 2. Local Authentication (Development mode - không cần API)
      // Lưu users vào localStorage
      const storageKey = 'athea_local_users';
      let users: Array<{email: string, password: string, name: string, status: string}> = [];
      
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          users = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading users from localStorage', e);
      }

      if (isRegistering) {
        // Đăng ký
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          setIsLoading(false);
          setError('Email này đã được đăng ký');
          return;
        }

        // Thêm user mới
        users.push({
          email,
          password, // Trong production nên hash password
          name,
          status: 'APPROVED' // Auto approve trong dev mode
        });
        localStorage.setItem(storageKey, JSON.stringify(users));
        
        setSuccessMsg('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
        setIsRegistering(false);
        setEmail('');
        setPassword('');
        setName('');
      } else {
        // Đăng nhập
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          setIsLoading(false);
          setError('Sai email hoặc mật khẩu');
          return;
        }

        if (user.status !== 'APPROVED') {
          setIsLoading(false);
          setError(`Tài khoản đang ở trạng thái: ${user.status}. Vui lòng liên hệ Admin.`);
          return;
        }

        // Đăng nhập thành công
        const userData: User = {
          email: user.email,
          name: user.name,
        };
        onLogin(userData);
      }

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fashion-accent/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fashion-accent/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-xl z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-fashion-accent rounded-full flex items-center justify-center text-white font-serif font-bold text-3xl shadow-[0_0_15px_rgba(212,175,55,0.4)] mb-4">A</div>
            <h1 className="text-2xl font-serif text-fashion-black tracking-wide">ATHEA Creative</h1>
            <p className="text-xs text-fashion-accent uppercase tracking-widest mt-1">Trợ Lý Thời Trang AI</p>
        </div>

        <h2 className="text-xl text-fashion-black font-medium mb-6 text-center border-b border-gray-200 pb-4">
          {isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
        </h2>

        {/* Thông báo thành công (khi vừa đăng ký xong) */}
        {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded text-center">
                {successMsg}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Họ và Tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-fashion-black placeholder-gray-400 focus:outline-none focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 transition-all"
                placeholder="Nhập họ tên của bạn"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-fashion-black placeholder-gray-400 focus:outline-none focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-fashion-black placeholder-gray-400 focus:outline-none focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded border border-red-200">
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
          <p className="text-sm text-gray-600">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccessMsg(null);
              }}
              className="ml-2 text-fashion-accent hover:underline font-medium"
            >
              {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>
      </div>
      
      <p className="text-gray-500 text-xs mt-8 absolute bottom-4">© 2024 ATHEA AI. All rights reserved.</p>
    </div>
  );
};