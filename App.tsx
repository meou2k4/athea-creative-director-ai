
import React, { useState, useEffect } from 'react';
import { analyzeImage } from './services/geminiService';
import { FashionAIResponse, LoadingState, UserInput, Concept, ImageRef, User } from './types';
import ImageUploader from './components/ImageUploader';
import ConceptCard from './components/ConceptCard';
import { Login } from './components/Login';
import { 
  Sparkles, 
  Settings2, 
  PenTool, 
  LayoutGrid, 
  Bookmark, 
  Zap, 
  ZapOff, 
  Shirt, 
  UserCheck, 
  Layers, 
  Trash2,
  Sun,
  Snowflake,
  Flower2,
  Camera,
  Anchor,
  ShoppingBag,
  Briefcase,
  GalleryVertical,
  Wind,
  Hotel,
  LogOut,
  AlertTriangle
} from 'lucide-react';

const PRESET_SCENES = [
  { "id": "white_lace_floral_atelier", "label": "Floral Atelier", "description": "Studio trắng, nữ tính, editorial cao cấp", icon: Flower2 },
  { "id": "paris_golden_hour", "label": "Paris Golden Hour", "description": "Phố Paris, nắng chiều, lãng mạn sang trọng", icon: Sun },
  { "id": "winter_boutique", "label": "Winter Boutique", "description": "Cửa hàng mùa lạnh, ánh vàng ấm, quiet luxury", icon: Snowflake },
  { "id": "riviera_yacht_lux", "label": "Riviera Yacht Lux", "description": "Du thuyền, biển xanh, resort luxury", icon: Anchor },
  { "id": "luxury_shopping_street", "label": "Shopping Street", "description": "Phố mua sắm cao cấp, fashion commercial", icon: ShoppingBag },
  { "id": "corporate_soft_office", "label": "Soft Office", "description": "Văn phòng kính, nữ lãnh đạo thanh lịch", icon: Briefcase },
  { "id": "minimal_gallery_rack", "label": "Minimal Gallery", "description": "Phòng trắng, giá treo, product hero", icon: GalleryVertical },
  { "id": "autumn_window_atelier", "label": "Autumn Atelier", "description": "Boutique kính, lá thu, editorial story", icon: Wind },
  { "id": "grand_hotel_lobby_gala", "label": "Hotel Lobby Gala", "description": "Sảnh khách sạn, đèn chùm, gala sang trọng", icon: Hotel }
];

const AtheaLogo = () => (
  <div className="flex flex-col items-center justify-center leading-none mr-2">
    <div className="relative h-10 w-10 flex items-center justify-center">
      <span className="font-serif text-2xl font-bold text-black border-b-2 border-black -mb-1">T</span>
      <span className="font-serif text-2xl italic font-light text-black absolute top-1 left-4">A</span>
    </div>
  </div>
);

