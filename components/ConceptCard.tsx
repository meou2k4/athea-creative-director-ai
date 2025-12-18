
import React, { useState } from 'react';
import { Concept, UserInput } from '../types';
import { Copy, Check, Target, MapPin, UserCheck, Camera, Sparkles, Bookmark, Trash2, Image as ImageIcon, Loader2, Edit2, RefreshCw, Eye, X, User, Shirt, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { generateFashionImage, refineFashionImage } from '../services/geminiService';
import RefineImageModal from './RefineImageModal';

interface ConceptCardProps {
  concept: Concept;
  index: number;
  userInput: UserInput; // Needed for reference images during generation
  onSave?: (concept: Concept) => void;
  onRemove?: (id: string) => void;
  onUpdate?: (concept: Concept) => void;
  isSaved?: boolean;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, index, userInput, onSave, onRemove, onUpdate, isSaved = false }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [progressAll, setProgressAll] = useState({ current: 0, total: 0 });
  const [localConcept, setLocalConcept] = useState<Concept>(concept);
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());
  const [refinePoseIndex, setRefinePoseIndex] = useState<number | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [fullViewImage, setFullViewImage] = useState<{url: string, title: string} | null>(null);

  const toggleLoading = (idx: number, isLoading: boolean) => {
    setLoadingIndices(prev => {
      const next = new Set(prev);
      if (isLoading) next.add(idx);
      else next.delete(idx);
      return next;
    });
  };

  const togglePromptEditor = (idx: number) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updatePoseLock = (idx: number, field: 'face' | 'outfit') => {
    const updatedPoses = [...localConcept.poses];
    if (field === 'face') {
      updatedPoses[idx] = { ...updatedPoses[idx], is_face_locked: !updatedPoses[idx].is_face_locked };
    } else {
      updatedPoses[idx] = { ...updatedPoses[idx], is_outfit_locked: !updatedPoses[idx].is_outfit_locked };
    }
    const updatedConcept = { ...localConcept, poses: updatedPoses };
    setLocalConcept(updatedConcept);
    if (onUpdate) onUpdate(updatedConcept);
  };

  const updatePosePromptText = (idx: number, text: string) => {
    const updatedPoses = [...localConcept.poses];
    updatedPoses[idx] = { ...updatedPoses[idx], pose_prompt: text };
    const updatedConcept = { ...localConcept, poses: updatedPoses };
    setLocalConcept(updatedConcept);
    if (onUpdate) onUpdate(updatedConcept);
  };

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_athea.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateImage = async (poseIndex: number) => {
    if (loadingIndices.has(poseIndex)) return;
    const pose = localConcept.poses[poseIndex];
    toggleLoading(poseIndex, true);
    
    try {
      const imageUrl = await generateFashionImage(pose.pose_prompt, userInput, {
        faceLock: pose.is_face_locked,
        outfitLock: pose.is_outfit_locked
      });
      
      const updatedPoses = [...localConcept.poses];
      updatedPoses[poseIndex] = { ...updatedPoses[poseIndex], generated_image: imageUrl };
      const updatedConcept = { ...localConcept, poses: updatedPoses };
      setLocalConcept(updatedConcept);
      if (onUpdate) onUpdate(updatedConcept);
    } catch (error) {
      alert("Không thể tạo ảnh. Vui lòng thử lại.");
    } finally {
      toggleLoading(poseIndex, false);
    }
  };

  const handleGenerateAll = async () => {
    const posesToGenerate = localConcept.poses.map((p, i) => ({p, i})).filter(item => !item.p.generated_image);
    if (posesToGenerate.length === 0) return;

    setIsGeneratingAll(true);
    setProgressAll({ current: 0, total: posesToGenerate.length });
    const updatedPoses = [...localConcept.poses];
    
    for (let k = 0; k < posesToGenerate.length; k++) {
        const { i } = posesToGenerate[k];
        setProgressAll(prev => ({ ...prev, current: k + 1 }));
        toggleLoading(i, true);
        try {
            const imageUrl = await generateFashionImage(updatedPoses[i].pose_prompt, userInput, {
              faceLock: updatedPoses[i].is_face_locked,
              outfitLock: updatedPoses[i].is_outfit_locked
            });
            updatedPoses[i] = { ...updatedPoses[i], generated_image: imageUrl };
            const currentConcept = { ...localConcept, poses: [...updatedPoses] };
            setLocalConcept(currentConcept);
            if (onUpdate) onUpdate(currentConcept);
        } catch (e) {
            console.error(e);
        } finally {
            toggleLoading(i, false);
        }
    }
    setIsGeneratingAll(false);
  };

  const handleRefineConfirm = async (instruction: string) => {
    if (refinePoseIndex === null) return;
    const currentImage = localConcept.poses[refinePoseIndex].generated_image;
    if (!currentImage) return;
    setIsRefining(true);
    try {
      const refinedImageUrl = await refineFashionImage(currentImage, instruction);
      const updatedPoses = [...localConcept.poses];
      updatedPoses[refinePoseIndex] = { ...updatedPoses[refinePoseIndex], generated_image: refinedImageUrl };
      const updatedConcept = { ...localConcept, poses: updatedPoses };
      setLocalConcept(updatedConcept);
      if (onUpdate) onUpdate(updatedConcept);
      setRefinePoseIndex(null); 
    } catch (error) {
      alert("Chỉnh sửa thất bại.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 font-sans">
      <div className="bg-[#222] text-white px-6 py-4 flex justify-between items-center">
        <h3 className="font-serif text-xl font-bold tracking-wide">
          {localConcept.concept_name_vn} <span className="text-gray-400 font-normal text-base">({localConcept.concept_name_en})</span>
        </h3>
        <div className="flex items-center gap-2">
           {onSave && (
             <button
               onClick={() => onSave(localConcept)}
               disabled={isSaved}
               className={`p-1.5 rounded transition-all ${isSaved ? 'bg-fashion-accent text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
             >
               <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
             </button>
           )}
           {onRemove && (
             <button onClick={() => onRemove(localConcept.id)} className="p-1.5 rounded bg-white/10 hover:bg-red-500/80 text-white transition-all">
               <Trash2 size={18} />
             </button>
           )}
        </div>
      </div>

      <div className="p-8 text-gray-800">
        <div className="mb-6">
           <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-1"><Target size={16} className="text-fashion-accent" /> Mục tiêu:</h4>
           <p className="text-gray-700 leading-relaxed pl-6">{localConcept.sales_target}</p>
        </div>
        <div className="mb-8">
           <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-1"><MapPin size={16} className="text-fashion-accent" /> Bối cảnh:</h4>
           <p className="text-gray-700 leading-relaxed pl-6">{localConcept.shoot_location}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Camera size={18} /> Chi tiết thực hiện (Bộ 5 Poses)</h4>
            <button onClick={handleGenerateAll} disabled={loadingIndices.size > 0 || isGeneratingAll} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold border transition-all rounded shadow-sm ${isGeneratingAll ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'text-fashion-accent border-fashion-accent hover:bg-yellow-50'} disabled:opacity-50`}>
              {isGeneratingAll ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
              {isGeneratingAll ? `Đang tạo (${progressAll.current}/${progressAll.total})...` : 'Tạo tất cả ảnh demo'}
            </button>
          </div>
          <div className="space-y-8">
            {localConcept.poses.map((pose, idx) => {
              const isLoading = loadingIndices.has(idx);
              const isEditorExpanded = expandedPrompts.has(idx);
              return (
                <div key={idx} className="space-y-3">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-32 h-44 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden relative group/image shadow-sm cursor-pointer" onClick={() => pose.generated_image && !isLoading && setFullViewImage({url: pose.generated_image, title: pose.pose_title})}>
                       {pose.generated_image ? (
                         <>
                            <img src={pose.generated_image} className={`w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105 ${isLoading ? 'blur-sm scale-105' : ''}`} />
                            {isLoading && (
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] text-white">
                                 <Loader2 size={24} className="animate-spin mb-2" />
                                 <span className="text-[10px] font-bold uppercase text-center px-2">Đang xử lý...</span>
                              </div>
                            )}
                            {!isLoading && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-[1px]">
                                 <button onClick={(e) => { e.stopPropagation(); setFullViewImage({url: pose.generated_image!, title: pose.pose_title}); }} className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white text-white hover:text-black rounded-full text-[9px] font-bold uppercase w-full justify-center"><Eye size={10} /> Xem</button>
                                 <button onClick={(e) => { e.stopPropagation(); handleDownload(pose.generated_image!, pose.pose_title); }} className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white text-white hover:text-black rounded-full text-[9px] font-bold uppercase w-full justify-center"><Download size={10} /> Tải về</button>
                                 <button onClick={(e) => { e.stopPropagation(); setRefinePoseIndex(idx); }} className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white text-white hover:text-black rounded-full text-[9px] font-bold uppercase w-full justify-center"><Edit2 size={10} /> Sửa</button>
                                 <button onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx); }} className="flex items-center gap-2 px-3 py-1 bg-fashion-accent text-black hover:bg-yellow-400 rounded-full text-[9px] font-bold uppercase w-full justify-center"><RefreshCw size={10} /> Tạo lại</button>
                              </div>
                            )}
                         </>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-2 text-center">
                            {isLoading ? <div className="flex flex-col items-center text-fashion-accent animate-pulse"><Loader2 size={24} className="animate-spin mb-2" /><span className="text-[10px] font-bold uppercase">Đang vẽ...</span></div> : <><ImageIcon size={24} className="mb-2 opacity-50" /><button onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx); }} disabled={isGeneratingAll} className="px-3 py-1.5 bg-white border border-gray-300 hover:border-fashion-accent hover:text-fashion-accent rounded text-[10px] font-bold uppercase">Tạo ảnh</button></>}
                         </div>
                       )}
                    </div>
                    <div className="flex-grow py-1">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded ${isLoading ? 'bg-fashion-accent animate-pulse' : 'bg-black'}`}>POSE {idx + 1}</span>
                            <h5 className="font-bold text-gray-900 text-lg">{pose.pose_title}</h5>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <button onClick={() => updatePoseLock(idx, 'face')} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${pose.is_face_locked ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><User size={10} fill={pose.is_face_locked ? "currentColor" : "none"} /> Lock Face</button>
                             <button onClick={() => updatePoseLock(idx, 'outfit')} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${pose.is_outfit_locked ? 'bg-fashion-accent/5 border-fashion-accent/30 text-fashion-accent shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><Shirt size={10} fill={pose.is_outfit_locked ? "currentColor" : "none"} /> Lock Outfit</button>
                          </div>
                       </div>
                       <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-gray-100 pl-3 mb-3">{pose.pose_description}</p>
                       <div className="flex items-center gap-4">
                        <button onClick={() => togglePromptEditor(idx)} className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider">{isEditorExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {isEditorExpanded ? 'Đóng Technical Prompt' : 'Sửa Technical Prompt'}</button>
                        {pose.generated_image && (
                          <button onClick={() => handleDownload(pose.generated_image!, pose.pose_title)} className="flex items-center gap-1 text-[10px] font-bold text-fashion-accent hover:text-yellow-600 uppercase tracking-wider"><Download size={12} /> Tải xuống ảnh</button>
                        )}
                       </div>
                    </div>
                  </div>
                  {isEditorExpanded && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 animate-fade-in-down">
                       <textarea className="w-full bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono min-h-[150px] focus:outline-none" value={pose.pose_prompt} onChange={(e) => updatePosePromptText(idx, e.target.value)} spellCheck={false} />
                       <div className="mt-2 flex justify-end"><button onClick={() => handleGenerateImage(idx)} disabled={isLoading} className="bg-black text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2">{isLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Tạo lại với Prompt này</button></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {refinePoseIndex !== null && localConcept.poses[refinePoseIndex].generated_image && (
        <RefineImageModal isOpen={true} onClose={() => setRefinePoseIndex(null)} imageUrl={localConcept.poses[refinePoseIndex].generated_image!} onRefine={handleRefineConfirm} isRefining={isRefining} />
      )}
      {fullViewImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setFullViewImage(null)}>
           <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full"><X size={28} /></button>
           <div className="max-w-4xl w-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative bg-white p-1 rounded-sm shadow-2xl overflow-hidden group">
                <img src={fullViewImage.url} className="max-h-[85vh] object-contain" />
                <button onClick={() => handleDownload(fullViewImage.url, fullViewImage.title)} className="absolute bottom-4 right-4 bg-white/90 hover:bg-white p-3 rounded-full text-black shadow-xl transition-all"><Download size={24} /></button>
              </div>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full text-white"><h4 className="font-serif text-lg font-bold tracking-wide">{fullViewImage.title}</h4></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ConceptCard;

