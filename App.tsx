
import React, { useState, useEffect } from 'react';
import { analyzeImage } from './services/geminiService';
import { FashionAIResponse, LoadingState, UserInput, Concept, ImageRef, User } from './types';
import ImageUploader from './components/ImageUploader';
import ConceptCard from './components/ConceptCard';
import { Login } from './components/Login';
import { getApiUrl } from './utils/api';
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
  Building2,
  Coffee,
  Flower2,
  Camera,
  Anchor,
  ShoppingBag,
  Briefcase,
  GalleryVertical,
  Wind,
  Hotel,
  LogOut,
  AlertTriangle,
  Palmtree,
  Utensils,
  Store,
  Crown,
  Gift,
  Edit2
} from 'lucide-react';

const GLOBAL_LIGHTING_PROFILE = `
LIGHTING & COLOR MASTER PROFILE (MUST FOLLOW STRICTLY):
- Natural daylight, soft and flattering. Prefer early morning or late afternoon (soft golden hour), NOT harsh midday sun.
- No overhead hard light. No top-down harsh shadows.
- Key light direction: 45-degree angled side light (camera-left or camera-right), very soft (diffused) — no hard facial shadows.
- Natural ambient fill light from environment (grass / white table / walls / pavement reflection). Soft bounce fill under chin and eye area.
- Exposure: bright but balanced; highlights protected; open shadows; gentle contrast; no clipping whites.
- Aperture: large aperture look (f/1.8–f/2.8) with shallow depth of field; background blur mild-to-moderate.
- Subject separation: clear separation from background, crisp edges, subtle rim/edge light if needed (natural).
- Background: blurred enough to feel premium, but NOT mushy; preserve realistic depth and details (luxury, real).
COLOR & TONE:
- Warm-neutral overall tone. Clean whites. Avoid strong yellow cast. Avoid overly pink/magenta skin bias.
- Skin: smooth but keep real texture (pores, micro-texture). Absolutely NO plastic/waxy shine.
- For brown dresses / warm garments: lift brightness slightly, maintain rich tone, avoid muddy/flat color; preserve fabric depth and folds.
RENDERING:
- Photorealistic high-end fashion editorial, ultra high resolution, crisp garment details, realistic fabric behavior.
NEGATIVE:
- No HDR overprocessing, no harsh contrast, no orange skin, no pink skin, no blown highlights, no fake glossy skin, no overly blurred background.
`;

const STRICT_LOCK_APPEND = `
STRICT LOCK:
- Do NOT change lighting style, tone mapping, or overall grading across outputs.
- Keep consistent daylight softness and warm-neutral palette.
`;

type PresetScene = {
  id: string;
  label: string;
  description: string;
  icon: any;
  environmentPrompt?: string;
  moodTags?: string[];
  bestFor?: string[];
};

