
import React, { useState, useRef, useEffect } from 'react';
import { generateShootingPlan, suggestShootingContexts, suggestModelStyles, generatePosePrompt, generateImageFromJsonPrompt } from './services/geminiService';
import { ImageSize, ShootingPlanState, User } from './types';
import { Button } from './components/Button';
import { Login } from './components/Login';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);

const WandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2 11 5"/></svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 0l3.5 10.5L26 14l-10.5 3.5L12 28l-3.5-10.5L-2 14l10.5-3.5z" transform="scale(0.8) translate(8,8)"/></svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<ShootingPlanState>({
    image: null,
    closeupImage: null,
    faceImage: null,
    context: '',
    modelStyle: '',
    planResult: null,
    isLoadingPlan: false,
    generatedImage: null,
    isGeneratingImage: false,
    imageSize: ImageSize.Size1K,
    error: null,
    suggestedContexts: [],
    isSuggestingContexts: false,
    suggestedModelStyles: [],
    isSuggestingModelStyles: false,
    posePrompts: {},
    generatingPosePromptId: null,
    poseImages: {},
    generatingPoseImageId: null
  });

  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeupInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Check for persistent session
  useEffect(() => {
    const storedUser = localStorage.getItem('athea_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('athea_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('athea_user');
    // Reset state on logout
    setState({
        image: null,
        closeupImage: null,
        faceImage: null,
        context: '',
        modelStyle: '',
        planResult: null,
        isLoadingPlan: false,
        generatedImage: null,
        isGeneratingImage: false,
        imageSize: ImageSize.Size1K,
        error: null,
        suggestedContexts: [],
        isSuggestingContexts: false,
        suggestedModelStyles: [],
        isSuggestingModelStyles: false,
        posePrompts: {},
        generatingPosePromptId: null,
        poseImages: {},
        generatingPoseImageId: null
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Reset state and start suggesting contexts and model styles
        setState(prev => ({ 
          ...prev, 
          image: base64, 
          generatedImage: null, 
          planResult: null,
          context: '',
          modelStyle: '',
          suggestedContexts: [],
          isSuggestingContexts: true,
          suggestedModelStyles: [],
          isSuggestingModelStyles: true,
          posePrompts: {},
          poseImages: {}
        }));

        try {
          // Trigger context suggestion
          const contextsPromise = suggestShootingContexts(base64).then(suggestions => {
             setState(prev => ({ ...prev, suggestedContexts: suggestions, isSuggestingContexts: false }));
          });

          // Trigger model style suggestion
          const stylesPromise = suggestModelStyles(base64).then(styles => {
             setState(prev => ({ ...prev, suggestedModelStyles: styles, isSuggestingModelStyles: false }));
          });

          await Promise.all([contextsPromise, stylesPromise]);

        } catch (error) {
          console.error("Failed to suggest details", error);
          setState(prev => ({ ...prev, isSuggestingContexts: false, isSuggestingModelStyles: false }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseupUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, closeupImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, faceImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePlan = async () => {
    if (!state.image || !state.context || !state.modelStyle) return;

    setState(prev => ({ ...prev, isLoadingPlan: true, error: null, planResult: null, posePrompts: {}, poseImages: {} }));
    
    try {
      const plan = await generateShootingPlan(
        state.image, 
        state.context, 
        state.modelStyle,
        state.closeupImage,
        state.faceImage
      );
      setState(prev => ({ ...prev, planResult: plan, isLoadingPlan: false }));
      
      // Smooth scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoadingPlan: false, error: err.message || "Đã có lỗi xảy ra" }));
    }
  };

  const handleGeneratePosePrompt = async (concept: string, pose: string, id: string) => {
    if (!state.image || !state.context) return;
    
    setState(prev => ({ ...prev, generatingPosePromptId: id }));

    try {
        const promptJson = await generatePosePrompt(state.image, concept, pose, state.context);
        setState(prev => ({
            ...prev,
            generatingPosePromptId: null,
            posePrompts: {
                ...prev.posePrompts,
                [id]: promptJson
            }
        }));
    } catch (err) {
        console.error("Error generating pose prompt", err);
        setState(prev => ({ ...prev, generatingPosePromptId: null }));
    }
  };

  const handleGeneratePoseImage = async (promptJson: string, id: string) => {
      if (!state.image) return;

      setState(prev => ({ ...prev, generatingPoseImageId: id }));

      try {
          const imgUrl = await generateImageFromJsonPrompt(state.image, promptJson, state.imageSize);
          setState(prev => ({
              ...prev,
              generatingPoseImageId: null,
              poseImages: {
                  ...prev.poseImages,
                  [id]: imgUrl
              }
          }));
      } catch (err: any) {
          console.error("Error generating pose image", err);
          alert(err.message || "Lỗi tạo ảnh cho pose này.");
          setState(prev => ({ ...prev, generatingPoseImageId: null }));
      }
  };

  const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const formatMarkdown = (text: string) => {
    let currentConcept = "Chung";
    
    // Split lines but preserve line indices for stable keys
    return text.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      
      // Robust Concept Detection: Matches "Concept 1", "**Concept 1**", "Concept 1:"
      const conceptMatch = trimmedLine.match(/^(\*\*)?Concept/i);
      if (conceptMatch) {
          currentConcept = trimmedLine.replace(/\**/g, '');
      }

      if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-serif text-brand-gold mb-4 mt-8">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-serif text-white mb-3 mt-6 border-b border-gray-700 pb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-medium text-brand-gold mb-2 mt-4">{line.replace('### ', '')}</h3>;
      
      // Robust Pose Detection: Matches "- Pose 1", "* Pose 1", "1. Pose 1", "- **Pose 1**", "**Pose 1**"
      const poseMatch = trimmedLine.match(/^([-*]|\d+\.)\s*(\*\*)?Pose\s+\d+/i) || trimmedLine.match(/^(\*\*)?Pose\s+\d+/i);

      if (poseMatch) {
          const btnId = `pose-${idx}`;
          const isGeneratingPrompt = state.generatingPosePromptId === btnId;
          const isGeneratingImage = state.generatingPoseImageId === btnId;
          const prompt = state.posePrompts[btnId];
          const poseImage = state.poseImages[btnId];

          return (
              <div key={idx} className="ml-4 mb-6">
                  <div className="flex items-start md:items-center flex-col md:flex-row gap-2">
                    <li className="text-gray-300 list-disc marker:text-brand-gold">
                        {trimmedLine.replace(/^([-*]|\d+\.)\s*/, '').replace(/\*\*/g, '')}
                    </li>
                    <button 
                        onClick={() => handleGeneratePosePrompt(currentConcept, line, btnId)}
                        disabled={isGeneratingPrompt}
                        className="text-xs flex items-center gap-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold hover:text-black px-3 py-1.5 rounded transition-all disabled:opacity-50 mt-1 md:mt-0 font-medium"
                    >
                        {isGeneratingPrompt ? (
                            <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"/>
                        ) : <CodeIcon />}
                        {prompt ? 'Tạo lại Prompt' : 'Tạo Prompt'}
                    </button>
                  </div>
                  
                  {/* Display Generated Prompt and Controls */}
                  {prompt && (
                      <div className="mt-3 bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden animate-fade-in-up shadow-inner">
                          <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-gray-800">
                              <span className="text-xs text-gray-400 font-mono">JSON Prompt</span>
                              <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleGeneratePoseImage(prompt, btnId)}
                                    disabled={isGeneratingImage}
                                    className="flex items-center gap-1.5 text-xs text-brand-gold hover:text-brand-gold/80 transition-colors px-2 py-1 rounded hover:bg-brand-gold/10 border border-brand-gold/20"
                                >
                                    {isGeneratingImage ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"/> : <ImageIcon />}
                                    Tạo Ảnh
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(prompt, btnId)}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
                                >
                                    {copiedPromptId === btnId ? <CheckIcon /> : <CopyIcon />}
                                    {copiedPromptId === btnId ? 'Đã sao chép' : 'Sao chép'}
                                </button>
                              </div>
                          </div>
                          
                          {/* JSON Code */}
                          <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap p-3 max-h-60 overflow-y-auto selection:bg-green-900 selection:text-white border-b border-gray-800">
                              {prompt}
                          </pre>
                          
                          {/* Generated Image Result Area */}
                          {(poseImage || isGeneratingImage) && (
                              <div className="p-3 bg-black flex justify-center">
                                  {isGeneratingImage ? (
                                      <div className="flex flex-col items-center py-8">
                                          <div className="animate-spin h-8 w-8 border-2 border-brand-gold border-t-transparent rounded-full mb-2"/>
                                          <p className="text-xs text-brand-gold animate-pulse">Đang tạo ảnh...</p>
                                      </div>
                                  ) : (
                                      <div className="relative group max-w-sm rounded-lg overflow-hidden border border-gray-700">
                                          <img src={poseImage} alt="Pose Visualization" className="w-full h-auto" />
                                          <a 
                                            href={poseImage}
                                            download={`athea_pose_${btnId}.png`}
                                            className="absolute bottom-2 right-2 bg-white/90 text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                                          >
                                              Tải về
                                          </a>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  )}
              </div>
          );
      }

      if (line.startsWith('* ') || line.startsWith('- ')) return <li key={idx} className="ml-4 mb-2 text-gray-300 list-disc">{line.replace(/^[\*-] /, '')}</li>;
      if (line.match(/^\d\./)) return <li key={idx} className="ml-4 mb-2 text-gray-300 list-decimal">{line.replace(/^\d\.\s/, '')}</li>;
      
      // Better Concept Box Rendering
      if (conceptMatch) {
           return <div key={idx} className="bg-brand-gray/40 p-4 rounded-lg border-l-4 border-brand-gold my-6 font-semibold text-lg text-brand-light shadow-lg">{trimmedLine.replace(/\**/g, '')}</div>;
      }
      
      return <p key={idx} className="mb-2 text-gray-400 leading-relaxed">{line}</p>;
    });
  };

  // If not authenticated, show Login Screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Authenticated Application
  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-gold selection:text-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-brand-dark/95 sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-serif font-bold text-xl shadow-[0_0_10px_rgba(212,175,55,0.4)]">A</div>
            <div>
              <h1 className="text-xl font-serif tracking-wide text-white">ATHEA Creative Director</h1>
              <p className="text-xs text-brand-gold uppercase tracking-widest">Trợ Lý Thời Trang AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <span className="hidden md:inline text-sm text-gray-400 font-serif italic">Xin chào, {user.name}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 px-3 py-1.5 rounded-full"
              >
                <LogoutIcon />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Intro */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-white">Nâng Tầm Chiến Dịch Thời Trang</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Tải lên ảnh sản phẩm, ảnh chất liệu và ảnh gương mặt mẫu để AI Giám đốc Sáng tạo lập kế hoạch chụp ảnh hoàn hảo.
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          {/* Left: Image Uploads */}
          <div className="lg:col-span-5 space-y-4">
             {/* 1. Main Image Upload (Large) */}
             <div 
              className={`relative border-2 border-dashed rounded-xl h-[400px] flex flex-col items-center justify-center transition-all duration-300 overflow-hidden group
                ${state.image ? 'border-brand-gold/50 bg-black' : 'border-gray-700 hover:border-brand-gold/50 hover:bg-brand-gray/30'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {state.image ? (
                <img 
                  src={state.image} 
                  alt="Product" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-brand-gold transition-colors">
                    <UploadIcon />
                  </div>
                  <p className="text-lg font-medium text-white">Tải Ảnh Sản Phẩm Chính</p>
                  <p className="text-sm text-gray-500 mt-2">Bắt buộc (JPG, PNG)</p>
                </div>
              )}

              {state.image && (
                <div className="absolute bottom-4 right-4 z-20">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs hover:bg-brand-gold hover:text-black transition-colors border border-gray-600 hover:border-brand-gold"
                  >
                    Đổi Ảnh
                  </button>
                </div>
              )}
            </div>

            {/* Sub Images: Closeup & Face (Smaller) */}
            <div className="grid grid-cols-2 gap-4">
                {/* Closeup Upload */}
                <div 
                  className={`relative border border-dashed rounded-lg h-[150px] flex flex-col items-center justify-center transition-all duration-300 overflow-hidden group
                    ${state.closeupImage ? 'border-brand-gold/30 bg-black' : 'border-gray-700 hover:border-brand-gold/30 hover:bg-brand-gray/20'}
                  `}
                >
                  <input 
                    type="file" 
                    ref={closeupInputRef}
                    onChange={handleCloseupUpload}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {state.closeupImage ? (
                    <img src={state.closeupImage} alt="Closeup" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                       <p className="text-xs font-medium text-gray-400 group-hover:text-white mb-1">Sản phẩm cận chất</p>
                       <span className="text-[10px] text-gray-600 block">(Tùy chọn)</span>
                    </div>
                  )}
                  {state.closeupImage && (
                    <button onClick={() => closeupInputRef.current?.click()} className="absolute bottom-2 right-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded border border-white/20 z-20">Đổi</button>
                  )}
                </div>

                {/* Face Upload */}
                <div 
                  className={`relative border border-dashed rounded-lg h-[150px] flex flex-col items-center justify-center transition-all duration-300 overflow-hidden group
                    ${state.faceImage ? 'border-brand-gold/30 bg-black' : 'border-gray-700 hover:border-brand-gold/30 hover:bg-brand-gray/20'}
                  `}
                >
                  <input 
                    type="file" 
                    ref={faceInputRef}
                    onChange={handleFaceUpload}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {state.faceImage ? (
                    <img src={state.faceImage} alt="Face" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                       <p className="text-xs font-medium text-gray-400 group-hover:text-white mb-1">Tải ảnh gương mặt</p>
                       <span className="text-[10px] text-gray-600 block">(Tùy chọn)</span>
                    </div>
                  )}
                  {state.faceImage && (
                    <button onClick={() => faceInputRef.current?.click()} className="absolute bottom-2 right-2 bg-black/50 text-[10px] text-white px-2 py-0.5 rounded border border-white/20 z-20">Đổi</button>
                  )}
                </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
            <div className="bg-brand-gray/20 p-8 rounded-xl border border-gray-800">
              <h3 className="text-2xl font-serif mb-6 flex items-center gap-2">
                <CameraIcon /> 
                <span>Chi Tiết Chiến Dịch</span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Bối Cảnh / Không Gian</label>
                  <input
                    type="text"
                    value={state.context}
                    onChange={(e) => setState(prev => ({ ...prev, context: e.target.value }))}
                    placeholder="ví dụ: Tiệc cưới sang trọng, Street Style Tokyo, Resort biển..."
                    className="w-full bg-brand-dark border border-gray-700 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                  />
                  {/* Context Suggestions Area */}
                  {state.isSuggestingContexts ? (
                    <div className="mt-3 flex items-center gap-2 text-brand-gold text-sm animate-pulse">
                       <SparkleIcon />
                       <span>Đang phân tích sản phẩm để gợi ý bối cảnh phù hợp...</span>
                    </div>
                  ) : state.suggestedContexts.length > 0 && (
                    <div className="mt-4 animate-fade-in-up">
                       <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Gợi ý từ AI (Chọn một):</p>
                       <div className="flex flex-wrap gap-2">
                         {state.suggestedContexts.map((ctx, idx) => (
                           <button
                              key={idx}
                              onClick={() => setState(prev => ({ ...prev, context: ctx }))}
                              className={`text-sm px-4 py-2 rounded-full border transition-all duration-200 ${
                                state.context === ctx 
                                  ? 'bg-brand-gold text-brand-dark border-brand-gold font-medium shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
                                  : 'bg-transparent text-gray-300 border-gray-700 hover:border-brand-gold/70 hover:text-brand-gold hover:bg-brand-gold/5'
                              }`}
                           >
                             {ctx}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Phong Cách Người Mẫu</label>
                  <input
                    type="text"
                    value={state.modelStyle}
                    onChange={(e) => setState(prev => ({ ...prev, modelStyle: e.target.value }))}
                    placeholder="ví dụ: Người mẫu Việt, Thanh lịch, Gen Z, Thời trang cao cấp..."
                    className="w-full bg-brand-dark border border-gray-700 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                  />
                  {/* Model Style Suggestions Area */}
                  {state.isSuggestingModelStyles ? (
                    <div className="mt-3 flex items-center gap-2 text-brand-gold text-sm animate-pulse">
                       <SparkleIcon />
                       <span>Đang đề xuất phong cách người mẫu...</span>
                    </div>
                  ) : state.suggestedModelStyles.length > 0 && (
                    <div className="mt-4 animate-fade-in-up">
                       <p className="text-xs text-gray-500 uppercase mb-2 font-medium">Gợi ý từ AI (Chọn một):</p>
                       <div className="flex flex-wrap gap-2">
                         {state.suggestedModelStyles.map((style, idx) => (
                           <button
                              key={idx}
                              onClick={() => setState(prev => ({ ...prev, modelStyle: style }))}
                              className={`text-sm px-4 py-2 rounded-full border transition-all duration-200 ${
                                state.modelStyle === style 
                                  ? 'bg-brand-gold text-brand-dark border-brand-gold font-medium shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
                                  : 'bg-transparent text-gray-300 border-gray-700 hover:border-brand-gold/70 hover:text-brand-gold hover:bg-brand-gold/5'
                              }`}
                           >
                             {style}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <Button 
                  onClick={handleGeneratePlan} 
                  isLoading={state.isLoadingPlan}
                  disabled={!state.image || !state.context || !state.modelStyle}
                  className="w-full text-lg"
                >
                  <WandIcon />
                  Tạo Kế Hoạch Chụp Ảnh
                </Button>
                {state.error && (
                  <p className="text-red-400 text-sm mt-3 text-center bg-red-900/20 p-2 rounded">{state.error}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(state.planResult) && (
          <div ref={resultRef} className="animate-fade-in-up space-y-16">
            
            {/* The Shooting Plan */}
            <div className="bg-brand-gray/20 rounded-2xl p-8 md:p-12 border border-gray-800 shadow-2xl">
              <div className="prose prose-invert prose-gold max-w-none">
                {formatMarkdown(state.planResult)}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default App;
