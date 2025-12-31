
import React, { useCallback, useState, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, Plus } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string, mimeType: string, previewUrl: string) => void;
  onClear: () => void;
  label: string;
  subLabel?: string;
  variant?: 'main' | 'compact';
  currentPreview?: string | null;
  isLoading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  onClear, 
  label, 
  subLabel,
  variant = 'main',
  currentPreview,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      onImageSelect(base64Data, file.type, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      // Reset file input để cho phép chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const containerBaseClasses = "transition-all relative overflow-hidden group";
  
  const stateClasses = currentPreview 
    ? 'border border-gray-200 rounded-xl' 
    : variant === 'compact'
      ? 'h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-2'
      : 'h-[300px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6';

  const hoverClasses = !currentPreview 
    ? isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer'
    : 'cursor-pointer';

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`${containerBaseClasses} ${stateClasses} ${hoverClasses} ${variant === 'compact' ? 'w-full h-32' : 'w-full'}`}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden" 
        disabled={isLoading} 
      />

      {currentPreview ? (
        <>
          <img src={currentPreview} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          
          {/* Default Hover State */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
            <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Thay thế</span>
            <span className="text-[8px] opacity-70 uppercase tracking-tighter">Kéo thả hoặc Click</span>
            
            {!isLoading && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClear(); }} 
                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all shadow-lg active:scale-90"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Active Drag Over State */}
          {isDragging && (
            <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-[2px] border-2 border-indigo-400 flex flex-col items-center justify-center z-10 animate-fade-in">
              <Upload size={24} className="text-white animate-bounce mb-2" />
              <span className="text-[10px] font-bold text-white uppercase">Thả để cập nhật</span>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none">
          {variant === 'main' ? (
            <>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                <ImageIcon className="text-gray-400" size={24} />
              </div>
              <span className="text-lg font-serif text-gray-800 mb-1">{label}</span>
              <span className="text-gray-500 text-xs">{subLabel}</span>
            </>
          ) : (
            <>
               <Plus className={`mb-1 transition-colors ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} size={20} />
               <span className="text-xs font-semibold text-gray-600 leading-tight">{label}</span>
               <span className="text-[10px] text-gray-400 mt-1">{subLabel || 'Kéo thả ảnh'}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

