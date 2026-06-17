/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, RefreshCw, Layers, Sparkles, 
  Trees, Landmark, Compass, Heart, Map, List, EyeOff 
} from 'lucide-react';

import Header from './components/Header';
import CampCard from './components/CampCard';
import CampsMap from './components/CampsMap';
import CampDetails from './components/CampDetails';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import ContactPage from './components/ContactPage';
import SponsorPage from './components/SponsorPage';
import AdBanner from './components/AdBanner';
import { CAMP_SITES } from './data/camps';
import { CampSite, CampType, Review } from './types';
import { auth, signOut, onAuthStateChanged, db } from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Initialize campsites by recalculating ratings based on reviews in localStorage
  const [camps, setCamps] = useState<CampSite[]>([]);

  // Selected camp for viewing details
  const [selectedCamp, setSelectedCamp] = useState<CampSite | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CampType | 'all'>('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // AI recommendations state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<{
    recommendedCampId: string;
    reason: string;
    tips: string;
    note?: string;
    fallbackUsed?: boolean;
    fallbackReason?: string;
  } | null>(null);

  // Mobile View Mode Toggle (Map vs List)
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('camp_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Track the custom url path listener
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle programmatic stateful SPA updates
  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Monitor Auth session state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Try getting cached role first for immediate and offline-friendly responsiveness
        const cachedRole = localStorage.getItem(`user_role_${currentUser.uid}`);
        if (cachedRole) {
          setUserRole(cachedRole);
        }

        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            const role = snapshot.data().role || 'user';
            setUserRole(role);
            localStorage.setItem(`user_role_${currentUser.uid}`, role);
          } else {
            setUserRole('user');
            localStorage.setItem(`user_role_${currentUser.uid}`, 'user');
          }
        } catch (err: any) {
          // If we are offline or Firestore is unreachable, report nicely to console as info/warning rather than throwing a severe error
          const isOfflineMsg = err?.message && (
            err.message.toLowerCase().includes('offline') || 
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('failed to get document')
          );
          if (isOfflineMsg) {
            console.info('CampHub App is operating in offline-safe mode. Loaded cached or default role.');
          } else {
            console.warn('Unable to synchronize role from cloud database:', err?.message || err);
          }
          if (!cachedRole) {
            setUserRole('user');
          }
        }
      } else {
        setUserRole('user');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Calculate current ratings upon component mount or when selectedCamp triggers update
  useEffect(() => {
    const initializedCamps = CAMP_SITES.map(camp => {
      const stored = localStorage.getItem(`reviews_${camp.id}`);
      if (stored) {
        const reviews: Review[] = JSON.parse(stored);
        if (reviews.length > 0) {
          const total = reviews.reduce((sum, r) => sum + r.rating, 0);
          return { ...camp, rating: parseFloat((total / reviews.length).toFixed(1)) };
        }
      }
      return camp;
    });
    setCamps(initializedCamps);
  }, []);

  // Sync favorites with localStorage
  useEffect(() => {
    localStorage.setItem('camp_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // List of active filter tags mapping
  const amenitiesFilters = [
    { label: '🔌 พ่วงไฟฟ้า', value: 'ไฟฟ้า' },
    { label: '📶 Wi-Fi', value: 'Wi-Fi' },
    { label: '🚿 เครื่องทำน้ำอุ่น/ฝักบัว', value: 'อุ่น' },
    { label: '☕ คาเฟ่ & อาหาร', value: 'อาหาร' },
    { label: '🥩 บาร์บีคิว/เตาปิ้ง', value: 'บาร์บีคิว' },
    { label: '🚣 กิจกรรมริมน้ำ/ลำธาร', value: 'น้ำ' },
    { label: '👮 เจ้าหน้าที่ดูแล 24 ชม.', value: 'เจ้าหน้าที่' }
  ];

  // Toggle favorite site
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection click
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(favId => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Callback to update campground ratings in parent state when visitor posts a review
  const handleUpdateRating = (campId: string, newRating: number) => {
    setCamps(prev => 
      prev.map(c => c.id === campId ? { ...c, rating: newRating } : c)
    );
    // Sync detailed selection rating so rating changes reflect instantly inside details
    setSelectedCamp(prev => 
      prev && prev.id === campId ? { ...prev, rating: newRating } : prev
    );
  };

  // Toggle amenity selection state
  const handleToggleAmenity = (value: string) => {
    setSelectedAmenities(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Clear all current search filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setSelectedAmenities([]);
    setShowFavoritesOnly(false);
    setAiRecommendation(null);
    setAiError(null);
  };

  const handleGetAiRecommendation = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiRecommendation(null);
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm,
          filterType,
          selectedAmenities,
          favorites,
          showFavoritesOnly,
        }),
      });

      if (!response.ok) {
        throw new Error('ขออภัย แอปไม่สามารถเชื่อมต่อเซิร์ฟเวอร์แนะนำด้วย AI ในขณะนี้ ได้โปรดตรวจสอบสภาพเครือข่ายแล้วลองอีกครั้ง');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiRecommendation(data);
    } catch (err: any) {
      console.error('AI Recommendation Error:', err);
      setAiError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลจากผู้แนะนำ AI ของเรา');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Core Search & Filtering logic
  const filteredCamps = useMemo(() => {
    return camps.filter(camp => {
      // 1. Filter by Favorites Toggle
      if (showFavoritesOnly && !favorites.includes(camp.id)) {
        return false;
      }

      // 2. Filter by Type (national, private, all)
      if (filterType !== 'all' && camp.type !== filterType) {
        return false;
      }

      // 3. Filter by Amenities tags (must contain all selected amenities keywords)
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every(keyword => {
          return camp.amenities.some(amenity => 
            amenity.toLowerCase().includes(keyword.toLowerCase())
          );
        });
        if (!hasAllAmenities) return false;
      }

      // 4. Search by keyword across name, province, descriptions, and amenities
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = camp.name.toLowerCase().includes(query);
        const matchesNameEn = camp.nameEn.toLowerCase().includes(query);
        const matchesProvince = camp.province.toLowerCase().includes(query);
        const matchesDesc = camp.description.toLowerCase().includes(query);
        const matchesAmenities = camp.amenities.some(a => a.toLowerCase().includes(query));

        return matchesName || matchesNameEn || matchesProvince || matchesDesc || matchesAmenities;
      }

      return true;
    });
  }, [camps, filterType, selectedAmenities, searchTerm, showFavoritesOnly, favorites]);

  // Handle campground card select (opens Details and zooms map marker)
  const handleSelectCamp = (camp: CampSite) => {
    setSelectedCamp(camp);
    // If on mobile, auto-switch to map/details view to instantly show the detail page content
    setMobileViewMode('map');
  };

  if (currentPath === '/auth') {
    return <AuthPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/profile') {
    if (!user) {
      handleNavigate('/auth');
      return null;
    }
    return <ProfilePage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (currentPath === '/admin') {
    return <AdminPage user={user} userRole={userRole} onNavigate={handleNavigate} />;
  }

  if (currentPath === '/contact') {
    return <ContactPage onNavigate={handleNavigate} />;
  }

  if (currentPath === '/sponsor') {
    return <SponsorPage user={user} onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-sand-50 pb-12 text-forest-950 selection:bg-forest-100 selection:text-forest-900">
      
      {/* Top Banner & Header */}
      <Header
        favoritesCount={favorites.length}
        onShowFavorites={() => {
          setShowFavoritesOnly(prev => !prev);
          setSelectedCamp(null); // Clear selected details to return to list
        }}
        showFavoritesOnly={showFavoritesOnly}
        totalCamps={camps.length}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Mobile quick toggler (List vs Map) */}
        <div className="flex md:hidden items-center justify-center bg-sand-100 p-1.5 rounded-2xl mb-5 space-x-2 border border-sand-200">
          <button
            id="mobile-view-list-btn"
            onClick={() => setMobileViewMode('list')}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold gap-1.5 transition-all ${
              mobileViewMode === 'list'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="h-4 w-4" />
            <span>รายการแคมป์ ({filteredCamps.length})</span>
          </button>
          
          <button
            id="mobile-view-map-btn"
            onClick={() => setMobileViewMode('map')}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-semibold gap-1.5 transition-all ${
              mobileViewMode === 'map'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Map className="h-4 w-4" />
            <span>แผนที่สีป่าเกลี่ยบุด ({camps.length})</span>
          </button>
        </div>

        {/* Outer Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Filters and Card Listings */}
          <div className={`space-y-6 lg:col-span-6 xl:col-span-5 ${
            mobileViewMode === 'list' ? 'block' : 'hidden md:block'
          }`}>
            
            {/* Filtering Box Container */}
            <div className="bg-white rounded-3xl border border-sand-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-forest-700" />
                  ตัวกรองแคมป์ปิ้งสายธรรมชาติ
                </h2>
                {(searchTerm || filterType !== 'all' || selectedAmenities.length > 0) && (
                  <button
                    id="clear-all-filters-link"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-earth-600 hover:text-earth-500 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}
              </div>

              {/* Text Word Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  id="camp-keyword-search-field"
                  type="text"
                  placeholder="ค้นหาด้วยชื่อลาน, จังหวัด, หรือคำค้น (เช่น ลำธาร, คาเฟ่)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-sand-50/50 border border-sand-200 focus:outline-hidden focus:ring-1 focus:ring-forest-600 focus:border-forest-600 text-xs sm:text-sm text-stone-800 transition-all shadow-inner"
                />
              </div>

              {/* Type Category selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-600 block">
                  ประเภทสถานที่กางเต็นท์
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-sand-50 rounded-2xl border border-sand-100">
                  <button
                    id="type-[all]-filter-btn"
                    onClick={() => setFilterType('all')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      filterType === 'all'
                        ? 'bg-white text-forest-900 shadow-xs border border-sand-200/50'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>ทั้งหมด</span>
                  </button>

                  <button
                    id="type-[national]-filter-btn"
                    onClick={() => setFilterType('national')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      filterType === 'national'
                        ? 'bg-forest-900 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Trees className="h-3.5 w-3.5" />
                    <span>อุทยาน</span>
                  </button>

                  <button
                    id="type-[private]-filter-btn"
                    onClick={() => setFilterType('private')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      filterType === 'private'
                        ? 'bg-earth-800 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>เอกชน</span>
                  </button>
                </div>
              </div>

              {/* Toggle to expand advanced amenities selection */}
              <div className="space-y-2 pt-1">
                <button
                  id="toggle-advanced-amenities-panel"
                  onClick={() => setIsFilterPanelOpen(prev => !prev)}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 py-1"
                >
                  <span>กรองจากสิ่งอำนวยความสะดวก</span>
                  <span className="text-[10px] text-forest-700 font-semibold bg-forest-100/60 px-2.5 py-0.5 rounded-full border border-forest-200">
                    {isFilterPanelOpen ? 'ซ่อน' : 'เลือกสิ่งอำนวยความสะดวก'}
                  </span>
                </button>

                {isFilterPanelOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-1.5 pt-1.5"
                  >
                    {amenitiesFilters.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.value);
                      return (
                        <button
                          key={amenity.value}
                          id={`amenity-badge-${amenity.value}`}
                          onClick={() => handleToggleAmenity(amenity.value)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all duration-300 border ${
                            isSelected
                              ? 'bg-forest-100 text-forest-800 border-forest-300 shadow-inner'
                              : 'bg-sand-50/50 hover:bg-sand-100 text-stone-600 border-sand-200'
                          }`}
                        >
                          {amenity.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            {/* AI Recommendation Widget block with Gemini */}
            <div className="bg-gradient-to-br from-[#fbf8f3] via-amber-50/20 to-orange-50/30 border border-amber-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl text-white shadow-xs">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      CampHub AI ผู้จัดทริปอัจฉริยะ
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      แนะนำลานกางเต็นท์พรีเมียมเฉพาะเจาะจงตามตัวกรองของคุณด้วย Gemini AI
                    </p>
                  </div>
                </div>
                {aiRecommendation && (
                  <button 
                    onClick={() => {
                      setAiRecommendation(null);
                      setAiError(null);
                    }}
                    className="text-[10px] text-stone-400 hover:text-stone-700 font-semibold cursor-pointer"
                  >
                    ย่อกลับ
                  </button>
                )}
              </div>

              {/* Status and Actions */}
              {!isAiLoading && !aiRecommendation && (
                <div className="space-y-3">
                  <div className="text-[11.5px] text-stone-600 bg-amber-500/5 px-3 py-2.5 border border-amber-500/10 rounded-xl leading-relaxed">
                    💡 <span className="font-semibold text-amber-900">เกร็ดเล็กๆ:</span> เลือกตัวกรอง คืนหาจังหวัด หรือสิ่งอำนวยความสะดวกข้างต้น จากนั้นกดวิเคราะห์ AI เพื่อป้ายยาจุดกางเต็นท์ที่ตอบโจทย์คุณที่สุดอย่างรวดเร็ว!
                  </div>
                  <button
                    id="get-ai-recommendations-btn"
                    onClick={handleGetAiRecommendation}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-sm transition-all hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>ค้นหาลานที่ใช่ด้วย AI อัจฉริยะ</span>
                  </button>
                </div>
              )}

              {/* Loader Loading state */}
              {isAiLoading && (
                <div className="space-y-3 py-4">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 rounded-full bg-earth-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-center text-xs font-medium text-stone-600 animate-pulse">
                    Gemini AI กำลังวิเคราะห์ผลลัพธ์เพื่อเลือกพิกัดลานกางเต็นท์ที่ดีที่สุดให้กับคุณ...
                  </p>
                </div>
              )}

              {/* Error state */}
              {aiError && !isAiLoading && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-650 leading-relaxed space-y-2">
                  <p className="font-semibold">⚠️ บริการแนะนำบกพร่องชั่วคราว:</p>
                  <p className="text-[11px] text-red-650">{aiError}</p>
                  <button 
                    onClick={handleGetAiRecommendation}
                    className="text-[10px] font-bold text-red-700 underline hover:text-red-800"
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              )}

              {/* Recommendation results displayed nicely */}
              {aiRecommendation && !isAiLoading && (() => {
                const targetId = aiRecommendation.recommendedCampId;
                const recCamp = camps.find(c => c.id === targetId) || CAMP_SITES.find(c => c.id === targetId);
                
                return (
                  <div className="space-y-3.5 animate-fadeIn">
                    {aiRecommendation.fallbackUsed && (
                      <div className="text-[11px] text-orange-850 bg-orange-50/80 border border-orange-250 p-2.5 rounded-xl leading-relaxed">
                        ✨ <span className="font-bold">หมายเหตุดีลเลอร์:</span> ไม่พบจุดกางเต็นท์ที่คู่ควรกับตัวกรองปัจจุบันเป๊ะๆ AI จึงเลือกเสนอสุดยอดจุดยอดฮิตทดแทนให้คุณ!
                      </div>
                    )}

                    {aiRecommendation.note && !aiRecommendation.fallbackUsed && (
                      <div className="text-[11px] text-amber-850 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl leading-relaxed">
                        {aiRecommendation.note}
                      </div>
                    )}

                    {recCamp ? (
                      <div 
                        onClick={() => handleSelectCamp(recCamp)}
                        className="bg-white p-3.5 rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <img 
                            src={recCamp.image} 
                            alt={recCamp.name} 
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 object-cover rounded-xl border border-sand-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="inline-block text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded mb-1">
                              👑 ทางเลือกที่โดดเด่นที่สุด
                            </span>
                            <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800 truncate transition-colors">
                              {recCamp.name}
                            </h4>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              📍 {recCamp.province} • ⭐ {recCamp.rating} (${recCamp.priceRange})
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-2xl border border-red-100 text-xs text-stone-500">
                        ❌ ไม่พบพิกัดไอดี "{targetId}" ในระบบข้อมูลแคมป์หลัก
                      </div>
                    )}

                    {/* Explanations block */}
                    <div className="space-y-2">
                      <div className="bg-[#fcfbf9]/60 px-3.5 py-3 rounded-2xl border border-sand-200">
                        <h5 className="text-[11.5px] font-bold text-stone-800 mb-1 flex items-center gap-1">
                          🏕️ ทำไมลานนี้ถึงเหมาะกับทริปนี้:
                        </h5>
                        <p className="text-[11.5px] text-stone-600 leading-relaxed font-sans whitespace-pre-line">
                          {aiRecommendation.reason}
                        </p>
                      </div>

                      <div className="bg-sand-55/40 px-3.5 py-3 rounded-2xl border border-sand-200">
                        <h5 className="text-[11.5px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                          💡 คำแนะนำสเปเชียลทิป:
                        </h5>
                        <p className="text-[11.5px] text-stone-600 leading-relaxed font-sans whitespace-pre-line">
                          {aiRecommendation.tips}
                        </p>
                      </div>
                    </div>

                    {recCamp && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleSelectCamp(recCamp)}
                          className="w-full bg-forest-900 hover:bg-forest-950 text-white hover:text-amber-300 font-bold text-[11px] py-2.5 px-3 rounded-xl shadow-xs transition-colors text-center text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer"
                        >
                          🚩 เปิดดูพิกัดแผนที่ & รีวิว
                        </button>
                        <button
                          onClick={handleGetAiRecommendation}
                          className="w-full bg-white hover:bg-sand-50/50 text-stone-700 font-bold text-[11px] py-2.5 px-3 rounded-xl border border-sand-300 shadow-3xs transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>สุ่มแนะนำอีกครั้ง</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Total Results Summary bar */}
            <div className="flex items-center justify-between px-2 text-stone-600">
              <span className="text-xs font-mono">
                🏕️ ผลการค้นหา ({filteredCamps.length} จาก {camps.length} แห่ง)
              </span>

              {showFavoritesOnly && (
                <span className="text-xs font-medium text-earth-700 bg-earth-50 px-2.5 py-1 rounded-full border border-earth-100 flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-current text-earth-500" />
                  เฉพาะรายการโปรด
                </span>
              )}
            </div>

            {/* Campground Cards List Grid */}
            <div className="space-y-4">
              <AdBanner />
              <AnimatePresence mode="popLayout">
              {filteredCamps.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-3xl p-8 border border-sand-200 text-center space-y-4 shadow-sm"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-sand-100 text-sand-800 flex items-center justify-center">
                    <EyeOff className="h-8 w-8 text-sand-800" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 text-base">ไม่เจอลานกางเต็นท์ตามค่าที่เลือก</h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      ลองตรวจสอบตัวสะกด หรือล้างตัวกรองทั้งหมดเพื่อเริ่มต้นหาจุดกางเต็นท์แค้มป์ใหม่อีกครั้ง
                    </p>
                  </div>
                  <button
                    id="no-results-reset-filters-btn"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest-900 text-white rounded-xl text-xs font-semibold hover:bg-forest-800 transition-all active:scale-95 shadow"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    ล้างการค้นหาทั้งหมด
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCamps.map((camp) => (
                    <motion.div
                      key={camp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CampCard
                        camp={camp}
                        isFavorite={favorites.includes(camp.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={handleSelectCamp}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
            </div>
          </div>

          {/* RIGHT PANEL: Map / Selected Details Sticky display */}
          <div className={`lg:col-span-6 xl:col-span-7 sticky top-24 ${
            mobileViewMode === 'map' ? 'block' : 'hidden md:block'
          }`}>
            
            <AnimatePresence mode="wait">
              {selectedCamp ? (
                /* Camp details view pane */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-4"
                  key="camp-details-wrapper"
                >
                  <div className="flex items-center justify-between bg-sand-100/60 p-2 rounded-2xl border border-sand-200">
                    <button
                      id="back-to-map-button-link"
                      onClick={() => setSelectedCamp(null)}
                      className="text-xs font-semibold text-forest-900 hover:text-forest-700 flex items-center gap-1 p-2 rounded-lg bg-white/80 hover:bg-white border border-sand-300 transition-all"
                    >
                      <span>← ปิดตรงนี้เพื่อแสดงแผนที่เดี่ยว</span>
                    </button>

                    <span className="text-[10px] font-mono font-medium text-stone-500 mr-2">
                      กำลังดูรายละเอียดแคมป์
                    </span>
                  </div>

                  <CampDetails
                    camp={selectedCamp}
                    onClose={() => setSelectedCamp(null)}
                    onUpdateRating={handleUpdateRating}
                    onNavigate={handleNavigate}
                  />
                </motion.div>
              ) : (
                /* Google maps interface */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                  key="google-maps-wrapper"
                >
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-forest-700" />
                      แผนที่พิกัดจุดกางเต็นท์โทนป่าเอิร์ธโทน
                    </h3>
                    
                    <span className="text-xs font-semibold bg-sand-200 text-stone-700 px-3 py-1 rounded-full border border-sand-300">
                      🟢 อุทยาน | 🟠 เอกชน
                    </span>
                  </div>

                  <CampsMap
                    camps={filteredCamps}
                    selectedCamp={selectedCamp}
                    onSelectCamp={handleSelectCamp}
                    onCloseCampDetails={() => setSelectedCamp(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Decorative Forest Background Accent Lines (Strictly design and non-obtrusive) */}
      <footer className="mt-16 border-t border-sand-200 text-center py-6 text-xs text-stone-400">
        <p className="font-sans">ศูนย์บริการแคมป์ปิ้ง CampHub Thailand © 2026 • โทนสีป่าออร์แกนิกและทรัพยากรธรรมชาติ</p>
      </footer>
    </div>
  );
}
