// Script test server connection và environment variables
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Kiểm tra cấu hình server...\n');

const requiredVars = {
  'GOOGLE_SHEET_ID': process.env.GOOGLE_SHEET_ID,
  'GOOGLE_SERVICE_ACCOUNT_EMAIL': process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  'GOOGLE_PRIVATE_KEY': process.env.GOOGLE_PRIVATE_KEY,
  'GMAIL_USER': process.env.GMAIL_USER,
  'GMAIL_APP_PASSWORD': process.env.GMAIL_APP_PASSWORD,
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
};

let allOk = true;

console.log('📋 Kiểm tra biến môi trường:');
for (const [key, value] of Object.entries(requiredVars)) {
  const hasValue = !!value;
  const status = hasValue ? '✅' : '❌';
  const displayValue = hasValue 
    ? (key === 'GOOGLE_PRIVATE_KEY' ? `${value.substring(0, 30)}...` : value.substring(0, 50))
    : 'THIẾU';
  
  console.log(`  ${status} ${key}: ${displayValue}`);
  if (!hasValue && key !== 'GMAIL_USER' && key !== 'GMAIL_APP_PASSWORD') {
    allOk = false;
  }
}

console.log('\n🌐 Kiểm tra kết nối server:');
try {
  const response = await fetch('http://localhost:3001/api/health');
  if (response.ok) {
    const data = await response.json();
    console.log('  ✅ Server đang chạy tại http://localhost:3001');
    console.log('  📊 Trạng thái:', JSON.stringify(data, null, 2));
  } else {
    console.log(`  ❌ Server trả về lỗi: ${response.status}`);
    allOk = false;
  }
} catch (error) {
  console.log('  ❌ Không thể kết nối đến server');
  console.log('  💡 Hãy chạy: npm run dev:server');
  allOk = false;
}

console.log('\n' + (allOk ? '✅ Tất cả đều OK!' : '❌ Có vấn đề cần sửa.'));
process.exit(allOk ? 0 : 1);

