
import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!instruction.trim()) return;
    onRefine(instruction);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
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
                   className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-fashion-accent focus:ring-1 focus:ring-fashion-accent/20 min-h-[120px] transition-all bg-white"
                   placeholder="Mô tả chi tiết phần cần sửa. Ví dụ: Làm rõ nét khuôn mặt, sửa ngón tay, thay đổi ánh sáng nền sang tông ấm hơn..."
                   value={instruction}
                   onChange={(e) => setInstruction(e.target.value)}
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                    <Sparkles size={12} /> Gợi ý sửa nhanh
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {COMMON_FIXES.map(fix => (
                     <button
                       key={fix}
                       onClick={() => setInstruction(prev => prev ? `${prev}, ${fix}` : fix)}
                       className="px-3 py-1.5 bg-white hover:bg-white hover:border-fashion-accent hover:text-fashion-accent border border-gray-200 rounded-md text-xs transition-all shadow-sm text-gray-600"
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
            onClick={handleSubmit}
            disabled={isRefining || !instruction.trim()}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-black/20"
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

