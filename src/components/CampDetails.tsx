/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, MapPin, Trees, Mountain, Calendar, Info, 
  Phone, DollarSign, Send, MessageSquare, Check, Sparkles, Navigation, Lock, LogIn, ArrowLeft, Share2
} from 'lucide-react';
import { CampSite, Review } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { User } from 'firebase/auth';
import NearbyAttractions from './NearbyAttractions';
import CampCamera from './CampCamera';

interface CampDetailsProps {
  camp: CampSite;
  onClose: () => void;
  onUpdateRating: (campId: string, newRating: number) => void;
  onNavigate: (path: string) => void;
}

// Initial default reviews to populate if none exist in localStorage
const DEFAULT_REVIEWS: Record<string, Review[]> = {
  'khao-yai': [
    { id: 'ry-1', author: 'สมจิตร รักดี', rating: 5, date: '2026-05-12', comment: 'อากาศดีมาก ลมเย็นสบาย มีกวางเดินผ่านหน้าเต็นท์ด้วย แนะนำเลยครับ!' },
    { id: 'ry-2', author: 'วิภา เทพปรีชา', rating: 4, date: '2026-06-01', comment: 'ลานหญ้ากว้างขวางดี เจ้าหน้าที่คอยตรวจความปลอดภัยตลอดคืน แต่อยากให้เพิ่มไฟแถวห้องน้ำอีกนิดค่ะ' }
  ],
  'jedkod': [
    { id: 'jk-1', author: 'มนัส ชูเกียรติ', rating: 4, date: '2026-04-20', comment: 'ริมอ่างน้ำบรรยากาศเงียบสงบ ฟุ้งหมอกยามเช้าดีมาก ใกล้กรุงเทพฯ ขับรถชั่วโมงครึ่งก็ถึงแล้ว' }
  ],
  'camp-out-korat': [
    { id: 'co-1', author: 'เกซริน ส่องแสง', rating: 5, date: '2026-03-15', comment: 'ตกแต่งน่ารักมาก เหมือนมาเที่ยวคาเฟ่ริมน้ำ หมูกระทะอร่อย บรรยากาศอบอุ่นเป็นกันเองสุดๆ' }
  ],
  'pang-ung': [
    { id: 'pu-1', author: 'แดนเหนือ สายลมภักดิ์', rating: 5, date: '2026-01-10', comment: 'สวรรค์บนดินจริงๆ ครับ หมอกเหนือน้ำอุ่นตอนเช้าลอยชูชัน ดั่งภาพฝันล่องแพมีความสุขที่สุด คุ้มที่ดั้นด้นขับรถมาโค้งพันโค้ง' }
  ]
};

interface PlaceholderPhoto {
  title: string;
  subtitle: string;
  tag: string;
  image: string;
}

const GALLERY_PLACEHOLDERS: PlaceholderPhoto[] = [
  {
    title: 'ลานตั้งแคมป์ใต้หมู่ดาว',
    subtitle: 'ผืนสนามหญ้ากว้างขวาง สูดไอโซนบริสุทธิ์เพื่อความสงบสูงสุด',
    tag: 'Starry Tent',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'สายน้ำเย็นธรรมชาติไหลผ่าน',
    subtitle: 'โซนพักผ่อนริมธารน้ำใส ไหลรินเบาชโลมใจนักธุดงค์ผจญภัย',
    tag: 'Mountain Creek',
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'ลอบล้อมกองไฟป่าไออุ่น',
    subtitle: 'เตาฟืนและบาร์บีคิวปิ้งย่าง ล้อมคู่สนทนายามรัตติกาลเย็นล้อม',
    tag: 'Campfire Night',
    image: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'แคมป์กระโจมท่ามกลางปุยสน',
    subtitle: 'เต็นท์กระโจมร่มเงาไม้ สุนทรียจิตวิญญาณแห่งสะวันนาแนวเอิร์ธโทน',
    tag: 'Tented Glamping',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'รุ่งอรุณท่ามกลางฉากสายหมอก',
    subtitle: 'บรรยากาศทะเลหมอกสีทองสะท้อนความงดงามธรรมชาติยามเช้าสงัด',
    tag: 'Golden Mist',
    image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop'
  },
  {
    title: 'มุมสโลว์ไลฟ์ดื่มด่ำกาแฟป่า',
    subtitle: 'สัมผัสการชงกาแฟดริปร้อนๆ ช้าเป็นจังหวะกับวิวยอดเขาพรีเมียม',
    tag: 'Earthy Coffee',
    image: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?q=80&w=800&auto=format&fit=crop'
  }
];

