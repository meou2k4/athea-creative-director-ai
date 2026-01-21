
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';

interface RefineImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
}

const COMMON_FIXES = [
  "Fix face details",
  "Fix hands and fingers",
  "Improve lighting",
  "Higher resolution",
  "Make it more realistic",
  "Remove artifacts"
];

const RefineImageModal: React.FC<RefineImageModalProps> = ({
  isOpen, onClose, imageUrl, onRefine, isRefining
}) => {
  const [instruction, setInstruction] = useState('');
  const [showHint, setShowHint] = useState(true);

  // Reset instruction khi modal mở
  useEffect(() => {
    if (isOpen) {
      // Tự động chọn suggestion đầu tiên để button hoạt động ngay
      setInstruction(COMMON_FIXES[0]);
      setShowHint(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!instruction.trim()) return;
    onRefine(instruction);
  };

  // Check if button should be enabled
  const isButtonEnabled = !isRefining && instruction.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => {
      // Đóng modal khi click vào overlay (nhưng không đóng khi click vào modal content)
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="font-serif text-lg font-bold flex items-center gap-2 text-gray-900">
            <Wand2 size={18} className="text-fashion-accent" />
            Chỉnh sửa & Hoàn thiện ảnh
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50">
          <div className="flex gap-6 flex-col md:flex-row">
             {/* Image Preview */}
             <div className="w-full md:w-5/12 flex-shrink-0">
               <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm relative">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
               </div>
               <p className="text-xs text-center text-gray-400 mt-2">Ảnh hiện tại</p>
             </div>

             {/* Controls */}
             <div className="flex-grow space-y-5">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Yêu cầu chỉnh sửa</label>
                 <textarea
                   className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 min-h-[120px] transition-all bg-white ${!isButtonEnabled && instruction.trim() === '' ? 'border-fashion-accent/50' : 'border-gray-300'}`}
                   placeholder="Mô tả chi tiết phần cần sửa. Ví dụ: Làm rõ nét khuôn mặt, sửa ngón tay, thay đổi ánh sáng nền sang tông ấm hơn..."
                   value={instruction}
                   onChange={(e) => {
                     setInstruction(e.target.value);
                     setShowHint(false);
                   }}
                   onKeyDown={(e) => {
                     // Cho phép Ctrl+Enter hoặc Cmd+Enter để submit
                     if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                       e.preventDefault();
                       if (isButtonEnabled) {
                         handleSubmit();
                       }
                     }
                   }}
                 />
                 {/* Hint for user */}
                 {showHint && (
                   <p className="text-xs text-fashion-accent mt-2 flex items-center gap-1">
                     <Sparkles size={12} />
                     Đã chọn sẵn gợi ý phổ biến nhất. Bạn có thể chỉnh sửa hoặc chọn gợi ý khác bên dưới.
                   </p>
                 )}
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                    <Sparkles size={12} /> Gợi ý sửa nhanh
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {COMMON_FIXES.map((fix, idx) => (
                     <button
                       key={fix}
                       onClick={() => {
                         setInstruction(fix);
                         setShowHint(false);
                       }}
                       className={`px-3 py-1.5 rounded-md text-xs transition-all shadow-sm border ${
                         instruction === fix 
                           ? 'bg-fashion-accent text-white border-fashion-accent' 
                           : 'bg-white text-gray-600 border-gray-200 hover:border-fashion-accent hover:text-fashion-accent'
                       }`}
                     >
                       {fix}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isButtonEnabled) {
                handleSubmit();
              }
            }}
            disabled={!isButtonEnabled}
            className={`px-6 py-2.5 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-black/20 active:scale-[0.98] ${
              isButtonEnabled 
                ? 'bg-black hover:bg-gray-800 cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            type="button"
          >
            {isRefining ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Wand2 size={16} />}
            {isRefining ? 'Đang xử lý...' : 'Tạo lại ảnh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefineImageModal;

