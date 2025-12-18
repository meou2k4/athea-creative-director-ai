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

  // Hàm validation
  const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === '') {
      return 'Vui lòng nhập email.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.';
    }
    if (email.length > 100) {
      return 'Email không được vượt quá 100 ký tự.';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password || password.trim() === '') {
      return 'Vui lòng nhập mật khẩu.';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (password.length > 50) {
      return 'Mật khẩu không được vượt quá 50 ký tự.';
    }
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name || name.trim() === '') {
      return 'Vui lòng nhập họ tên.';
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return 'Họ tên phải có ít nhất 2 ký tự.';
    }
    if (trimmedName.length > 50) {
      return 'Họ tên không được vượt quá 50 ký tự.';
    }
    // Chỉ cho phép chữ cái, khoảng trắng, dấu tiếng Việt
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(trimmedName)) {
      return 'Họ tên chỉ được chứa chữ cái và khoảng trắng.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    // 1. Validate phía Client
    if (isRegistering) {
      // Validate name
      const nameError = validateName(name);
      if (nameError) {
        setIsLoading(false);
        setError(nameError);
        return;
      }
    }

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setIsLoading(false);
      setError(emailError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setIsLoading(false);
      setError(passwordError);
      return;
    }

    try {
      // 2. Gọi API Serverless để xử lý đăng nhập/đăng ký với Google Sheets
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

      // Kiểm tra response có content không
      const contentType = res.headers.get('content-type');
      let data: any = {};
      let responseText = '';

      try {
        responseText = await res.text();
        
        if (contentType && contentType.includes('application/json')) {
          if (responseText) {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError, 'Response text:', responseText);
              throw new Error(`Phản hồi từ server không hợp lệ: ${responseText.substring(0, 200)}`);
            }
          }
        } else {
          // Response không phải JSON (có thể là HTML error page)
          if (res.status === 404) {
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            if (isProduction) {
              throw new Error(`API endpoint không tìm thấy. Vui lòng kiểm tra cấu hình Vercel và đảm bảo file api/auth.js tồn tại.`);
            } else {
              throw new Error(`Server không tìm thấy endpoint. Vui lòng kiểm tra:\n1. Server có đang chạy tại http://localhost:3001?\n2. Chạy lệnh: npm run dev:server\n3. Kiểm tra: http://localhost:3001/api/health`);
            }
          }
          throw new Error(`Server trả về lỗi ${res.status}: ${responseText.substring(0, 200)}`);
        }
      } catch (textError: any) {
        // Nếu lỗi khi đọc text, có thể là network error
        if (textError.message) {
          throw textError;
        }
        throw new Error('Không thể đọc phản hồi từ server. Vui lòng kiểm tra server có đang chạy không.');
      }

      if (!res.ok) {
        // Xử lý lỗi 404 đặc biệt
        if (res.status === 404) {
          const errorMsg = data.message || data.error || 'Endpoint không tồn tại';
          const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
          if (isProduction) {
            throw new Error(`${errorMsg}\n\nVui lòng kiểm tra:\n1. File api/auth.js có tồn tại trong project?\n2. Cấu hình Vercel có đúng không?\n3. Environment variables đã được set trong Vercel chưa?`);
          } else {
            throw new Error(`${errorMsg}\n\nVui lòng kiểm tra:\n1. Server có đang chạy tại http://localhost:3001?\n2. Chạy lệnh: npm run dev:server\n3. Kiểm tra: http://localhost:3001/api/health`);
          }
        }
        
        // Nếu API trả về lỗi (400, 401, 403, 500...)
        const errorMsg = data.message || data.error || `Lỗi ${res.status}: ${res.statusText}`;
        const errorDetails = data.details ? `\n\nChi tiết: ${data.details}` : '';
        const fullError = `${errorMsg}${errorDetails}`;
        
        console.error('API Error Response:', {
          status: res.status,
          statusText: res.statusText,
          data: data,
          responseText: responseText.substring(0, 500)
        });
        
        throw new Error(fullError);
      }

      // 3. Xử lý thành công
      if (isRegistering) {
        // Đăng ký thành công -> Thông báo chờ duyệt
        setSuccessMsg(data.message || 'Đăng ký thành công! Vui lòng chờ Admin duyệt.');
        setIsRegistering(false);     // Chuyển về form đăng nhập
        setEmail('');
        setPassword('');
        setName('');
      } else {
        // Đăng nhập thành công -> Vào app
        if (!data.user) {
          throw new Error('Dữ liệu người dùng không hợp lệ');
        }
        const user: User = {
          email: data.user.email,
          name: data.user.name,
        };
        onLogin(user);
      }

    } catch (err: any) {
      console.error('Login error:', err);
      
      // Xử lý các loại lỗi khác nhau
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Không thể kết nối đến server. Vui lòng:\n1. Kiểm tra server có đang chạy tại http://localhost:3001\n2. Chạy lệnh: npm run dev:server\n3. Hoặc chạy cả 2: npm run dev:all');
      } else if (err.message) {
        // Giữ nguyên message, có thể chứa hướng dẫn chi tiết
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
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