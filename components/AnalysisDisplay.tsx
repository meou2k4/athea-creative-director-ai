
import React from 'react';
import { VisualAnalysis } from '../types';
import { Tag, Users, Palette, Sparkles, Layers, Shirt, MapPin, UserCheck, Lightbulb } from 'lucide-react';

interface AnalysisDisplayProps {
  analysis: VisualAnalysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  return (
    <div className="bg-white p-6 border border-gray-100 rounded-xl shadow-sm mb-8 animate-fade-in-up">
      <h2 className="font-serif text-2xl mb-6 text-fashion-black border-b pb-2 flex items-center justify-between">
        Phân tích Thị giác
        <span className="text-xs font-sans font-normal text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">AI Insights</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
        
        {/* Colors */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold">
            <Palette size={14} /> Bảng màu chủ đạo
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.color_palette.map((color, idx) => (
              <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium">
                <span 
                  className="w-3 h-3 rounded-full border border-gray-300 shadow-sm" 
                  style={{ backgroundColor: color.startsWith('#') ? color : '#ccc' }}
                ></span>
                {color}
              </span>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold">
            <Sparkles size={14} /> Cảm xúc & Vibe
          </div>
          <p className="text-gray-800 text-sm font-medium leading-relaxed bg-purple-50/50 p-2 rounded-lg border border-purple-100">{analysis.vibe}</p>
        </div>

        {/* Material & Form */}
        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-xl">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold">
              <Layers size={14} /> Chất liệu
            </div>
            <p className="text-gray-800 text-sm">{analysis.material}</p>
          </div>

          <div className="space-y-1">
             <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold">
              <Shirt size={14} /> Phom dáng
            </div>
            <p className="text-gray-800 text-sm">{analysis.form}</p>
          </div>
        </div>

        {/* AI Suggestions Section - NEW */}
        <div className="col-span-1 md:col-span-2 border-t border-dashed border-gray-200 pt-6 mt-2">
          <div className="flex items-center gap-2 mb-4">
             <Lightbulb className="text-fashion-accent fill-fashion-accent" size={18} />
             <h3 className="font-bold text-gray-800 text-sm uppercase">Gợi ý từ AI (Dựa trên ảnh sản phẩm)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contexts */}
            <div>
               <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold mb-2">
                 <MapPin size={14} /> Bối cảnh phù hợp
               </div>
               <ul className="space-y-2">
                 {analysis.suggested_contexts?.map((ctx, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-white border border-gray-100 p-2 rounded shadow-sm">
                     <span className="text-fashion-accent font-bold">•</span> {ctx}
                   </li>
                 ))}
               </ul>
            </div>

            {/* Styles */}
            <div>
               <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold mb-2">
                 <UserCheck size={14} /> Phong cách mẫu đề xuất
               </div>
               <ul className="space-y-2">
                 {analysis.suggested_model_styles?.map((style, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-white border border-gray-100 p-2 rounded shadow-sm">
                     <span className="text-fashion-accent font-bold">•</span> {style}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2 md:col-span-2 pt-4">
           <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide font-bold">
            <Tag size={14} /> Từ khóa tìm kiếm (SEO)
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.style_keywords.map((keyword, idx) => (
              <span key={idx} className="px-3 py-1 bg-white text-gray-600 border border-gray-200 text-xs font-medium rounded-full shadow-sm">
                #{keyword}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisDisplay;

