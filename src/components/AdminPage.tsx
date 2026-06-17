/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, setDoc 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { 
  ArrowLeft, ShieldAlert, Plus, Edit2, Trash2, Power, PowerOff, TrendingUp, BarChart3, HelpCircle, 
  DollarSign, Eye, MousePointerClick, RefreshCw, Layers, CheckCircle, ExternalLink, Image as ImageIcon,
  Check, X, FileCheck, MailCheck, ShieldCheck
} from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  cpm: number;
  cpc: number;
  impressions: number;
  clicks: number;
  active: boolean;
  createdAt: string;
}

interface AdSubmission {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  months: number;
  totalPrice: number;
  slipName: string;
  slipBase64: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  userEmail: string;
  userUid: string;
  userName: string;
}

interface AdminPageProps {
  user: User | null;
  userRole: 'admin' | 'user';
  onNavigate: (path: string) => void;
}

const PRESET_AD_IMAGES = [
  { name: 'เต็นท์ส้มโดมพรีเมียม', url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop' },
  { name: 'ตะเกียงแคมป์ฟืนเรโทร', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop' },
  { name: 'เครื่องชงกาแฟดริปสโลว์ไลฟ์', url: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?q=80&w=800&auto=format&fit=crop' },
  { name: 'บาร์บีคิวปิ้งย่างริมหาด', url: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?q=80&w=800&auto=format&fit=crop' }
];

export default function AdminPage({ user, userRole, onNavigate }: AdminPageProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [adSubmissions, setAdSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Form states
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [cpm, setCpm] = useState<number>(50); // Standard 50 THB per 1k impressions
  const [cpc, setCpc] = useState<number>(5);  // Standard 5 THB per click
  const [active, setActive] = useState(true);

  // Success notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Gmail OAuth connect states
  const [gmailConnectedUser, setGmailConnectedUser] = useState<string | null>(null);
  const [viewingSlipId, setViewingSlipId] = useState<string | null>(null);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const adsRef = collection(db, 'ads');
      const q = query(adsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: Ad[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Ad);
      });
      setAds(list);
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const subRef = collection(db, 'ad_submissions');
      const q = query(subRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: AdSubmission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AdSubmission);
      });
      setAdSubmissions(list);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const checkGmailConnection = async () => {
    try {
      const configRef = doc(db, 'configs', 'gmail_notification');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        setGmailConnectedUser(snap.data().adminEmail || 'thaneththong@gmail.com');
      }
    } catch (err) {
      console.error('Error checking gmail config:', err);
    }
  };

  const handleConnectGmail = async () => {
    setErrorCode(null);
    setActionSuccess(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        const configRef = doc(db, 'configs', 'gmail_notification');
        await setDoc(configRef, {
          accessToken: credential.accessToken,
          updatedAt: new Date().toISOString(),
          adminEmail: result.user.email || ''
        });
        setGmailConnectedUser(result.user.email || 'thaneththong@gmail.com');
        setActionSuccess('เชื่อมโยงบัญชี Gmail และเปิดระระบบแจ้งเตือนสลิปเงินค่าโฆษณาพรูฟสำเร็จ!');
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Gmail Authorization error:', err);
      setErrorCode('เชื่อมโยงสิทธิ์การส่งอีเมลล้มเหลว โปรดตรวจสอบป๊อปอัปของคุณ');
    }
  };

  const handleApproveSubmission = async (sub: AdSubmission) => {
    if (!window.confirm(`คุณต้องการอนุมัติผู้ลงโฆษณา "${sub.title}" ใช่ไหม? ป้ายโฆษณาจะทำงานในระบบแบนเนอร์ทันที`)) return;

    setActionSuccess(null);
    setErrorCode(null);
    try {
      // 1. Create a corresponding active banner ad inside the 'ads' collection
      const newAdData = {
        title: sub.title,
        imageUrl: sub.imageUrl,
        targetUrl: sub.targetUrl,
        cpm: 50, // Standard 50 THB per 1k impressions
        cpc: 5,  // Standard 5 THB per click
        active: true,
        impressions: 0,
        clicks: 0,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'ads'), newAdData);

      // 2. Change status of the submission
      const subDocRef = doc(db, 'ad_submissions', sub.id);
      await updateDoc(subDocRef, {
        status: 'approved'
      });

      setActionSuccess('อนุมัติสิทธิ์ป้ายพร้อมจัดสรรเข้าระดับระบบแสดงผลสุ่มสำเร็จ!');
      fetchAds();
      fetchAdSubmissions();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.error('Error approving ad submission:', err);
      setErrorCode('เกิดข้อผิดพลาดในการอนุมัติใบสมัครโฆษณา');
    }
  };

  const handleRejectSubmission = async (sub: AdSubmission) => {
    if (!window.confirm(`คุณต้องการปฏิเสธสิทธิ์และไม่เปิดใช้งานแคมเปญ "${sub.title}" ใช่ไหม?`)) return;

    setActionSuccess(null);
    try {
      const subDocRef = doc(db, 'ad_submissions', sub.id);
      await updateDoc(subDocRef, {
        status: 'rejected'
      });

      setActionSuccess('ปฏิเสธคำขอสิทธิ์โฆษณาสำเร็จเรียบร้อย');
      fetchAdSubmissions();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.error('Error rejecting ad submission:', err);
    }
  };

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchAds();
      fetchAdSubmissions();
      checkGmailConnection();
    }
  }, [user, userRole]);

  const handleResetForm = () => {
    setTitle('');
    setImageUrl('');
    setTargetUrl('');
    setCpm(50);
    setCpc(5);
    setActive(true);
    setEditingAdId(null);
  };

  const handleCreateOrUpdateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !targetUrl.trim()) {
      setErrorCode('กรุณากรอกข้อมูลโฆษณาให้ครบถ้วนทุกช่อง');
      return;
    }

    setSaving(true);
    setErrorCode(null);
    setActionSuccess(null);

    const adData = {
      title: title.trim(),
      imageUrl: imageUrl.trim(),
      targetUrl: targetUrl.trim(),
      cpm: Number(cpm),
      cpc: Number(cpc),
      active,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingAdId) {
        // Update existing
        const adDocRef = doc(db, 'ads', editingAdId);
        await updateDoc(adDocRef, {
          title: adData.title,
          imageUrl: adData.imageUrl,
          targetUrl: adData.targetUrl,
          cpm: adData.cpm,
          cpc: adData.cpc,
          active: adData.active
        });
        setActionSuccess('แก้ไขและเซฟข้อมูลโฆษณาสำเร็จเรียบร้อย!');
      } else {
        // Create new
        const fullAdData = {
          ...adData,
          impressions: 0,
          clicks: 0
        };
        await addDoc(collection(db, 'ads'), fullAdData);
        setActionSuccess('สร้างป้ายโฆษณาแคมเปญใหม่สำเร็จ!');
      }
      
      handleResetForm();
      fetchAds();
      
      setTimeout(() => {
        setActionSuccess(null);
      }, 4000);
    } catch (err: any) {
      console.error(err);
      setErrorCode('เกิดข้อผิดพลาดในการบันทึกโฆษณา');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAdClick = (ad: Ad) => {
    setEditingAdId(ad.id);
    setTitle(ad.title);
    setImageUrl(ad.imageUrl);
    setTargetUrl(ad.targetUrl);
    setCpm(ad.cpm);
    setCpc(ad.cpc);
    setActive(ad.active);
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('คุณต้องการลบโฆษณาชิ้นนี้ใช่ไหม? (ข้อมูลการติดตาม KPI ทั้งหมดจะถูกลบถาวร)')) return;

    try {
      await deleteDoc(doc(db, 'ads', id));
      setActionSuccess('ลบแคมเปญโฆษณาสำเร็จเรียบร้อย!');
      fetchAds();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting ad:', err);
      setErrorCode('ไม่สามารถลบโฆษณาได้ โปรดลองอีกครั้ง');
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    try {
      const adDocRef = doc(db, 'ads', ad.id);
      const newStatus = !ad.active;
      await updateDoc(adDocRef, { active: newStatus });
      setAds(prev => prev.map(item => item.id === ad.id ? { ...item, active: newStatus } : item));
      setActionSuccess(`เปลี่ยนสถานะแคมเปญเป็น ${newStatus ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'} สำเร็จ!`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.error('Error toggling ad active status:', err);
    }
  };

  // If not logged in or doesn't have privileges
  if (!user || userRole !== 'admin') {
    return (
      <div id="admin-denied-panel" className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sand-200 p-8 text-center space-y-5 shadow-xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-rose-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">การเข้าถึงได้รับการปฏิเสธ</h3>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              หน้านี้ถูกสงวนลิขสิทธิ์ไว้เฉพาะผู้ดูแลระบบ (Admin Panel) เท่านั้น บัญชีของคุณไม่มีระดับสิทธิ์ที่เหมาะสมในการตรวจสอบหรือกำหนดค่าเครือข่ายโฆษณา
            </p>
          </div>
          <div className="pt-2">
            <button
              id="admin-denied-back-home"
              onClick={() => onNavigate('/')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-forest-900 text-white rounded-2xl text-xs font-bold hover:bg-forest-800 transition-all shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>กลับสู่หน้าแผนที่แค้มป์ปิ้งหลัก</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate high level KPIs
  const totalImpressions = ads.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, item) => sum + (item.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  
  // Total Revenue = (CPM * impressions / 1000) + (CPC * clicks)
  const totalRevenue = ads.reduce((sum, item) => {
    const impressionRev = ((item.cpm || 0) * (item.impressions || 0)) / 1000;
    const clickRev = (item.cpc || 0) * (item.clicks || 0);
    return sum + (impressionRev + clickRev);
  }, 0);

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-stone-50 py-8 font-sans text-stone-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation back and header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              id="admin-back-button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-2 text-xs font-bold text-forest-700 hover:text-forest-900 bg-sand-100 hover:bg-sand-200/80 px-3.5 py-1.5 rounded-xl border border-sand-200 transition-all mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>กลับหน้าแคมป์ปิ้งแอป</span>
            </button>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-amber-500" />
              <span>ระบบจัดการเครือข่ายโฆษณาแอดมิน (Forest Ads Network)</span>
            </h2>
            <p className="text-xs text-stone-500">
              สร้าง ตรวจชิ้นงาน กำหนดอัตราผลตอบแทน CPC/CPM และศึกษาเมทริกซ์ทราฟฟิกชาวแคมป์ปิ้งแบบเรียลไทม์
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              id="admin-refresh-data-btn"
              onClick={fetchAds}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs active:scale-95 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชสถิติ</span>
            </button>
          </div>
        </div>

        {/* Global KPI Stats Grid */}
        <div id="admin-kpis-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-5 border border-amber-400/30 shadow-md space-y-1 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-15"><DollarSign className="h-12 w-12" /></div>
            <span className="block text-[10px] font-bold text-amber-100 uppercase tracking-widest">รายได้รวมสะสม (Total Est. Revenue)</span>
            <span className="text-2xl font-extrabold block tracking-tight font-mono">
              ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] block text-amber-100 leading-tight">คำนวณแบบสะสมจากสูตร (CPM/1k imp. + CPC/คลิก)</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-sand-200 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10"><Eye className="h-12 w-12 text-stone-800" /></div>
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">ยอด Impression รวม</span>
            <span className="text-2xl font-extrabold block text-stone-900 tracking-tight font-mono">
              {totalImpressions.toLocaleString()}
            </span>
            <span className="text-[10px] block text-stone-400 leading-tight">จำนวนครั้งที่สุ่มปรากฏบนหน้ากิกเฟ้นบ่น</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-sand-200 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10"><MousePointerClick className="h-12 w-12 text-stone-800" /></div>
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">ยอดคลิกสะสม (Total Clicks)</span>
            <span className="text-2xl font-extrabold block text-stone-900 tracking-tight font-mono">
              {totalClicks.toLocaleString()}
            </span>
            <span className="text-[10px] block text-stone-400 leading-tight">จำนวนครั้งที่มีการแตะเข้าชมลิงก์โฆษณา</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-sand-200 shadow-sm space-y-1 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-10"><TrendingUp className="h-12 w-12 text-stone-800" /></div>
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">อัตราเฉลี่ย CTR (%)</span>
            <span className="text-2xl font-extrabold block text-stone-900 tracking-tight font-mono">
              {avgCTR.toFixed(2)}%
            </span>
            <span className="text-[10px] block text-stone-400 leading-tight">ประสิทธิภาพตอบสนองคลิกผ่านของโฆษณา</span>
          </div>

        </div>

        {/* Gmail Notification Setting Card & System Alert */}
        <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1 select-none">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <MailCheck className="h-5 w-5 text-forest-800" />
              <span>ระบบจัดส่งและแจ้งเตือนผ่าน Gmail (Gmail Real-time Alerts)</span>
            </h3>
            <p className="text-xs text-stone-500 leading-normal max-w-2xl">
              เมื่อมีผู้สนับสนุนสั่งซื้อและลงสลิปหลักฐานโฆษณาเข้ามา CampHub Thailand จะเรียกใช้ Gmail API เพื่อแจ้งเตือนไปยังแอดมิน <b>thaneththong@gmail.com</b> ลิงก์แนบสลิปทันทีเพื่อประพรูฟรวดเร็ว
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {gmailConnectedUser ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
                <ShieldCheck className="h-4 w-4 text-emerald-600 animate-pulse" />
                <div className="text-[11px] text-emerald-800">
                  <span className="block font-bold">เปิดใช้งาน Gmail สำเร็จ</span>
                  <span className="block font-mono text-[10px]">{gmailConnectedUser}</span>
                </div>
                <button
                  onClick={handleConnectGmail}
                  className="ml-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 text-[9px] rounded-lg transition-colors border border-emerald-500 text-center"
                >
                  อัปเดตสิทธิ์ใหม่
                </button>
              </div>
            ) : (
              <button
                id="btn-admin-connect-gmail"
                onClick={handleConnectGmail}
                className="bg-amber-550 hover:bg-amber-600 text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow active:scale-97"
              >
                <MailCheck className="h-4 w-4" />
                <span>เชื่อมต่อ Gmail เพื่อรับคำแจ้งเตือนสลิปเงิน</span>
              </button>
            )}
          </div>
        </div>

        {/* Advertiser Submissions (คำขอสปอนเซอร์และหลักฐานโอนเงินจากลูกค้า) */}
        <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-500" />
              <span>รายการแจ้งโอนเงินค่าโฆษณา (฿2,000/เดือน) รอตรวจสอบ</span>
            </h3>
            
            <button
              onClick={fetchAdSubmissions}
              className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-lg border border-sand-200 flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              <span>ดึงข้อมูลล่าสุด</span>
            </button>
          </div>

          {loadingSubmissions ? (
            <div className="text-center py-10">
              <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mx-auto mb-1" />
              <p className="text-[11px] text-stone-400">กำลังดึงข้อมูลรายการใบสมัครสลิป...</p>
            </div>
          ) : adSubmissions.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-xs text-stone-400 font-medium font-sans">ยังไม่มีข้อมูลแจ้งโอนเงินค่าโฆษณาหรือแบนเนอร์ใดๆ ในขณะนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50/50">
                    <th className="py-3 px-3">ผู้สมัครโฆษณา</th>
                    <th className="py-3 px-3">รายละเอียดแคมเปญ / ลิงก์ปลายทาง</th>
                    <th className="py-3 px-3 text-center">สิทธิ์เช่า (เดือน)</th>
                    <th className="py-3 px-3 text-right">ยอดโอนเงินจริง</th>
                    <th className="py-3 px-3 text-center">สลิปโอนเงิน (Slip)</th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">ดำเนินการรับสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {adSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-stone-850 block">{sub.userName}</span>
                        <span className="text-[10px] text-stone-400 block font-mono">{sub.userEmail}</span>
                      </td>
                      
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-stone-800">{sub.title}</div>
                        <a 
                          href={sub.targetUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-forest-700 hover:underline flex items-center gap-0.5 mt-0.5 truncate max-w-[220px]"
                        >
                          <span className="truncate">{sub.targetUrl}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold tracking-tight text-stone-700">
                        {sub.months} เดือน
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-800">
                        ฿{sub.totalPrice?.toLocaleString() || '2,000'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {sub.slipBase64 ? (
                          <button
                            type="button"
                            onClick={() => setViewingSlipId(viewingSlipId === sub.id ? null : sub.id)}
                            className="bg-amber-50 hover:bg-amber-100/85 text-amber-800 font-bold px-3 py-1.5 rounded-lg border border-amber-200 text-[10px] inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>{viewingSlipId === sub.id ? 'ปิดแสดงสลิป' : 'เปิดดูรูปสลิป'}</span>
                          </button>
                        ) : (
                          <span className="text-stone-300 text-[10px]">ไม่มีสลิปแนบ</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-850 border border-emerald-250' 
                            : sub.status === 'rejected'
                              ? 'bg-rose-50 text-rose-850 border border-rose-250'
                              : 'bg-amber-50 text-amber-850 border border-amber-255 animate-pulse'
                        }`}>
                          {sub.status === 'approved' ? 'อนุมัติแล้ว' : sub.status === 'rejected' ? 'ปฏิเสธแล้ว' : 'รอตรวจสอบสลิป'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-2">
                          {sub.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApproveSubmission(sub)}
                                className="bg-emerald-605 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                              >
                                <Check className="h-3 w-3" />
                                <span>อนุมัติผ่าน</span>
                              </button>

                              <button
                                onClick={() => handleRejectSubmission(sub)}
                                className="bg-rose-605 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                              >
                                <X className="h-3 w-3" />
                                <span>ปฏิเสธ</span>
                              </button>
                            </>
                          )}
                          {sub.status !== 'pending_approval' && (
                            <span className="text-stone-400 font-sans text-[10px]">ตรวจเสร็จเรียบร้อย</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expanded light Box picture display for slip view */}
          {viewingSlipId && (
            <div className="p-4 bg-stone-50 border border-sand-220 rounded-2xl shadow-inner relative flex flex-col items-center">
              <button
                onClick={() => setViewingSlipId(null)}
                className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 bg-white border border-stone-200 p-1 rounded-full shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">ภาพหลักฐานสลิปการโอนค่าบริการโฆษณา</span>
              <div className="max-w-md w-full rounded-lg overflow-hidden border border-sand-300 shadow bg-white p-2">
                <img 
                  src={adSubmissions.find(s => s.id === viewingSlipId)?.slipBase64} 
                  alt="Payment Slip Proof" 
                  className="w-full h-auto max-h-[500px] object-contain rounded-md animate-fade-in" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Outer Split Layout: Ad Form + Ad list table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* LEFT: Ad creator form */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-amber-500" />
                <span>{editingAdId ? 'แก้ไขข้อมูลโฆษณาเดิม' : 'สร้างแคมเปญโฆษณาใหม่'}</span>
              </h3>
              {editingAdId && (
                <button
                  id="admin-form-reset-btn"
                  onClick={handleResetForm}
                  className="text-[10px] font-extrabold text-stone-500 hover:text-stone-800 bg-stone-100 uppercase px-2 py-1 rounded"
                >
                  ยกเลิกแก้ไข
                </button>
              )}
            </div>

            {/* Action feedbacks */}
            {actionSuccess && (
              <div id="admin-form-success" className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{actionSuccess}</span>
              </div>
            )}

            {errorCode && (
              <div id="admin-form-error" className="p-3 bg-rose-50 border border-rose-150 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span className="font-medium">{errorCode}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateAd} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700" htmlFor="ad-title">
                  คำโปรยหัวโฆษณา / แคมเปญ *
                </label>
                <input
                  id="ad-title"
                  type="text"
                  required
                  placeholder="เช่น ลดเพิ่ม 10% สำหรับเช่าตะเกียงโคมไฟป่าถ้ำพอง"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700" htmlFor="ad-image-url">
                  URL ภาพประกอบ (Image URL) *
                </label>
                <input
                  id="ad-image-url"
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800 font-mono"
                />

                {/* Presets preview widget */}
                <div className="pt-2">
                  <span className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">หรือคลิกใช้ภาพจารภาพแคมป์ปิ้งอัปสแปลช</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_AD_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className="text-[10px] p-1.5 rounded bg-sand-100 hover:bg-amber-100/75 text-stone-600 block text-left truncate transition-colors font-medium border border-sand-200"
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700" htmlFor="ad-target-url">
                  Link ปลายทาง (Target Link / Click Destination) *
                </label>
                <input
                  id="ad-target-url"
                  type="url"
                  required
                  placeholder="https://example.com/promotion"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800 font-mono"
                />
              </div>

              {/* Rates settings Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700" htmlFor="ad-cpm">
                    ค่า CPM (ต่อ 1,000 imp)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-xs">฿</span>
                    <input
                      id="ad-cpm"
                      type="number"
                      min={0}
                      required
                      value={cpm}
                      onChange={(e) => setCpm(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-850"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700" htmlFor="ad-cpc">
                    ค่า CPC (ต่อ 1 คลิก)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-xs">฿</span>
                    <input
                      id="ad-cpc"
                      type="number"
                      min={0}
                      required
                      value={cpc}
                      onChange={(e) => setCpc(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-850"
                    />
                  </div>
                </div>
              </div>

              {/* Active setting switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-150">
                <div>
                  <span className="block text-xs font-bold text-stone-800">สถานะเปิดบริการทันที</span>
                  <span className="text-[10px] text-stone-400 block font-normal">อนุญาตให้สุ่มแสดงผลต่อยูสเซอร์</span>
                </div>
                <button
                  id="ad-active-toggle-btn"
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`w-12 h-6 pl-0.5 rounded-full flex items-center transition-all ${
                    active ? 'bg-emerald-600 justify-end pr-0.5' : 'bg-stone-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-md inline-block" />
                </button>
              </div>

              <div className="pt-2">
                <button
                  id="admin-submit-ad-btn"
                  type="submit"
                  disabled={saving}
                  className="w-full bg-amber-550 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  {saving ? 'กำลังอัปเดตข้อมูล...' : editingAdId ? 'บันทึกการแก้ไขข้อมูล' : 'บันทึกเปิดใช้งานแคมเปญใหม่'}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Ads list table & individual stats */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-sand-200 p-6 shadow-sm overflow-hidden space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 pb-2 border-b border-stone-100">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span>สรุปผลการแสดงโฆษณาและรายได้สะสม ({ads.length} รายการ)</span>
            </h3>

            {loading ? (
              <div className="text-center py-24 space-y-1">
                <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs text-stone-400 font-mono">กำลังกู้ข้อมูลแคมเปญจากคลาวด์...</p>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <ImageIcon className="h-10 w-10 text-stone-300 mx-auto mb-2" />
                <h4 className="font-bold text-stone-800 text-xs">ไม่พบบันทึกแคมเปญโฆษณาใดๆ ในระบบ</h4>
                <p className="text-[10px] text-stone-400 font-sans mt-0.5">
                  คุณสามารถกรอกรายละเอียดที่บานทางซ้ายด้านบนเพื่อสร้างโฆษณาชิ้นแรกได้ทันทีเพื่อให้ไปสุ่มแสดงต่อยูสเซอร์ในหน้ารักษ์ธรรมชาติหน้าแรก!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left border-collapse" id="ads-performance-table">
                  <thead>
                    <tr className="border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-50/50">
                      <th className="py-3 px-3">สื่อแคมเปญ</th>
                      <th className="py-3 px-3">เรทโฆษณา</th>
                      <th className="py-3 px-3 text-center">Impression</th>
                      <th className="py-3 px-3 text-center">Click</th>
                      <th className="py-3 px-3 text-center">CTR (%)</th>
                      <th className="py-3 px-3 text-right">รายได้คาดการณ์</th>
                      <th className="py-3 px-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => {
                      const individualCTR = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
                      const individualRevenue = ((ad.cpm || 0) * (ad.impressions || 0)) / 1000 + (ad.cpc || 0) * (ad.clicks || 0);

                      return (
                        <tr 
                          key={ad.id} 
                          className={`border-b border-stone-100 text-xs hover:bg-stone-50/40 transition-colors ${
                            editingAdId === ad.id ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Media Campaign Item */}
                          <td className="py-3 px-2 flex items-center gap-3">
                            <img 
                              src={ad.imageUrl} 
                              alt={ad.title} 
                              className="w-12 h-10 object-cover rounded-md border border-stone-200 shrink-0" 
                            />
                            <div className="space-y-0.5 max-w-[150px]">
                              <span className="font-bold text-stone-800 block truncate" title={ad.title}>
                                {ad.title}
                              </span>
                              <a 
                                href={ad.targetUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] text-forest-700 hover:underline flex items-center gap-0.5 truncate"
                              >
                                <span>ลิงก์ชิ้นงาน</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </td>

                          {/* Ads Rate settings */}
                          <td className="py-3 px-3 font-mono text-[10px] space-y-0.5 text-stone-600">
                            <div>CPM: ฿{ad.cpm}</div>
                            <div>CPC: ฿{ad.cpc}</div>
                          </td>

                          {/* Impressions summary */}
                          <td className="py-3 px-3 text-center font-mono font-medium text-stone-700">
                            {(ad.impressions || 0).toLocaleString()}
                          </td>

                          {/* Clicks summary */}
                          <td className="py-3 px-3 text-center font-mono font-medium text-stone-700">
                            {(ad.clicks || 0).toLocaleString()}
                          </td>

                          {/* CTR efficiency metric */}
                          <td className="py-3 px-3 text-center font-mono text-stone-800 font-semibold">
                            {individualCTR.toFixed(2)}%
                          </td>

                          {/* Forecasted revenue generated */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                            ฿{individualRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* CRUD / Toggle Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Power state toggle */}
                              <button
                                id={`ad-power-${ad.id}`}
                                onClick={() => handleToggleActive(ad)}
                                title={ad.active ? 'ระงับโฆษณาชิ้นนี้ชั่วคราว' : 'เปิดใช้งานโฆษณาชิ้นนี้'}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  ad.active 
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' 
                                    : 'bg-stone-100 text-stone-400 hover:bg-stone-200 border-stone-200'
                                }`}
                              >
                                {ad.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                              </button>

                              {/* Edit click */}
                              <button
                                id={`ad-edit-${ad.id}`}
                                onClick={() => handleEditAdClick(ad)}
                                title="แก้ไขสเปกโฆษณาชิ้นนี้"
                                className="p-1.5 rounded-lg border bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-250 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete click */}
                              <button
                                id={`ad-delete-${ad.id}`}
                                onClick={() => handleDeleteAd(ad.id)}
                                title="ลบถาวร"
                                className="p-1.5 rounded-lg border bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