const App: React.FC = () => {
  // Login state - giữ lại từ code cũ
  const [user, setUser] = useState<User | null>(null);

  // UI state mới từ Downloads
  const [data, setData] = useState<FashionAIResponse | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<'studio' | 'collection'>('studio');
  const [selectedSceneId, setSelectedSceneId] = useState("white_lace_floral_atelier");
  
  const [savedConcepts, setSavedConcepts] = useState<Concept[]>(() => {
    try {
      const saved = localStorage.getItem('fashionAI_savedConcepts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [input, setInput] = useState<UserInput>({
    productImages: [],
    faceReference: { data: null, mimeType: null },
    fabricReference: { data: null, mimeType: null },
    context: '', modelStyle: '', suggestions: '', customDescription: '',
    modelOrigin: 'VN', lock_lighting: true
  });

  const [previews, setPreviews] = useState({ 
    products: [] as string[], 
    face: null as string|null, 
    fabric: null as string|null 
  });

  // Check for persistent session - giữ lại từ code cũ
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem('athea_user');
      if (storedUser) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          
          // 1. Set user tạm thời để UI hiển thị ngay (UX nhanh)
          setUser(parsedUser);

          // 2. Gọi API để kiểm tra xem ID này còn tồn tại/hợp lệ trong Sheet không
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'verify', 
              id: parsedUser.id 
            }),
          });

          // Nếu server trả về lỗi (404 Not Found hoặc 403 Forbidden)
          if (!res.ok) {
            console.warn('Session verification failed. Logging out...');
            handleLogout(); // Xóa data và đá ra màn hình login
          } else {
            // Optional: Cập nhật lại thông tin user nếu admin có đổi tên trong sheet
            const data = await res.json();
            if (data.success && data.user) {
              const updatedUser = { ...parsedUser, ...data.user };
              setUser(updatedUser);
              localStorage.setItem('athea_user', JSON.stringify(updatedUser));
            }
          }
        } catch (e) {
          console.error("Failed to verify session:", e);
          // Lưu ý: Nếu lỗi mạng (network error), ta có thể chọn không logout 
          // để user vẫn dùng được offline hoặc show thông báo lỗi.
          // Ở đây tôi giữ nguyên user nếu lỗi mạng, chỉ logout khi parse lỗi.
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('athea_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('athea_user');
    // Reset state on logout
    setData(null);
    setInput({
      productImages: [],
      faceReference: { data: null, mimeType: null },
      fabricReference: { data: null, mimeType: null },
      context: '', modelStyle: '', suggestions: '', customDescription: '',
      modelOrigin: 'VN', lock_lighting: true
    });
    setPreviews({ products: [], face: null, fabric: null });
    setLoading({ status: 'idle' });
  };

  const handleAddProductImage = (data: string, mimeType: string, previewUrl: string) => {
    setInput(prev => ({
      ...prev,
      productImages: [...prev.productImages, { data, mimeType }]
    }));
    setPreviews(prev => ({
      ...prev,
      products: [...prev.products, previewUrl]
    }));
  };

  const handleRemoveProductImage = (index: number) => {
    setInput(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
    setPreviews(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleSaveConcept = (concept: Concept) => {
    const newConcept = { ...concept, id: `saved-${Date.now()}` };
    const newCollection = [newConcept, ...savedConcepts];
    setSavedConcepts(newCollection);
    localStorage.setItem('fashionAI_savedConcepts', JSON.stringify(newCollection));
  };

  const handleUpdateActiveConcept = (updatedConcept: Concept) => {
    if (!data) return;
    const newConcepts = data.concepts.map(c => c.id === updatedConcept.id ? updatedConcept : c);
    setData({ ...data, concepts: newConcepts });
  };

  const handleUpdateConcept = (updatedConcept: Concept) => {
    const newCollection = savedConcepts.map(c => c.id === updatedConcept.id ? updatedConcept : c);
    setSavedConcepts(newCollection);
    localStorage.setItem('fashionAI_savedConcepts', JSON.stringify(newCollection));
  };

  const handleRemoveConcept = (id: string) => {
    const newCollection = savedConcepts.filter(c => c.id !== id);
    setSavedConcepts(newCollection);
    localStorage.setItem('fashionAI_savedConcepts', JSON.stringify(newCollection));
  };

  const handleAnalyze = async () => {
    if (input.productImages.length === 0) return;
    setData(null);
    setLoading({ status: 'analyzing', message: 'Đang thiết kế Concept với Multi-Angle Identity Lock...' });
    const selectedScene = PRESET_SCENES.find(s => s.id === selectedSceneId);
    const effectiveContext = `${selectedScene?.label}: ${selectedScene?.description}`;
    try {
      const result = await analyzeImage({ ...input, context: effectiveContext });
      setData(result);
      setLoading({ status: 'complete' });
    } catch (error: any) {
      console.error(error);
      const isQuota = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      setLoading({ 
        status: 'error', 
        message: isQuota 
          ? 'Hết hạn ngạch (Quota) API. Vui lòng chờ vài phút rồi thử lại.' 
          : 'Phân tích thất bại. Vui lòng thử lại sau.' 
      });
    }
  };

  const handleClearAll = () => {
    setData(null);
    setInput({
      productImages: [],
      faceReference: { data: null, mimeType: null },
      fabricReference: { data: null, mimeType: null },
      context: '', modelStyle: '', suggestions: '', customDescription: '',
      modelOrigin: 'VN', lock_lighting: true
    });
    setPreviews({ products: [], face: null, fabric: null });
    setLoading({ status: 'idle' });
  };

  // If not authenticated, show Login Screen - giữ lại từ code cũ
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Authenticated Application - UI mới từ Downloads
  return (
    <div className="min-h-screen bg-gray-50 text-fashion-black font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('studio')}>
            <AtheaLogo />
            <div className="flex flex-col leading-none">
               <h1 className="font-serif text-lg font-bold tracking-tight">Giám Đốc Sáng Tạo</h1>
               <span className="text-fashion-accent text-[10px] font-bold uppercase tracking-[0.3em]">ATHEA</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('studio')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${activeTab === 'studio' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}><LayoutGrid size={14} className="inline mr-2" /> Studio</button>
              <button onClick={() => setActiveTab('collection')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${activeTab === 'collection' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}><Bookmark size={14} className="inline mr-2" /> Bộ sưu tập</button>
            </nav>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <span className="hidden md:inline text-xs text-gray-600 font-medium">{user.name}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 max-w-[1600px] mx-auto px-6">
        {activeTab === 'studio' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100"><Settings2 size={18} className="text-fashion-accent" /><h2 className="font-bold text-gray-800">Cấu hình Studio</h2></div>

                <div className="space-y-4 mb-6">
                  {/* Multi Product Images Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Shirt size={12} /> Sản phẩm ({input.productImages.length})</span>
                      <span className="text-[9px] text-gray-400 italic">Tải nhiều góc độ</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {previews.products.map((p, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group shadow-sm">
                          <img src={p} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <button onClick={() => handleRemoveProductImage(idx)} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><Trash2 size={10} /></button>
                        </div>
                      ))}
                      {input.productImages.length < 4 && (
                        <div className="aspect-square">
                          <ImageUploader label="Thêm góc" variant="compact" onImageSelect={handleAddProductImage} onClear={() => {}} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 border-t border-gray-50 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><UserCheck size={12} /> Gương mặt mẫu</label>
                      <ImageUploader label="Tải lên Face Ref" variant="compact" currentPreview={previews.face} onImageSelect={(d, m, u) => { setInput(p => ({...p, faceReference: {data: d, mimeType: m}})); setPreviews(v => ({...v, face: u})); }} onClear={() => { setInput(p => ({...p, faceReference: {data: null, mimeType: null}})); setPreviews(v => ({...v, face: null})); }} />
                    </div>

                    <div className="space-y-2 border-t border-gray-50 pt-3">
                      <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><Layers size={12} /> Chất liệu sản phẩm</label>
                      <ImageUploader label="Fabric Ref" variant="compact" currentPreview={previews.fabric} onImageSelect={(d, m, u) => { setInput(p => ({...p, fabricReference: {data: d, mimeType: m}})); setPreviews(v => ({...v, fabric: u})); }} onClear={() => { setInput(p => ({...p, fabricReference: {data: null, mimeType: null}})); setPreviews(v => ({...v, fabric: null})); }} />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Quốc tịch người mẫu</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['VN', 'KR', 'US'].map(id => (
                      <button key={id} className={`py-2 text-[10px] font-bold rounded border transition-all ${input.modelOrigin === id ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`} onClick={() => { setInput({...input, modelOrigin: id}); }}>{id}</button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <button onClick={() => setInput(prev => ({...prev, lock_lighting: !prev.lock_lighting}))} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${input.lock_lighting ? 'bg-fashion-accent/5 border-fashion-accent/30' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2"><div className={`p-1.5 rounded-lg ${input.lock_lighting ? 'bg-fashion-accent text-white' : 'bg-gray-200'}`}>{input.lock_lighting ? <Zap size={14} /> : <ZapOff size={14} />}</div><div className="text-left"><div className="text-xs font-bold uppercase">Khóa ánh sáng</div><div className="text-[10px] text-gray-400">Giữ đồng bộ tone màu</div></div></div>
                  </button>
                </div>

                {/* Rich Scene Selection Component */}
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                    <Camera size={14} /> Bối cảnh Concept
                  </label>
                  <div className="flex overflow-x-auto pb-4 gap-3 snap-x custom-scrollbar">
                    {PRESET_SCENES.map((scene) => {
                      const Icon = scene.icon;
                      const isActive = selectedSceneId === scene.id;
                      return (
                        <button
                          key={scene.id}
                          onClick={() => setSelectedSceneId(scene.id)}
                          className={`flex-shrink-0 w-[140px] snap-start text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                            isActive 
                              ? 'border-fashion-accent bg-fashion-accent/5 shadow-md scale-[1.02]' 
                              : 'border-gray-100 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                            isActive ? 'bg-fashion-accent text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div className="space-y-1">
                            <h4 className={`text-[11px] font-bold leading-tight ${isActive ? 'text-black' : 'text-gray-800'}`}>
                              {scene.label}
                            </h4>
                            <p className="text-[9px] text-gray-500 leading-tight line-clamp-2 opacity-80">
                              {scene.description}
                            </p>
                          </div>
                          {isActive && (
                            <div className="absolute top-2 right-2">
                              <Zap size={10} className="text-fashion-accent fill-fashion-accent" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-fashion-accent mb-1 flex items-center gap-1"><PenTool size={12}/> Yêu cầu bổ sung</label>
                    <textarea placeholder="Mô tả chi tiết bạn muốn..." className="w-full bg-yellow-50/50 border border-yellow-200 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-1 focus:ring-fashion-accent/20 focus:border-fashion-accent outline-none transition-all" value={input.customDescription} onChange={(e) => setInput({...input, customDescription: e.target.value})} />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button onClick={handleAnalyze} disabled={input.productImages.length === 0 || loading.status === 'analyzing'} className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98]">
                    {loading.status === 'analyzing' ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...</> : <><Sparkles size={18} /> Chuyển bối cảnh</>}
                  </button>
                  {input.productImages.length > 0 && <button onClick={handleClearAll} className="w-full bg-white text-gray-500 text-sm font-medium py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Reset</button>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9">
              {loading.status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-700 font-medium">{loading.message}</p>
                </div>
              )}
              
              {!data && loading.status === 'idle' && (
                 <div className="flex flex-col items-center justify-center h-[600px] text-center opacity-40">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mb-6 flex items-center justify-center border-2 border-black">
                      <div className="flex flex-col items-center leading-none">
                        <span className="font-serif text-3xl font-bold">T</span>
                        <span className="font-serif text-3xl italic -mt-2 ml-4">A</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-3xl text-gray-800 mb-2">ATHEA Creative Studio</h3>
                    <p className="max-w-md text-gray-500">Tải lên tối đa 4 ảnh sản phẩm để AI thương hiệu ATHEA phân tích mọi góc độ chi tiết.</p>
                 </div>
              )}
              {loading.status === 'analyzing' && !data && (
                 <div className="flex flex-col items-center justify-center h-[600px] text-center animate-pulse">
                    <div className="w-16 h-16 border-4 border-fashion-accent border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h3 className="font-serif text-2xl text-gray-800">{loading.message}</h3>
                 </div>
              )}
              {data && (
                <div className="space-y-8 animate-fade-in pb-20">
                  <h2 className="font-serif text-3xl mb-8 flex items-center gap-3"><span className="w-8 h-[1px] bg-black"></span> 03 Concepts x 05 Poses</h2>
                  <div className="grid grid-cols-1 gap-8">
                    {data.concepts.map((concept, idx) => <ConceptCard key={concept.id} concept={concept} index={idx} userInput={input} onSave={handleSaveConcept} onUpdate={handleUpdateActiveConcept} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto min-h-[60vh]">
            <h2 className="font-serif text-3xl text-gray-900 mb-8 border-b pb-4">Bộ sưu tập ATHEA</h2>
            {savedConcepts.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                  <Bookmark size={48} className="mb-4 opacity-20" /><p className="text-lg font-medium">Chưa có concept nào được lưu</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-8">
                  {savedConcepts.map((concept, index) => <ConceptCard key={concept.id} concept={concept} index={index} userInput={input} onRemove={handleRemoveConcept} onUpdate={handleUpdateConcept} />)}
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
