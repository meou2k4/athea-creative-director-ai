
import React, { useState, useRef, useEffect } from 'react';
import { Concept, UserInput, Pose } from '../types';
import { Copy, Check, Target, MapPin, UserCheck, Camera, Sparkles, Bookmark, Trash2, Image as ImageIcon, Loader2, Edit2, RefreshCw, Eye, X, User, Shirt, ChevronDown, ChevronUp, Download, AlertCircle, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';
import { generateFashionImage, refineFashionImage, regeneratePosePrompt } from '../services/geminiService';
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
  const [regeneratingPromptIndices, setRegeneratingPromptIndices] = useState<Set<number>>(new Set());
  const [errorIndices, setErrorIndices] = useState<Map<number, string>>(new Map());
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());
  const [refinePoseIndex, setRefinePoseIndex] = useState<number | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [fullViewImage, setFullViewImage] = useState<{url: string, title: string} | null>(null);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Sync with props
  useEffect(() => {
    setLocalConcept(concept);
  }, [concept]);

  useEffect(() => {
    if (!fullViewImage) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [fullViewImage]);

  const toggleLoading = (idx: number, isLoading: boolean) => {
    setLoadingIndices(prev => {
      const next = new Set(prev);
      if (isLoading) {
        next.add(idx);
        setErrorIndices(prevErrors => {
          const newErrors = new Map(prevErrors);
          newErrors.delete(idx);
          return newErrors;
        });
      } else {
        next.delete(idx);
      }
      return next;
    });
  };

  const handleRegeneratePosePrompt = async (idx: number) => {
    if (regeneratingPromptIndices.has(idx)) return;
    
    setRegeneratingPromptIndices(prev => new Set(prev).add(idx));
    try {
      const newPoseData = await regeneratePosePrompt(localConcept, localConcept.poses[idx], userInput);
      
      const updatedPoses = [...localConcept.poses];
      updatedPoses[idx] = { 
        ...updatedPoses[idx], 
        pose_title: newPoseData.pose_title,
        pose_description: newPoseData.pose_description,
        pose_prompt: newPoseData.pose_prompt,
        generated_image: undefined // Reset image because prompt changed
      };
      
      const updatedConcept = { ...localConcept, poses: updatedPoses };
      setLocalConcept(updatedConcept);
      if (onUpdate) onUpdate(updatedConcept);
      
      // Auto expand to show the new creative prompt
      setExpandedPrompts(prev => new Set(prev).add(idx));
    } catch (error) {
      console.error("Failed to regenerate prompt", error);
      alert("Không thể tạo lại nội dung. Vui lòng thử lại sau.");
    } finally {
      setRegeneratingPromptIndices(prev => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
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
    } catch (error: any) {
      console.error(error);
      const isQuota = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      const msg = isQuota 
        ? "Đã hết lượt dùng (Quota). Hệ thống sẽ tự động thử lại nếu bạn nhấn 'Tạo lại'." 
        : "Không thể tạo ảnh. Vui lòng thử lại.";
      
      setErrorIndices(prev => {
        const next = new Map(prev);
        next.set(poseIndex, msg);
        return next;
      });
    } finally {
      toggleLoading(poseIndex, false);
    }
  };

  const handleGenerateAll = async () => {
    const posesToGenerate = localConcept.poses
      .map((p, i) => ({p, i}))
      .filter(item => !item.p.generated_image);
      
    if (posesToGenerate.length === 0) return;

    setIsGeneratingAll(true);
    const totalTasks = posesToGenerate.length;
    let completedCount = 0;
    setProgressAll({ current: 0, total: totalTasks });

    const taskQueue = [...posesToGenerate];
    
    // REDUCED CONCURRENCY to 1 to strictly avoid 429 Resource Exhausted errors on free tiers
    const CONCURRENCY = 1; 

    const worker = async () => {
      while (taskQueue.length > 0) {
        const task = taskQueue.shift();
        if (!task) break;

        const { i, p } = task;
        toggleLoading(i, true);
        
        try {
          // Add a small jitter delay to avoid spiking requests simultaneously
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
          
          const imageUrl = await generateFashionImage(p.pose_prompt, userInput, {
            faceLock: p.is_face_locked,
            outfitLock: p.is_outfit_locked
          });
          
          setLocalConcept(prev => {
            const updatedPoses = [...prev.poses];
            updatedPoses[i] = { ...updatedPoses[i], generated_image: imageUrl };
            const nextConcept = { ...prev, poses: updatedPoses };
            onUpdate?.(nextConcept);
            return nextConcept;
          });
        } catch (e: any) {
          console.error(`Generation error at pose ${i}:`, e);
          const isQuota = e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED");
          setErrorIndices(prev => {
            const next = new Map(prev);
            next.set(i, isQuota ? "Hết hạn ngạch (429). Đang xếp hàng thử lại..." : "Lỗi kết nối.");
            return next;
          });
          
          // Optional: On quota error, push task back to end of queue to retry later
          if (isQuota) {
             taskQueue.push({p, i});
             // Wait a bit before next attempt from this worker
             await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } finally {
          toggleLoading(i, false);
          completedCount++;
          setProgressAll(prev => ({ ...prev, current: Math.min(completedCount, totalTasks) }));
        }
      }
    };

    const activeWorkers = Array(Math.min(CONCURRENCY, taskQueue.length))
      .fill(null)
      .map(() => worker());

    await Promise.all(activeWorkers);
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
    } catch (error: any) {
      const isQuota = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      alert(isQuota ? "Hết hạn ngạch API (429). Vui lòng đợi 1 phút rồi thử lại." : "Chỉnh sửa thất bại.");
    } finally {
      setIsRefining(false);
    }
  };

  // Full View Zoom/Pan Logic
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoom(prev => {
      const nextZoom = Math.max(prev - 0.5, 1);
      if (nextZoom === 1) setPosition({ x: 0, y: 0 });
      return nextZoom;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
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
              const isRegeneratingPrompt = regeneratingPromptIndices.has(idx);
              const isEditorExpanded = expandedPrompts.has(idx);
              const errorMsg = errorIndices.get(idx);
              
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
                            {isLoading ? (
                              <div className="flex flex-col items-center text-fashion-accent animate-pulse">
                                <Loader2 size={24} className="animate-spin mb-2" />
                                <span className="text-[10px] font-bold uppercase">Đang vẽ...</span>
                              </div>
                            ) : errorMsg ? (
                              <div className="flex flex-col items-center p-2">
                                <AlertCircle size={20} className="text-red-400 mb-1" />
                                <span className="text-[8px] font-bold text-red-500 uppercase leading-tight mb-2">{errorMsg}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx); }} className="px-2 py-1 bg-white border border-red-200 text-red-600 rounded text-[9px] font-bold uppercase hover:bg-red-50">Thử lại</button>
                              </div>
                            ) : (
                              <>
                                <ImageIcon size={24} className="mb-2 opacity-50" />
                                <button onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx); }} disabled={isGeneratingAll} className="px-3 py-1.5 bg-white border border-gray-300 hover:border-fashion-accent hover:text-fashion-accent rounded text-[10px] font-bold uppercase">Tải ảnh</button>
                              </>
                            )}
                         </div>
                       )}
                    </div>
                    <div className="flex-grow py-1">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded ${isLoading ? 'bg-fashion-accent animate-pulse' : errorMsg ? 'bg-red-500' : 'bg-black'}`}>POSE {idx + 1}</span>
                            <h5 className={`font-bold text-gray-900 text-lg transition-opacity ${isRegeneratingPrompt ? 'opacity-40' : 'opacity-100'}`}>{pose.pose_title}</h5>
                            {isRegeneratingPrompt && <Loader2 size={14} className="animate-spin text-fashion-accent" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <button 
                               onClick={() => handleRegeneratePosePrompt(idx)} 
                               disabled={isRegeneratingPrompt || isLoading}
                               title="Tạo lại nội dung Pose này (AI Sáng tạo)"
                               className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase border bg-white border-gray-200 text-gray-500 hover:border-fashion-accent hover:text-fashion-accent transition-all disabled:opacity-30 group"
                             >
                               <RotateCcw size={10} className={`${isRegeneratingPrompt ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> Creative Refresh
                             </button>
                             <button onClick={() => updatePoseLock(idx, 'face')} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${pose.is_face_locked ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><User size={10} fill={pose.is_face_locked ? "currentColor" : "none"} /> Lock Face</button>
                             <button onClick={() => updatePoseLock(idx, 'outfit')} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${pose.is_outfit_locked ? 'bg-fashion-accent/5 border-fashion-accent/30 text-fashion-accent shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><Shirt size={10} fill={pose.is_outfit_locked ? "currentColor" : "none"} /> Lock Outfit</button>
                          </div>
                       </div>
                       <div className={`relative transition-all duration-500 ${isRegeneratingPrompt ? 'opacity-40' : 'opacity-100'}`}>
                         {isRegeneratingPrompt && (
                           <div className="absolute inset-0 flex items-center justify-start z-10 pl-4">
                             <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm animate-pulse">
                               <Sparkles size={12} className="text-fashion-accent" />
                               <span className="text-[10px] font-bold text-gray-600 italic">AI đang viết lại mô tả nghệ thuật...</span>
                             </div>
                           </div>
                         )}
                         <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-fashion-accent/30 pl-3 mb-3 italic">
                           {pose.pose_description}
                         </p>
                       </div>
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
                       <textarea 
                         className="w-full bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono min-h-[150px] focus:outline-none" 
                         value={pose.pose_prompt} 
                         onChange={(e) => updatePosePromptText(idx, e.target.value)} 
                         spellCheck={false} 
                       />
                       <div className="mt-2 flex justify-between items-center">
                         <p className="text-[10px] text-gray-400 italic">* Chỉnh sửa trực tiếp JSON prompt nếu muốn tinh chỉnh sâu.</p>
                         <button onClick={() => handleGenerateImage(idx)} disabled={isLoading} className="bg-black text-white text-[10px] font-bold uppercase px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2">{isLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Tạo lại với Prompt này</button>
                       </div>
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
        <div 
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center backdrop-blur-md animate-fade-in" 
          onClick={() => setFullViewImage(null)}
          onWheel={handleWheel}
        >
           {/* Close Button */}
           <button 
             className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-[120] transition-colors"
             onClick={() => setFullViewImage(null)}
           >
             <X size={28} />
           </button>

           {/* Toolbar */}
           <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-full z-[120]" onClick={e => e.stopPropagation()}>
              <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" title="Thu nhỏ"><ZoomOut size={20} /></button>
              <div className="text-white text-xs font-bold px-2 min-w-[40px] text-center">{Math.round(zoom * 100)}%</div>
              <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" title="Phóng to"><ZoomIn size={20} /></button>
              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
              <button onClick={handleResetZoom} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors" title="Đặt lại"><Maximize size={20} /></button>
           </div>

           {/* Image Container */}
           <div 
             className={`relative transition-all duration-200 ease-out select-none ${zoom > 1 ? 'cursor-move' : 'cursor-default'}`}
             onClick={(e) => e.stopPropagation()}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             style={{
               transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
             }}
           >
              <div className="bg-white p-1 rounded-sm shadow-2xl overflow-hidden flex items-center justify-center">
                <img 
                  ref={imageRef}
                  src={fullViewImage.url} 
                  className="max-h-[85vh] max-w-[90vw] object-contain" 
                  alt={fullViewImage.title}
                  draggable={false}
                />
              </div>
           </div>

           {/* Caption & Download */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-[120]" onClick={e => e.stopPropagation()}>
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full text-white flex items-center gap-4 shadow-xl">
                <h4 className="font-serif text-base font-bold tracking-wide">{fullViewImage.title}</h4>
                <div className="w-[1px] h-4 bg-white/20"></div>
                <button 
                  onClick={() => handleDownload(fullViewImage.url, fullViewImage.title)} 
                  className="flex items-center gap-2 text-fashion-accent hover:text-yellow-400 text-xs font-bold uppercase transition-colors"
                >
                  <Download size={16} /> Tải về
                </button>
              </div>
              <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Dùng chuột hoặc nút trên để thu phóng • Kéo để di chuyển</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default ConceptCard;