const PRESET_SCENES: PresetScene[] = [
  { 
    "id": "winter_window_boutique_chic", 
    "label": "Winter Window Boutique Chic", 
    "description": "Cozy–Chic mùa đông, sang nhẹ (quiet luxury), ấm áp trong nhà – lạnh tuyết ngoài trời; cảm giác \"boutique lookbook\" + \"lifestyle café\". Bối cảnh cốt lõi: không gian boutique/café tối giản, ánh sáng ấm, cửa kính lớn nhìn ra tuyết (cây lá vàng phủ tuyết, phố mùa đông). Điểm nhấn thị giác: outfit nổi bật trên nền trắng tuyết + nội thất be/kem + cây xanh; phụ kiện lifestyle (hoa hồng, ly coffee, mannequin trưng bày) giúp ảnh bán hàng tốt.", 
    icon: Snowflake 
  },
  { 
    "id": "holiday_boutique_chic", 
    "label": "Holiday Boutique Chic", 
    "description": "Street-style Editorial mùa lễ hội trước boutique/café. Tinh thần: sang – nhẹ nhàng – \"quiet luxury\", nữ tính, chuẩn \"rich girl aesthetic\". Bối cảnh: trước cửa boutique/café, cửa kính có tủ bánh và ánh đèn ấm; cây thông phủ tuyết + phụ kiện Noel trắng/ánh vàng + hộp quà nơ đỏ. Ánh sáng: tự nhiên mềm + đèn vàng tạo bokeh. Ảnh kiểu editorial bán hàng: rõ chất liệu, tôn dáng, \"đắt tiền\".", 
    icon: Gift 
  },
  { 
    "id": "white_lace_floral_atelier", 
    "label": "Floral Atelier", 
    "description": "Romantic-luxury, thanh lịch kiểu 'tiệm hoa / atelier váy cưới' (trắng-kem), ánh sáng mềm, nền tối giản tôn ren & phom váy. Cửa tiệm hoa/atelier tone trắng, kính lớn, tường trắng, background hoa hồng/pastel (hồng phấn, trắng kem), cảm giác 'clean bridal muse'.", 
    icon: Flower2 
  },
  { 
    "id": "yacht_pink_resort", 
    "label": "Yacht Daylight Resort", 
    "description": "Tinh thần 'quiet luxury' trên du thuyền – sang, sạch, nắng đẹp, biển xanh, nội thất yacht trắng kem + gỗ teak. Key visual: biển xanh background, boong tàu trắng, lan can inox, ghế tắm nắng, ly nước chanh, vibe 'rich vacation'.", 
    icon: Palmtree 
  },
  { 
    "id": "paris_golden_hour_executive", 
    "label": "Paris Golden Hour Executive", 
    "description": "Bối cảnh Paris/Eiffel Tower + xe sang màu đen, ánh hoàng hôn (golden hour), nền bokeh mềm. Tinh thần: sang, cổ điển, 'quiet luxury', khí chất nữ doanh nhân thành thị. Tập trung phom dáng, đường chiết eo & thắt lưng, lifestyle cao cấp.", 
    icon: Sun 
  },
  { 
    "id": "urban_cafe_executive", 
    "label": "Urban Café Executive", 
    "description": "Nữ doanh nhân thanh lịch – 'quiet luxury' – Parisian Workday Luxury. Bối cảnh: vỉa hè café / phố Tây tối giản, cửa gỗ, mặt đá, cây xanh, background bokeh. Ánh sáng: daylight mềm, hơi 'film', tương phản nhẹ. Styling: set xám pinstripe + inner cổ lọ, kính, túi da nâu, ly take-away. Góc máy: editorial thương mại - lifestyle.", 
    icon: Coffee 
  },
  { 
    "id": "garden_estate_luncheon", 
    "label": "Garden Estate Luncheon", 
    "description": "Luxury garden estate / villa lawn với các cột tân cổ điển. Bàn tiệc dài với hoa trắng, thủy tinh cao cấp. Mood: serene luxury, modern ladylike, summer high-society. Ánh sáng dịu buổi trưa, phong cách airy premium.", 
    icon: Utensils 
  },
  { 
    "id": "luxury_executive_office", 
    "label": "Luxury Executive Office", 
    "description": "Nữ doanh nhân thanh lịch trong không gian văn phòng tối giản, ánh sáng tự nhiên. Modern luxury office, floor-to-ceiling windows, light wood desk, clean background. Tone màu Ivory/Warm Neutral. Camera: 85mm portrait look, shallow depth of field.", 
    icon: Building2 
  },
  { 
    "id": "luxury_city_shopping_stroll", 
    "label": "City Shopping Stroll", 
    "description": "Editorial thời trang thương mại tại phố mua sắm cao cấp. Vitrine cửa hàng sang, mặt kính phản chiếu nhẹ, nền phố sạch. Upscale shopping street, luxury storefront windows. Mood: Elegant, premium, modern classic. Lighting: Soft natural daylight, gentle bokeh highlights.", 
    icon: ShoppingBag 
  },
  { 
    "id": "paris_golden_hour", 
    "label": "Paris Golden Hour", 
    "description": "Đường phố Paris cổ kính, ánh nắng vàng rực rỡ buổi chiều tà. Lý tưởng cho phong cách thanh lịch, chic, dạo phố cao cấp.", 
    icon: Sun 
  },
  { 
    "id": "winter_boutique", 
    "label": "Winter Boutique", 
    "description": "Không gian cửa hàng sang trọng, ánh sáng vàng ấm áp. Hoàn hảo cho phong cách Quiet Luxury, đồ len, dạ và thời trang mùa đông.", 
    icon: Snowflake 
  },
  { 
    "id": "riviera_yacht_lux", 
    "label": "Riviera Yacht Lux", 
    "description": "Boong du thuyền hiện đại, nắng gắt, biển xanh biếc. Thích hợp cho Resort wear, đồ bơi cao cấp, phong cách thượng lưu.", 
    icon: Anchor 
  },
  { 
    "id": "luxury_shopping_street", 
    "label": "Shopping Street", 
    "description": "Khu mua sắm sầm uất với các cửa hiệu kính. Dành cho phong cách Modern Commercial, năng động, streetwear cao cấp.", 
    icon: Store 
  },
  { 
    "id": "corporate_soft_office", 
    "label": "Soft Office", 
    "description": "Văn phòng hiện đại với tường kính và ánh sáng tự nhiên. Phù hợp phong cách công sở thanh lịch, nữ lãnh đạo, tối giản.", 
    icon: Briefcase 
  },
  { 
    "id": "minimal_gallery_rack", 
    "label": "Minimal Gallery", 
    "description": "Không gian triển lãm tối giản, ánh sáng studio tập trung. Tập trung vào chi tiết sản phẩm, phong cách Avant-garde, Minimalism.", 
    icon: GalleryVertical 
  },
  { 
    "id": "autumn_window_atelier", 
    "label": "Autumn Atelier", 
    "description": "Xưởng may bên cửa sổ lớn, lá vàng rơi, ánh sáng dịu. Phù hợp cho kể chuyện thời trang, phong cách Vintage, lãng mạn hoài cổ.", 
    icon: Wind 
  },
  { 
    "id": "grand_hotel_lobby_gala", 
    "label": "Hotel Lobby Gala", 
    "description": "Sảnh khách sạn 5 sao, đèn chùm lộng lẫy, ánh sáng lung linh. Dành cho váy dạ hội, phong cách Glamour, tiệc tối sang trọng.", 
    icon: Crown 
  }
];