export default function CampDetails({
  camp,
  onClose,
  onUpdateRating,
  onNavigate
}: CampDetailsProps) {
  const [activePhoto, setActivePhoto] = useState(camp.image);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [capturedPhotosList, setCapturedPhotosList] = useState<string[]>([]);

  // Load and sync live captured photos
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`camp_photos_${camp.id}`);
      if (stored) {
        setCapturedPhotosList(JSON.parse(stored));
      } else {
        setCapturedPhotosList([]);
      }
    } catch (e) {
      console.error('Error loading captured photos', e);
    }
  }, [camp.id]);

  const handlePhotoSaved = (photoUrl: string) => {
    setCapturedPhotosList((prev) => [photoUrl, ...prev]);
    setActivePhoto(photoUrl);
  };
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?camp=${camp.id}`;
    const shareTitle = `🏕️ แนะนำจุดกางเต็นท์ธรรมชาติ: ${camp.name}`;
    const shareText = `🏕️ แนะนำจุดกางเต็นท์ธรรมชาติ: ${camp.name} (จังหวัด ${camp.province})\n🏔️ ความสูงจากระดับน้ำทะเล: ${camp.elevation}\n📍 พิกัด: ${camp.latitude}, ${camp.longitude}\n🌿 ดูจุดเที่ยวอื่นๆ เพิ่มเติมและปักหมุดลานแคมป์ทางพิกัดแอพฯ: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 2500);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShareStatus('success');
        setTimeout(() => setShareStatus('idle'), 2500);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2500);
      });
  };

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        setReviewerName(u.displayName || u.email?.split('@')[0] || 'ชาวแคมป์ไร้นาม');
      } else {
        setReviewerName('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch reviews from firestore and fallback to populating defaults
  useEffect(() => {
    async function loadReviews() {
      setReviewsLoading(true);
      try {
        const q = query(
          collection(db, 'reviews'),
          where('campId', '==', camp.id)
        );
        const snapshot = await getDocs(q);
        const fetched: Review[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          fetched.push({
            id: docSnap.id,
            author: d.author,
            rating: d.rating,
            date: d.date,
            comment: d.comment
          });
        });

        // Client-side reverse sorting by ID / creation order for reliability
        fetched.sort((a, b) => b.id.localeCompare(a.id));

        if (fetched.length === 0) {
          const defaults = DEFAULT_REVIEWS[camp.id] || [];
          const tempList: Review[] = [];
          for (let i = 0; i < defaults.length; i++) {
            const item = defaults[i];
            const rData = {
              campId: camp.id,
              author: item.author,
              rating: item.rating,
              date: item.date,
              comment: item.comment,
              createdAt: new Date(Date.now() - i * 1000 * 60).toISOString() // space them out
            };
            const docRef = await addDoc(collection(db, 'reviews'), rData);
            tempList.push({
              id: docRef.id,
              author: rData.author,
              rating: rData.rating,
              date: rData.date,
              comment: rData.comment
            });
          }
          setReviews(tempList);
        } else {
          setReviews(fetched);
        }
      } catch (err) {
        console.error('Error loading reviews from Firestore:', err);
      } finally {
        setReviewsLoading(false);
      }
    }

    loadReviews();
    setActivePhoto(camp.image);
    setActiveTab('info');
  }, [camp]);

  // Handle new review submission in Firestore
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;

    const authorName = user.displayName || user.email?.split('@')[0] || 'ชาวแคมป์ไร้นาม';

    const reviewData = {
      campId: camp.id,
      author: authorName,
      authorUid: user.uid,
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      
      const newReview: Review = {
        id: docRef.id,
        author: reviewData.author,
        rating: reviewData.rating,
        date: reviewData.date,
        comment: reviewData.comment
      };

      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);

      // Clear comment inputs
      setComment('');
      setNewRating(5);

      // Recalculate and update the main camp card rating
      const total = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const avg = parseFloat((total / updatedReviews.length).toFixed(1));
      onUpdateRating(camp.id, avg);
    } catch (err) {
      console.error('Error saving new review to Cloud:', err);
    }
  };

  const handleOpenDirections = () => {
    const { latitude, longitude } = camp;
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);

    let url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    
    if (isIOS) {
      url = `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${latitude},${longitude}`;
    } else if (isAndroid) {
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    }

    try {
      if (isIOS || isAndroid) {
        window.location.href = url;
        // Fallback if app doesn't open
        setTimeout(() => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
        }, 1200);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.warn('Protocol deep-link failed, falling back to web maps', e);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
    }
  };

  return (
    <motion.div
      key={camp.id}
      initial={{ opacity: 0, x: 50, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 140 }}
      className="bg-white rounded-3xl overflow-hidden border border-sand-200 shadow-xl flex flex-col h-full max-h-[90vh] lg:max-h-none relative"
    >
      {/* Header Close triggers */}
      <div className="relative h-64 sm:h-80 bg-stone-100">
        <img
          src={activePhoto}
          alt={camp.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-all duration-500"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Mobile Back Navigation */}
        <button
          id="back-camp-info-details-button"
          onClick={onClose}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3.5 py-2 bg-black/60 hover:bg-black/85 text-white text-xs font-bold rounded-full transition-colors z-10 border border-white/20 backdrop-blur-md shadow-md md:hidden min-h-[40px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>ย้อนกลับ</span>
        </button>

        {/* Action Share Button */}
        <button
          id="share-camp-details-button-header"
          onClick={handleShare}
          className="absolute top-4 right-16 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 z-10 md:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center shadow-md border border-white/10 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95"
          title="แชร์พิกัดและลานกางเต็นท์นี้"
        >
          <Share2 className="h-4.5 w-4.5" />
        </button>

        <button
          id="close-camp-info-details"
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10 md:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center shadow-md border border-white/10 backdrop-blur-md cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Floating details on image */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            {camp.type === 'national' ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-forest-900 text-forest-100 px-2 py-0.5 rounded-md border border-forest-500/30">
                อุทยานแห่งชาติ
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-earth-800 text-earth-100 px-2 py-0.5 rounded-md border border-earth-500/30">
                ลานกางเต็นท์เอกชน
              </span>
            )}

            <div className="flex items-center gap-1 font-semibold text-xs bg-amber-500 text-white px-2 py-0.5 rounded-md">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{camp.rating} ({reviews.length} รีวิว)</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5 text-shadow">
            {camp.name}
          </h2>
          <p className="text-xs text-sand-100 font-mono">
            {camp.nameEn}
          </p>
        </div>
      </div>

      {/* Gallery Selector */}
      <div className="bg-sand-50 p-3 border-b border-sand-200 flex items-center gap-2 overflow-x-auto">
        {[...camp.gallery, ...capturedPhotosList].map((img, idx) => (
          <button
            key={idx}
            className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              activePhoto === img 
                ? 'border-forest-600 scale-95 shadow-md' 
                : 'border-transparent hover:border-sand-800 opacity-80'
            }`}
            onClick={() => setActivePhoto(img)}
          >
            <img src={img} alt={`${camp.name} ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            {capturedPhotosList.includes(img) && (
              <span className="absolute top-1 right-1 bg-forest-600 text-[8px] text-white px-1.5 rounded-sm shadow-xs font-bold font-sans">
                My 📸
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand-200 bg-sand-50/50">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 text-center py-3.5 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all min-h-[44px] flex items-center justify-center leading-tight ${
            activeTab === 'info'
              ? 'border-forest-700 text-forest-800 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="xs:inline hidden">ข้อมูลทั่วไป & สิ่งอำนวยความสะดวก</span>
          <span className="xs:hidden inline">ข้อมูล & สิ่งอำนวยฯ</span>
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 text-center py-3.5 px-2 text-xs sm:text-sm font-bold border-b-2 transition-all min-h-[44px] flex items-center justify-center leading-tight ${
            activeTab === 'reviews'
              ? 'border-forest-700 text-forest-800 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          รีวิวผู้เข้าพัก ({reviews.length})
        </button>
      </div>

      {/* Card Content body */}
      <div className="flex-grow overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'info' ? (
          <>
            {/* Quick stats panel */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-sand-100/60 p-2.5 sm:p-3 rounded-xl border border-sand-200 flex items-center gap-2 min-w-0">
                <MapPin className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-earth-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-stone-400 block truncate">จังหวัด</span>
                  <span className="text-xs font-bold text-stone-800 block truncate" title={camp.province}>{camp.province}</span>
                </div>
              </div>

              <div className="bg-sand-100/60 p-2.5 sm:p-3 rounded-xl border border-sand-200 flex items-center gap-2 min-w-0">
                <Mountain className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-forest-700 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-stone-400 block truncate">ความสูงพื้นที่</span>
                  <span className="text-xs font-bold text-stone-800 block truncate" title={camp.elevation}>{camp.elevation}</span>
                </div>
              </div>

              <div className="bg-sand-100/60 p-2.5 sm:p-3 rounded-xl border border-sand-200 flex items-center gap-2 min-w-0">
                <Calendar className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-moss-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-stone-400 block truncate">ฤดูกาลแนะนำ</span>
                  <span className="text-xs font-bold text-stone-800 block truncate" title={camp.season}>{camp.season}</span>
                </div>
              </div>

              <div className="bg-sand-100/60 p-2.5 sm:p-3 rounded-xl border border-sand-200 flex items-center gap-2 min-w-0">
                <DollarSign className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-stone-400 block truncate">ค่ากางเต็นท์</span>
                  <span className="text-xs font-bold text-earth-800 block truncate" title={camp.priceRange}>{camp.priceRange}</span>
                </div>
              </div>

              <div className="bg-sand-100/60 p-2.5 sm:p-3 rounded-xl border border-sand-200 flex items-center gap-2 min-w-0">
                <Phone className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-stone-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-stone-400 block truncate">ติดต่อ</span>
                  <span className="text-xs font-bold text-stone-800 block truncate" title={camp.contact}>
                    {camp.contact}
                  </span>
                </div>
              </div>

              <div className="bg-sand-100/60 p-2.5 sm:p-3 rounded-xl border border-sand-200 flex items-center gap-2 min-w-0">
                <Trees className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-forest-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-stone-400 block truncate">ค่ายสไตล์</span>
                  <span className="text-xs font-bold text-stone-800 block truncate">
                    {camp.type === 'national' ? 'ป่าอนุรักษ์ธรรมชาติ' : 'แคมป์เชิงพาณิชย์'}
                  </span>
                </div>
              </div>
            </div>

            {/* In-depth descriptions */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-forest-900 border-l-4 border-forest-600 pl-2">
                คำโปรยธรรมชาติ
              </h4>
              <p className="text-xs leading-relaxed text-stone-600 font-mono italic">
                "{camp.description}"
              </p>
              <h4 className="text-sm font-bold text-forest-900 border-l-4 border-forest-600 pl-2 pt-2">
                รายละเอียดสถานที่
              </h4>
              <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-line text-justify">
                {camp.longDescription}
              </p>
            </div>

            {/* Horizontal Scrolling Photo Gallery using Placeholders */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-forest-900 border-l-4 border-forest-600 pl-2">
                  บรรยากาศแคมป์จำลอง (Atmosphere Placeholders)
                </h4>
                <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded border border-sand-200">
                  เลื่อนซ้าย-ขวา ↔️ คลิกดูขยายภาพด้านบน
                </span>
              </div>

              <div className="flex space-x-4 overflow-x-auto pb-3 pt-1 scrollbar-thin snap-x snap-order">
                {GALLERY_PLACEHOLDERS.map((photo, index) => {
                  const isActive = activePhoto === photo.image;
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActivePhoto(photo.image)}
                      className={`relative flex-shrink-0 w-64 h-40 rounded-2xl overflow-hidden cursor-pointer snap-start border-2 transition-all shadow-sm ${
                        isActive
                          ? 'border-forest-600 ring-4 ring-forest-50'
                          : 'border-sand-200 hover:border-forest-400'
                      }`}
                    >
                      {/* Photo image */}
                      <img
                        src={photo.image}
                        alt={photo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />

                      {/* Cover tag */}
                      <span className="absolute top-2.5 left-2.5 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-stone-900/85 text-sand-50 backdrop-blur-xs border border-stone-700">
                        {photo.tag}
                      </span>

                      {/* Overlay checked indicator */}
                      {isActive && (
                        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-forest-900 text-white backdrop-blur-xs border border-forest-400 shadow-sm">
                          <Check className="h-3 w-3 text-forest-300" />
                          ภาพหน้าปก
                        </span>
                      )}

                      {/* Title information overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent p-3 text-white flex flex-col justify-end">
                        <h5 className="font-bold text-xs line-clamp-1">
                          {photo.title}
                        </h5>
                        <p className="text-[10px] text-sand-100/90 leading-normal line-clamp-1 font-sans">
                          {photo.subtitle}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Checklist of Amenities */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-forest-900 border-l-4 border-forest-600 pl-2">
                สิ่งอำนวยความสะดวกทั้งหมด
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {camp.amenities.map((amenity, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center space-x-2 bg-forest-50/40 p-2.5 rounded-lg border border-forest-100 text-stone-700 text-xs font-medium"
                  >
                    <div className="bg-forest-100 p-1 rounded-full text-forest-700 flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coordinate directions */}
            <div className="bg-sand-100/40 p-4 rounded-2xl border border-sand-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-earth-600" />
                  <h4 className="text-sm font-bold text-stone-900">พิกัดทางภูมิศาสตร์และการเดินทาง</h4>
                </div>
                <span className="text-[10px] font-mono bg-stone-200 px-2 py-0.5 rounded text-stone-600">
                  {camp.latitude.toFixed(4)}, {camp.longitude.toFixed(4)}
                </span>
              </div>
              
              <p className="text-xs text-stone-600 leading-relaxed">
                คลิกปุ่มเริ่มเดินทางบน Google Maps หรือกดแชร์พิกัดพร้อมรายละเอียดของลานกางเต็นท์นี้ให้เพื่อนๆ ร่วมทริปของคุณได้อย่างรวดเร็วและปลอดภัย
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="camp-navigation-directions-button"
                  onClick={handleOpenDirections}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-forest-800 to-forest-700 hover:from-forest-700 hover:to-forest-600 text-sand-50 font-bold py-3 px-4 rounded-xl shadow border border-forest-900 transition-all duration-300 transform active:scale-95 group text-xs sm:text-sm cursor-pointer"
                >
                  <Navigation className="h-4 w-4 animate-pulse group-hover:translate-x-0.5 transition-transform" />
                  <span>Get Directions (นำทางแผนที่)</span>
                </button>

                <button
                  id="camp-share-social-detail-button"
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold py-3 px-4 rounded-xl shadow border border-amber-600/40 transition-all duration-300 transform active:scale-95 group text-xs sm:text-sm cursor-pointer"
                >
                  <Share2 className="h-4.5 w-4.5 group-hover:scale-115 transition-transform" />
                  <span>แชร์ลานนี้ & คัดลอกลิงก์</span>
                </button>
              </div>
            </div>

            {/* Camera interface module for live camp reporting */}
            <CampCamera campId={camp.id} onPhotoSaved={handlePhotoSaved} />

            {/* Nearby attractions, waterfalls, and hiking area list */}
            <NearbyAttractions camp={camp} />
          </>
        ) : (
          <div className="space-y-6">
            {/* Review writing form */}
            {!user ? (
              <div id="login-required-for-review" className="bg-amber-50/50 p-6 rounded-2xl border border-amber-250 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-850 text-xs">ต้องเข้าสู่ระบบชาวแคมป์ปิ้งก่อนร่วมรีวิว</h4>
                  <p className="text-[10px] text-stone-500 max-w-xs mx-auto leading-normal">
                    เพื่อสังคมแบ่งปันพิกัดกวางป่าที่ปลอดภัยและเชื่อถือได้ คุณจำเป็นต้องลงทะเบียนเข้าใช้งานด้วยอีเมลของคุณเสียก่อน
                  </p>
                </div>
                <button
                  type="button"
                  id="go-login-review-btn"
                  onClick={() => onNavigate('/auth')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-forest-900 border border-forest-850 hover:bg-forest-800 text-white rounded-xl text-[11px] font-bold shadow transition-all duration-350"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบหรือสมัครแคมป์ปิ้งเลย</span>
                </button>
              </div>
            ) : (
              <div className="bg-sand-100/40 p-4 rounded-2xl border border-sand-200 space-y-4">
                <div className="flex items-center space-x-1.5 text-forest-900">
                  <Sparkles className="h-4 w-4 text-earth-500 animate-pulse" />
                  <h4 className="text-sm font-bold">เขียนรีวิวแบ่งปันประสบการณ์</h4>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ชื่อผู้แสดงความเห็น (ผูกกับโปรไฟล์ตนเองโดยอัตโนมัติ)
                    </label>
                    <input
                      id="review-author-input"
                      type="text"
                      disabled
                      value={reviewerName}
                      className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-stone-100 font-bold text-stone-600 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ให้คะแนนความประทับใจ *
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          className="p-1 rounded transition-colors duration-200 text-2xl focus:outline-hidden"
                        >
                          <span 
                            className={`inline-block ${
                              (hoveredRating !== null ? star <= hoveredRating : star <= newRating)
                                ? 'text-amber-500 text-shadow-sm'
                                : 'text-stone-300'
                            }`}
                          >
                            ★
                          </span>
                        </button>
                      ))}
                      <span className="text-xs font-mono text-stone-500 ml-2">({newRating}/5 คะแนน)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      เล่าประสบการณ์ของคุณ (สิ่งอำนวยความสะดวก อาหาร ธรรมชาติ) *
                    </label>
                    <textarea
                      id="review-comment-textarea"
                      required
                      rows={3}
                      placeholder="เขียนรายละเอียดรีวิวให้เพื่อนๆ สายแค้มป์ปิ้งอ่าน..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-sand-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-forest-600 focus:border-forest-600 text-stone-800"
                    />
                  </div>

                  <button
                    id="submit-review-form-button"
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-earth-600 hover:bg-earth-500 text-white font-medium py-2 px-4 rounded-xl text-xs shadow transition-all duration-300 transform active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>ส่งโพสต์รีวิวแค้มป์นี้</span>
                  </button>
                </form>
              </div>
            )}

            {/* Displaying reviews */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-forest-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-forest-700" />
                รีวิวจากนักเดินป่าทั้งหมด ({reviews.length})
              </h4>

              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-sand-50 rounded-2xl border border-dashed border-sand-300">
                  <p className="text-xs text-stone-400 font-mono">ยังไม่มีบทวิจารณ์สำหรับที่นี่ เขียนคนแรกได้เลย!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div 
                      key={review.id} 
                      className="bg-white p-3.5 rounded-2xl border border-sand-200 space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 block">
                          {review.author}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] bg-sand-100 text-earth-800 px-2 py-0.5 rounded-sm">
                          <span className="text-amber-500 font-bold">★</span>
                          <span className="font-semibold">{review.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 leading-relaxed">
                        {review.comment}
                      </p>

                      <div className="text-[10px] font-mono text-stone-400 text-right">
                        วันที่พัก: {review.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Share Toast Notification Alert */}
      <AnimatePresence>
        {shareStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border max-w-[85%] whitespace-nowrap ${
              shareStatus === 'success'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-50 shadow-emerald-900/10'
                : 'bg-red-950 border-red-800 text-red-50 shadow-red-900/10'
            }`}
          >
            {shareStatus === 'success' ? (
              <>
                <svg className="h-4 w-4 text-emerald-450 shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>คัดลอกลิงก์สำเร็จ! ส่งต่อชวนเพื่อนไปแค้มป์ได้ทันที 🏕️</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-400 shrink-0" />
                <span>เกิดข้อผิดพลาดในการแชร์ลิงก์ โปรดลองอีกครั้ง</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