function buildEffectiveContext(scene: PresetScene | undefined, lockLighting: boolean) {
  const sceneBlock = scene
    ? `
SCENE SELECTED:
- Scene Name: ${scene.label}
- Scene Description (environment only): ${scene.description}
${scene.environmentPrompt ? `- Environment Prompt: ${scene.environmentPrompt}` : ''}
${scene.moodTags ? `- Mood Tags: ${scene.moodTags.join(", ")}` : ''}
${scene.bestFor ? `- Best For: ${scene.bestFor.join(", ")}` : ''}
`
    : "";

  return `
${GLOBAL_LIGHTING_PROFILE}
${lockLighting ? STRICT_LOCK_APPEND : ""}

${sceneBlock}

OUTPUT REQUIREMENT:
- Generate a single coherent concept based on the uploaded product.
- Maintain the same model identity and the same outfit across all poses.
- Ensure consistent lighting + warm-neutral grading per MASTER PROFILE.
`;
}

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Đang kiểm tra authentication

  // UI state mới từ Downloads
  const [data, setData] = useState<FashionAIResponse | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<'studio' | 'collection'>('studio');
  const [selectedSceneId, setSelectedSceneId] = useState("winter_window_boutique_chic");
  
  const [savedConcepts, setSavedConcepts] = useState<Concept[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [collectionLoaded, setCollectionLoaded] = useState(false);
  const [savingConcept, setSavingConcept] = useState<{isSaving: boolean, conceptId: string | null}>({isSaving: false, conceptId: null});
  const [showSaveConfirm, setShowSaveConfirm] = useState<{show: boolean, concept: Concept | null, isUpdate?: boolean}>({show: false, concept: null, isUpdate: false});
  const [saveSuccess, setSaveSuccess] = useState<{show: boolean, isUpdate: boolean}>({show: false, isUpdate: false});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean, conceptId: string | null, conceptName: string}>({show: false, conceptId: null, conceptName: ''});
  const [deletingConcept, setDeletingConcept] = useState<{isDeleting: boolean, conceptId: string | null}>({isDeleting: false, conceptId: null});
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // State để theo dõi dữ liệu chưa lưu
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedStudioChanges, setHasUnsavedStudioChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [unsavedWarningSource, setUnsavedWarningSource] = useState<'studio' | 'collection'>('collection');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [localCollectionState, setLocalCollectionState] = useState<Map<string, Concept>>(new Map());
  const [baselineCollectionState, setBaselineCollectionState] = useState<Map<string, Concept>>(new Map()); // Trạng thái ban đầu khi load từ Drive

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

  // --- CODE MỚI: Kiểm tra user từ localStorage khi load lại trang ---
  useEffect(() => {
    const checkStoredUser = async () => {
      setIsCheckingAuth(true);
      try {
        const storedUserStr = localStorage.getItem('athea_user');
        if (!storedUserStr) {
          // Không có user trong localStorage
          setIsCheckingAuth(false);
          return;
        }

        const storedUser = JSON.parse(storedUserStr);
        if (!storedUser || !storedUser.id) {
          // User không hợp lệ
          localStorage.removeItem('athea_user');
          setIsCheckingAuth(false);
          return;
        }

        // Gọi API để verify user status
        const response = await fetch(getApiUrl('/api/auth'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify',
            id: storedUser.id
          })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          // User hợp lệ và đã được APPROVED
          setUser(data.user);
          // Cập nhật localStorage với thông tin mới nhất từ server
          localStorage.setItem('athea_user', JSON.stringify(data.user));
        } else {
          // User không tồn tại hoặc không phải APPROVED
          console.log('User không hợp lệ hoặc chưa được duyệt:', data.message);
          localStorage.removeItem('athea_user');
          setUser(null);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra user:', error);
        // Nếu có lỗi, xóa localStorage để đảm bảo an toàn
        localStorage.removeItem('athea_user');
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkStoredUser();
  }, []); // Chỉ chạy một lần khi component mount

  // --- CODE MỚI: Tải bộ sưu tập từ Google Drive ---
  useEffect(() => {
    // Chỉ tải khi đang ở tab Collection và đã có User ID
    if (activeTab === 'collection' && user && (user as any).id) {
      console.log("Đang tải dữ liệu từ Drive...");
      setLoadingCollection(true);
      setCollectionLoaded(false);

      fetch(getApiUrl('/api/collection'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'load',
          userId: (user as any).id
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.concepts)) {
            setSavedConcepts(data.concepts);
            // Khởi tạo baseline và localCollectionState với concepts đã load
            const initialState = new Map<string, Concept>();
            data.concepts.forEach((concept: Concept) => {
              initialState.set(concept.id, concept);
            });
            // Lưu baseline và local state
            const baselineMap = new Map<string, Concept>();
            const localMap = new Map<string, Concept>();
            data.concepts.forEach((concept: Concept) => {
              baselineMap.set(concept.id, concept);
              localMap.set(concept.id, concept);
            });
            setBaselineCollectionState(baselineMap);
            setLocalCollectionState(localMap);
            setHasUnsavedChanges(false);
          } else {
            setSavedConcepts([]);
            setBaselineCollectionState(new Map());
            setLocalCollectionState(new Map());
            setHasUnsavedChanges(false);
          }
          setCollectionLoaded(true);
        })
        .catch(err => {
          console.error("Lỗi tải bộ sưu tập:", err);
          setSavedConcepts([]);
          setCollectionLoaded(true);
        })
        .finally(() => {
          setLoadingCollection(false);
        });
    } else if (activeTab !== 'collection') {
      // Reset khi chuyển tab
      setLoadingCollection(false);
      setCollectionLoaded(false);
    }
  }, [activeTab, user]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('athea_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    // Kiểm tra unsaved changes trước khi đăng xuất
    if (hasUnsavedChanges || hasUnsavedStudioChanges) {
      const source = hasUnsavedChanges ? 'collection' : 'studio';
      handlePendingAction(() => {
        setUser(null);
        localStorage.removeItem('athea_user');
        setData(null);
        setSavedConcepts([]);
        setLocalCollectionState(new Map<string, Concept>());
        setBaselineCollectionState(new Map<string, Concept>());
        setHasUnsavedChanges(false);
        setHasUnsavedStudioChanges(false);
        setActiveTab('studio');
      }, source);
    } else {
      setUser(null);
      localStorage.removeItem('athea_user');
      setData(null);
      setSavedConcepts([]);
      setLocalCollectionState(new Map<string, Concept>());
      setBaselineCollectionState(new Map<string, Concept>());
      setActiveTab('studio');
    }
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

  const handleSaveConcept = async (concept: Concept) => {
    // Kiểm tra xem có User ID chưa
    if (!user || !(user as any).id) {
      alert("Vui lòng đăng nhập lại để lưu.");
      return;
    }

    // Kiểm tra xem concept đã tồn tại chưa để hiển thị dialog phù hợp
    const generateStableId = (concept: Concept): string => {
      if (concept.id && concept.id.startsWith('saved-')) {
        return concept.id;
      }
      const name = (concept.concept_name_vn || concept.concept_name_en || concept.id || 'concept').toLowerCase().replace(/\s+/g, '_');
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return `saved-${Math.abs(hash).toString(36)}`;
    };
    const conceptId = generateStableId(concept);
    const isExisting = savedConcepts.some(c => c.id === conceptId);

    // Hiển thị dialog xác nhận (cho phép cả khi đang tải để có thể cập nhật)
    setShowSaveConfirm({ show: true, concept, isUpdate: isExisting });
  };

  const confirmSaveConcept = async () => {
    const conceptToSave = showSaveConfirm.concept;
    if (!conceptToSave || !user || !(user as any).id) {
      setShowSaveConfirm({ show: false, concept: null });
      return;
    }

    // Đóng dialog xác nhận
    setShowSaveConfirm({ show: false, concept: null });

    // Tạo ID cố định dựa trên concept_name để đảm bảo cùng concept sẽ có cùng ID
    // Sử dụng hash đơn giản từ concept_name để tạo ID ổn định
    const generateStableId = (concept: Concept): string => {
      // Nếu đã có ID saved- thì giữ nguyên
      if (concept.id && concept.id.startsWith('saved-')) {
        return concept.id;
      }
      // Tạo ID mới dựa trên tên concept (ổn định, không thay đổi)
      const name = (concept.concept_name_vn || concept.concept_name_en || concept.id || 'concept').toLowerCase().replace(/\s+/g, '_');
      // Tạo hash đơn giản từ tên
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `saved-${Math.abs(hash).toString(36)}`;
    };
    
    const conceptId = generateStableId(conceptToSave);
    // Đảm bảo input được lưu cùng concept (để dùng lại khi tạo ảnh)
    const newConcept = { 
      ...conceptToSave, 
      id: conceptId,
      input: input // Lưu input (productImages, faceReference, fabricReference) cùng concept
    };
    
    // Kiểm tra xem concept đã tồn tại trong savedConcepts chưa (dựa trên ID)
    const isExisting = savedConcepts.some(c => c.id === conceptId);
    
    // Cập nhật showSaveConfirm để biết đang update hay create
    setShowSaveConfirm(prev => ({ ...prev, isUpdate: isExisting }));

    // Hiển thị loading animation
    setSavingConcept({ isSaving: true, conceptId });

    try {
      // Gửi dữ liệu lên Server để lưu vào Drive
      const response = await fetch(getApiUrl('/api/collection'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          userId: (user as any).id,
          conceptData: newConcept,
          conceptId: conceptId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Cập nhật giao diện sau khi lưu thành công
        if (isExisting) {
          // Update concept đã tồn tại
          setSavedConcepts(prev => prev.map(c => c.id === conceptId ? newConcept : c));
        } else {
          // Thêm concept mới
          setSavedConcepts(prev => [newConcept, ...prev]);
        }
        
        // Reset unsaved changes cho concept này vì đã được lưu
        // Cập nhật cả baseline và local state
        setBaselineCollectionState(prev => {
          const next = new Map(prev);
          next.set(conceptId, newConcept);
          return next;
        });
        setLocalCollectionState(prev => {
          const next = new Map(prev);
          next.set(conceptId, newConcept);
          return next;
        });
        setHasUnsavedChanges(false);
        
        // Hiển thị thông báo thành công
        setSaveSuccess({ show: true, isUpdate: isExisting });
        setTimeout(() => setSaveSuccess({ show: false, isUpdate: false }), 3000);
        
        console.log(isExisting ? "Đã cập nhật concept trên Drive" : "Đã lưu concept vào Drive");
      } else {
        throw new Error(result.message || 'Lỗi lưu concept');
      }
    } catch (error) {
      console.error("Lỗi lưu concept:", error);
      alert("Không thể lưu concept. Vui lòng thử lại sau.");
    } finally {
      // Tắt loading animation
      setSavingConcept({ isSaving: false, conceptId: null });
    }
  };

  const handleUpdateActiveConcept = (updatedConcept: Concept) => {
    setData(prev => {
      if (!prev) return prev;
      const newConcepts = prev.concepts.map(c => c.id === updatedConcept.id ? updatedConcept : c);
      return { ...prev, concepts: newConcepts };
    });
  };

  const handleUpdateConcept = (updatedConcept: Concept) => {
    // Cập nhật local state để theo dõi thay đổi (KHÔNG cập nhật savedConcepts ngay)
    setLocalCollectionState(prev => {
      const next = new Map<string, Concept>(prev);
      next.set(updatedConcept.id, updatedConcept);
      
      // Kiểm tra xem có thay đổi chưa lưu không (so sánh với baseline)
      const baselineConcept = baselineCollectionState.get(updatedConcept.id);
      if (baselineConcept) {
        const hasChanges = hasConceptChanged(baselineConcept, updatedConcept);
        // Kiểm tra các concept khác
        let otherHasChanges = false;
        next.forEach((localConcept, conceptId) => {
          if (conceptId !== updatedConcept.id) {
            const otherBaseline = baselineCollectionState.get(conceptId);
            if (otherBaseline && hasConceptChanged(otherBaseline, localConcept)) {
              otherHasChanges = true;
            }
          }
        });
        setHasUnsavedChanges(hasChanges || otherHasChanges);
      } else {
        // Nếu không có baseline, có thể là concept mới, không tính là unsaved
        // Kiểm tra các concept khác
        let otherHasChanges = false;
        next.forEach((localConcept, conceptId) => {
          const otherBaseline = baselineCollectionState.get(conceptId);
          if (otherBaseline && hasConceptChanged(otherBaseline, localConcept)) {
            otherHasChanges = true;
          }
        });
        setHasUnsavedChanges(otherHasChanges);
      }
      
      return next;
    });
    
    // Cập nhật savedConcepts và localStorage để hiển thị UI (nhưng vẫn giữ baseline để so sánh)
    const newCollection = savedConcepts.map(c => c.id === updatedConcept.id ? updatedConcept : c);
    setSavedConcepts(newCollection);
    localStorage.setItem('fashionAI_savedConcepts', JSON.stringify(newCollection));
  };
  
  // Hàm kiểm tra xem một concept có thay đổi so với baseline không
  const hasConceptChanged = (baseline: Concept, current: Concept): boolean => {
    if (!baseline.poses || !current.poses) return false;
    
    for (let i = 0; i < current.poses.length; i++) {
      const currentPose = current.poses[i];
      const baselinePose = baseline.poses[i];
      
      if (!baselinePose) continue;
      
      // Kiểm tra generated_image mới
      if (currentPose.generated_image && currentPose.generated_image !== baselinePose.generated_image) {
        return true;
      }
      
      // Kiểm tra prompt đã thay đổi
      if (currentPose.pose_prompt !== baselinePose.pose_prompt) {
        return true;
      }
      
      // Kiểm tra lock states đã thay đổi
      if (currentPose.is_face_locked !== baselinePose.is_face_locked || 
          currentPose.is_outfit_locked !== baselinePose.is_outfit_locked) {
        return true;
      }
    }
    
    return false;
  };
  
  // Hàm kiểm tra các concept khác có thay đổi không
  const checkOtherConceptsHaveChanges = (localState: Map<string, Concept>): boolean => {
    let hasChanges = false;
    localState.forEach((localConcept, conceptId) => {
      const baselineConcept = baselineCollectionState.get(conceptId);
      if (baselineConcept && hasConceptChanged(baselineConcept, localConcept)) {
        hasChanges = true;
      }
    });
    return hasChanges;
  };
  
  // Hàm kiểm tra xem có dữ liệu chưa lưu không (so sánh với baseline)
  const checkUnsavedChanges = () => {
    const hasChanges = checkOtherConceptsHaveChanges(localCollectionState);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };
  
  // Hàm xử lý khi người dùng muốn thực hiện action có thể mất dữ liệu
  const handlePendingAction = (action: () => void, source: 'studio' | 'collection' = 'collection') => {
    const hasChanges = source === 'studio' ? hasUnsavedStudioChanges : hasUnsavedChanges;
    if (hasChanges) {
      setUnsavedWarningSource(source);
      setPendingAction(() => action);
      setShowUnsavedWarning(true);
    } else {
      action();
    }
  };
  
  // Hàm xác nhận bỏ qua cảnh báo và thực hiện action
  const confirmDiscardChanges = () => {
    setShowUnsavedWarning(false);
    
    if (unsavedWarningSource === 'studio') {
      // Reset Studio state
      setHasUnsavedStudioChanges(false);
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
    } else {
      // Reset Collection state
      setHasUnsavedChanges(false);
      // Reset local state về baseline
      const resetMap = new Map<string, Concept>();
      baselineCollectionState.forEach((concept, id) => {
        resetMap.set(id, concept);
      });
      setLocalCollectionState(resetMap);
      // Reload savedConcepts từ baseline
      const resetConcepts: Concept[] = [];
      baselineCollectionState.forEach((concept) => {
        resetConcepts.push(concept);
      });
      setSavedConcepts(resetConcepts);
    }
    
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };
  
  // Hàm hủy bỏ action
  const cancelPendingAction = () => {
    setShowUnsavedWarning(false);
    setPendingAction(null);
  };
  
  // Thêm beforeunload handler để cảnh báo khi đóng tab/tải lại trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || hasUnsavedStudioChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // Some browsers require return value
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, hasUnsavedStudioChanges]);
  
  // Kiểm tra unsaved changes khi localCollectionState thay đổi
  useEffect(() => {
    if (activeTab === 'collection' && localCollectionState.size > 0) {
      checkUnsavedChanges();
    }
  }, [localCollectionState, activeTab]);

  // Kiểm tra dữ liệu chưa lưu ở Studio (có input hoặc data chưa được lưu)
  useEffect(() => {
    if (activeTab === 'studio') {
      // Có dữ liệu chưa lưu nếu:
      // 1. Có input (productImages, faceReference, fabricReference, customDescription)
      // 2. Hoặc có data (concepts đã generate) nhưng chưa lưu vào collection
      const hasInput = input.productImages.length > 0 || 
                       input.faceReference.data !== null || 
                       input.fabricReference.data !== null || 
                       input.customDescription.trim() !== '';
      const hasData = data !== null;
      setHasUnsavedStudioChanges(hasInput || hasData);
    } else {
      setHasUnsavedStudioChanges(false);
    }
  }, [input, data, activeTab]);

  const handleRemoveConcept = (id: string) => {
    // Chặn nếu đang tải collection
    if (loadingCollection) {
      alert("Đang trong quá trình tải dữ liệu. Vui lòng đợi hoàn tất rồi thử lại sau.");
      return;
    }
    
    // Tìm concept để lấy tên hiển thị trong dialog
    const concept = savedConcepts.find(c => c.id === id);
    if (concept) {
      setShowDeleteConfirm({ 
        show: true, 
        conceptId: id, 
        conceptName: concept.concept_name_vn || concept.concept_name_en || 'Concept này' 
      });
    }
  };

  const confirmDeleteConcept = async () => {
    const conceptIdToDelete = showDeleteConfirm.conceptId;
    if (!conceptIdToDelete || !user || !(user as any).id) {
      setShowDeleteConfirm({ show: false, conceptId: null, conceptName: '' });
      return;
    }

    // Đóng dialog xác nhận
    setShowDeleteConfirm({ show: false, conceptId: null, conceptName: '' });

    // Hiển thị loading animation
    setDeletingConcept({ isDeleting: true, conceptId: conceptIdToDelete });

    try {
      // Gọi API để xóa concept và tất cả ảnh liên quan trên Drive
      const response = await fetch(getApiUrl('/api/collection'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any).id,
          conceptId: conceptIdToDelete
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Cập nhật giao diện sau khi xóa thành công
        const newCollection = savedConcepts.filter(c => c.id !== conceptIdToDelete);
        setSavedConcepts(newCollection);
        
        // Hiển thị thông báo thành công
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
        
        console.log("Đã xóa concept và tất cả ảnh liên quan từ Drive");
      } else {
        throw new Error(result.message || 'Lỗi xóa concept');
      }
    } catch (error) {
      console.error("Lỗi xóa concept:", error);
      alert("Không thể xóa concept. Vui lòng thử lại sau.");
    } finally {
      // Tắt loading animation
      setDeletingConcept({ isDeleting: false, conceptId: null });
    }
  };

  const handleAnalyze = async () => {
    if (input.productImages.length === 0) return;

    setData(null);
    setLoading({ status: 'analyzing', message: 'Hệ thống ATHEA đang thiết kế concept chuyên biệt...' });

    const selectedScene = PRESET_SCENES.find(s => s.id === selectedSceneId);
    const effectiveContext = buildEffectiveContext(selectedScene, input.lock_lighting);

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
    // Reset tất cả state về trạng thái ban đầu
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
    // Reset unsaved changes flag để cho phép thao tác mới
    setHasUnsavedStudioChanges(false);
  };

  // Hiển thị loading screen khi đang kiểm tra authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-fashion-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show Login Screen - giữ lại từ code cũ
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Authenticated Application - UI mới từ Downloads
  return (
    <div className="min-h-screen bg-gray-50 text-fashion-black font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => {
            if (activeTab === 'collection' && hasUnsavedChanges) {
              handlePendingAction(() => setActiveTab('studio'), 'collection');
            } else if (activeTab === 'studio' && hasUnsavedStudioChanges) {
              handlePendingAction(() => setActiveTab('studio'), 'studio');
            } else {
              setActiveTab('studio');
            }
          }}>
            <AtheaLogo />
            <div className="flex flex-col leading-none">
               <h1 className="font-serif text-lg font-bold tracking-tight">Giám Đốc Sáng Tạo</h1>
               <span className="text-fashion-accent text-[10px] font-bold uppercase tracking-[0.3em]">ATHEA</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button onClick={() => {
                if (activeTab === 'collection' && hasUnsavedChanges) {
                  handlePendingAction(() => setActiveTab('studio'), 'collection');
                } else {
                  setActiveTab('studio');
                }
              }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${activeTab === 'studio' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}><LayoutGrid size={14} className="inline mr-2" /> Studio</button>
              <button onClick={() => {
                // Chuyển từ Studio sang Collection: giữ nguyên data, không cảnh báo
                setActiveTab('collection');
              }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${activeTab === 'collection' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}><Bookmark size={14} className="inline mr-2" /> Bộ sưu tập</button>
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
                          <ImageUploader 
                            key={`product-uploader-${input.productImages.length}`}
                            label="Thêm góc" 
                            variant="compact" 
                            onImageSelect={handleAddProductImage} 
                            onClear={() => {}} 
                          />
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
                    {data.concepts.map((concept, idx) => <ConceptCard key={concept.id} concept={concept} index={idx} userInput={input} onSave={handleSaveConcept} onUpdate={handleUpdateActiveConcept} userId={(user as any)?.id} isLoadingCollection={loadingCollection} isSaved={savedConcepts.some(c => {
                      // Check xem concept này đã được lưu chưa dựa trên tên
                      const savedName = c.concept_name_vn || c.concept_name_en;
                      const currentName = concept.concept_name_vn || concept.concept_name_en;
                      return savedName === currentName;
                    })} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto min-h-[60vh]">
            <h2 className="font-serif text-3xl text-gray-900 mb-8 border-b pb-4">Bộ sưu tập ATHEA</h2>
            {loadingCollection ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 border-4 border-fashion-accent border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-gray-600 font-medium">Đang tải dữ liệu từ Drive...</p>
              </div>
            ) : collectionLoaded && savedConcepts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <Bookmark size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Không tìm thấy dữ liệu nào</p>
                <p className="text-sm text-gray-400 mt-2">Bạn chưa lưu concept nào vào bộ sưu tập</p>
              </div>
            ) : savedConcepts.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {savedConcepts.map((concept, index) => {
                  // LUÔN dùng input từ concept đã lưu (đã được restore từ Drive)
                  // Không fallback về input từ state vì state có thể bị reset khi load lại trang
                  const conceptUserInput = (concept as any).input;
                  
                  // Ưu tiên dùng input từ concept, fallback về input từ state nếu cần
                  // ConceptCard sẽ tự kiểm tra và hiển thị thông báo nếu không có input hợp lệ
                  const finalUserInput = conceptUserInput || input;
                  
                  return <ConceptCard 
                    key={concept.id} 
                    concept={concept} 
                    index={index} 
                    userInput={finalUserInput} 
                    onSave={handleSaveConcept} 
                    onRemove={handleRemoveConcept} 
                    onUpdate={(updatedConcept) => {
                      handleUpdateConcept(updatedConcept);
                      // Cập nhật local state để theo dõi thay đổi
                      setLocalCollectionState(prev => {
                        const next = new Map(prev);
                        next.set(updatedConcept.id, updatedConcept);
                        return next;
                      });
                    }} 
                    userId={(user as any)?.id} 
                    isLoadingCollection={loadingCollection} 
                    isSaved={true} 
                  />;
                })}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Dialog xác nhận lưu/cập nhật */}
      {showSaveConfirm.show && showSaveConfirm.concept && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in-down">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">
              {showSaveConfirm.isUpdate ? "Xác nhận cập nhật Concept" : "Xác nhận lưu Concept"}
            </h3>
            <p className="text-gray-600 mb-6">
              {showSaveConfirm.isUpdate 
                ? <>Bạn có chắc chắn muốn cập nhật concept <strong>"{showSaveConfirm.concept.concept_name_vn}"</strong>? Các thay đổi sẽ được lưu vào bộ sưu tập.</>
                : <>Bạn có chắc chắn muốn lưu concept <strong>"{showSaveConfirm.concept.concept_name_vn}"</strong> vào bộ sưu tập?</>}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveConfirm({ show: false, concept: null, isUpdate: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmSaveConcept}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors flex items-center gap-2"
              >
                {showSaveConfirm.isUpdate ? (
                  <>
                    <Edit2 size={16} />
                    Xác nhận cập nhật
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    Xác nhận lưu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading animation khi đang lưu */}
      {savingConcept.isSaving && (
        <div className="fixed inset-0 z-[199] bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-fade-in-down">
            <div className="w-16 h-16 border-4 border-fashion-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Đang lưu concept vào bộ sưu tập...</p>
            <p className="text-gray-400 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {/* Dialog cảnh báo mất dữ liệu chưa lưu */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in-down">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">
                  Cảnh báo: Dữ liệu chưa lưu
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {unsavedWarningSource === 'studio' 
                    ? 'Bạn có dữ liệu chưa được lưu trong Studio. Nếu tiếp tục, tất cả các thay đổi chưa lưu sẽ bị mất.'
                    : 'Bạn có dữ liệu chưa được lưu trong Bộ sưu tập. Nếu tiếp tục, tất cả các thay đổi chưa lưu sẽ bị mất.'}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Vui lòng lưu các thay đổi trước khi tiếp tục hoặc xác nhận để bỏ qua.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={cancelPendingAction}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDiscardChanges}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors flex items-center gap-2"
              >
                <AlertTriangle size={16} />
                Bỏ qua và tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo thành công */}
      {saveSuccess.show && (
        <div className="fixed top-24 right-6 z-[200] bg-green-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-fade-in-down">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {saveSuccess.isUpdate ? (
              <Edit2 size={18} className="fill-white" />
            ) : (
              <Bookmark size={18} className="fill-white" />
            )}
          </div>
          <div>
            <p className="font-bold">{saveSuccess.isUpdate ? "Cập nhật thành công!" : "Lưu thành công!"}</p>
            <p className="text-sm text-white/90">
              {saveSuccess.isUpdate 
                ? "Concept đã được cập nhật trong bộ sưu tập"
                : "Concept đã được lưu vào bộ sưu tập"}
            </p>
          </div>
        </div>
      )}

      {/* Dialog xác nhận xóa */}
      {showDeleteConfirm.show && showDeleteConfirm.conceptId && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in-down">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Xác nhận xóa Concept</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa concept <strong>"{showDeleteConfirm.conceptName}"</strong>?
              <br />
              <span className="text-sm text-red-600 font-medium">Hành động này sẽ xóa vĩnh viễn concept và tất cả ảnh liên quan trên Drive.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm({ show: false, conceptId: null, conceptName: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteConcept}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading animation khi đang xóa */}
      {deletingConcept.isDeleting && (
        <div className="fixed inset-0 z-[199] bg-black/30 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-fade-in-down">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Đang xóa concept và tất cả ảnh liên quan...</p>
            <p className="text-gray-400 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {/* Thông báo xóa thành công */}
      {deleteSuccess && (
        <div className="fixed top-24 right-6 z-[200] bg-red-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-fade-in-down">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Trash2 size={18} className="fill-white" />
          </div>
          <div>
            <p className="font-bold">Xóa thành công!</p>
            <p className="text-sm text-white/90">Concept và tất cả ảnh đã được xóa khỏi Drive</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
