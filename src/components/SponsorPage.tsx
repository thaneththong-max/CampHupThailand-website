/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  ArrowLeft, CreditCard, UploadCloud, FileText, CheckCircle2, Sparkles, Send, 
  Building, Check, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';

interface SponsorPageProps {
  user: User | null;
  onNavigate: (path: string) => void;
}

const PRESET_SPONSOR_IMAGES = [
  { name: 'หุบเขาแคมป์เปอร์', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop' },
  { name: 'เครื่องเขียนพิกัด', url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop' },
  { name: 'กาแฟสายดริปแคมป์', url: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?q=80&w=800&auto=format&fit=crop' }
];

export default function SponsorPage({ user, onNavigate }: SponsorPageProps) {
  // Form values
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [months, setMonths] = useState(1);
  
  // File upload values
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [base64File, setBase64File] = useState<string | null>(null);
  
  // Statuses
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pricePerMonth = 2000;
  const totalPrice = pricePerMonth * months;

  // File picker handler
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพ (JPG/PNG) หรือไฟล์เอกสาร PDF เท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ขนาดหลักฐานห้ามเกิน 5MB');
      return;
    }
    
    setFileName(file.name);
    setErrorMsg(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64File(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Construct standard Base64 safe RFC2822 formatting for Gmail sending
  const makeEmail = (to: string, subject: string, message: string) => {
    const str = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      message
    ].join('\r\n');
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Form submission
  const handleSubmitSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('/auth');
      return;
    }

    if (!title.trim() || !imageUrl.trim() || !targetUrl.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลแคมเปญให้ครบถ้วนทุกช่อง');
      return;
    }

    if (!base64File) {
      setErrorMsg('กรุณาแนบไฟล์สลิปหลักฐานการโอนเงินเพื่อยืนยันคำขอ');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Save data into Firestore 'ad_submissions'
      const submissionData = {
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        targetUrl: targetUrl.trim(),
        months: Number(months),
        totalPrice,
        slipName: fileName,
        slipBase64: base64File,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        userEmail: user.email || '',
        userUid: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unknown Camper'
      };

      const docRef = await addDoc(collection(db, 'ad_submissions'), submissionData);

      // 2. Read admin's Gmail access token to notify the admin immediately!
      const adminGmailNotificationRef = doc(db, 'configs', 'gmail_notification');
      const tokenSnap = await getDoc(adminGmailNotificationRef);
      
      let emailNotified = false;
      if (tokenSnap.exists()) {
        const { accessToken } = tokenSnap.data();
        if (accessToken) {
          try {
            // Send email to thaneththong@gmail.com
            const emailSubject = `🏕️ [CampHub Thailand Sponsor] มีการส่งหลักฐานโอนเงินค่าโฆษณาใหม่ เข้าตรวจสอบด่วน!`;
            const emailBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2d8cd; border-radius: 16px; overflow: hidden; background-color: #FAF6F0; color: #1c1917;">
                <div style="background-color: #1c352d; color: #faf6f0; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">สปอนเซอร์โฆษณาใหม่รอการอนุมัติ</h1>
                </div>
                <div style="padding: 24px; line-height: 1.6;">
                  <p>มีผู้ใช้งาน <b>${submissionData.userName}</b> (${submissionData.userEmail}) ส่งหลักฐานชำระเงินค่าโฆษณาเข้ามาในระบบ CampHub Thailand แล้ว!</p>
                  
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; border: 1px solid #e7dfd5; margin: 16px 0;">
                    <h3 style="margin-top: 0; color: #1c352d;">รายละเอียดแคมเปญ:</h3>
                    <p style="margin: 4px 0;"><b>หัวข้อโฆษณา:</b> ${submissionData.title}</p>
                    <p style="margin: 4px 0;"><b>จำนวนโฆษณา:</b> ${submissionData.months} เดือน</p>
                    <p style="margin: 4px 0; color: #d97706; font-size: 16px;"><b>ยอดโอน:</b> ฿${totalPrice.toLocaleString()} บาท</p>
                    <p style="margin: 4px 0;"><b>ชื่อไฟล์สลิป:</b> ${submissionData.slipName}</p>
                  </div>
                  
                  <p>กรุณาลงชื่อเข้าใช้ด้วยบัญชีแอดมิน เพื่อไปที่ <b>เมนูหน้าผู้จัดการ (Admin Panel)</b> เพื่อเปิดดูสลิปโอนเงิน ทำการตรวจสอบความถูกต้อง และอนุมัติรับสปอนเซอร์ เพื่อแสดงป้ายโฆษณานี้สู่แผนที่แคมป์ปิ้งโดยทันที!</p>
                  
                  <div style="text-align: center; margin-top: 24px;">
                    <a href="https://ais-pre-ih6tqbzenaawvk6kcn2mwu-232641877478.asia-southeast1.run.app/admin" style="background-color: #8c5d3b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">ไปที่หน้าระบบแอดมินด่วน</a>
                  </div>
                </div>
                <div style="background-color: #ebdcb2/30; padding: 12px; font-size: 11px; text-align: center; color: #78716c; border-top: 1px solid #e7dfd5;">
                  ระบบ CampHub Thailand Automation • ทำงานร่วมกับ Google Workspace APIs
                </div>
              </div>
            `;

            const base64Message = makeEmail('thaneththong@gmail.com', emailSubject, emailBody);

            const emailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                raw: base64Message
              })
            });

            if (emailResponse.ok) {
              emailNotified = true;
            } else {
              console.error('Gmail send API failed with code:', emailResponse.status);
            }
          } catch (gmailErr) {
            console.error('Failed to notify admin via Gmail API:', gmailErr);
          }
        }
      }

      setSuccess(true);
      setTitle('');
      setImageUrl('');
      setTargetUrl('');
      setFileName('');
      setBase64File(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกคำขอสปอนเซอร์ โปรดลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="sponsor-page-container" className="min-h-screen bg-sand-50 py-10 font-sans text-stone-850 relative overflow-hidden">
      {/* Decorative vectors */}
      <div className="absolute top-[-50px] left-[-50px] w-80 h-80 bg-forest-100 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[300px] right-[-100px] w-96 h-96 bg-earth-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
        
        {/* Navigation line */}
        <div className="flex items-center justify-between border-b border-sand-200 pb-4">
          <button
            id="sponsor-back-btn"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-forest-800 hover:text-forest-950 bg-white hover:bg-stone-50 px-3.5 py-2 rounded-xl border border-sand-250 shadow-xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับหน้าหลักแบรนด์กวาง</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold bg-amber-150 text-amber-900 px-3.5 py-1.5 rounded-full border border-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-spin" />
            <span>ลงโฆษณาโปรโมตร่วมทาง</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            ลงโฆษณาแบนเนอร์ <span className="text-earth-600">Forest Banner</span>
          </h2>
          <p className="text-xs text-stone-500 leading-normal">
            แชร์โปรโปรชั่นลานแคมป์ อุปกรณ์เช่า หรือผลิตภัณฑ์ของคุณสู่เครือข่ายกลุ่มเป้าหมายนักแคมป์ปิ้งโดยตรง อัตราเพียง <b className="text-amber-700">฿2,000 บาท ต่อเดือน เท่านั้น</b>
          </p>
        </div>

        {!user ? (
          /* Login Guard page */
          <div id="sponsor-login-guard" className="bg-white rounded-3xl border border-sand-220 p-10 text-center space-y-5 shadow-sm max-w-md mx-auto">
            <div className="mx-auto w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200 text-amber-700">
              <Layers className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 text-base">กรุณาเข้าสู่ระบบก่อนอัปโหลดสื่อโฆษณา</h4>
              <p className="text-xs text-stone-500 leading-normal">
                เพื่อให้คุณสามารถอัปโหลดจัดเก็บแคมเปญโฆษณา และตรวจสอบประวัติสถานะอนุมัติภายใต้ประวัติบัญชีผู้ใช้งานของคุณได้
              </p>
            </div>
            <button
              onClick={() => onNavigate('/auth')}
              className="px-5 py-3 bg-forest-900 hover:bg-forest-800 text-white rounded-2xl text-xs font-bold transition-all shadow active:scale-95 inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบหรือสมัครแคมป์ปิ้งทันที</span>
            </button>
          </div>
        ) : (
          /* Main sponsor application wizard layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Box: Payment Details cards */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-sand-220 p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Bank Payment Transfer</span>
                  <h3 className="text-lg font-bold text-stone-900">ขั้นตอนการชำระสิทธิ์แบนเนอร์</h3>
                  <p className="text-xs text-stone-500 font-sans mt-0.5 leading-normal">
                    กรุณาโอนเงินตามจำนวนเดือนที่คุณต้องการลงโฆษณา (฿2,000/เดือน) มาที่บัญชีธนาคารด้านล่าง จากนั้นแนบหลักฐานสลิปการโอนที่แบบฟอร์มด้านขวา
                  </p>
                </div>

                {/* Kasikorn Visual Credit Card details */}
                <div className="bg-gradient-to-br from-green-800 to-emerald-950 text-white rounded-2xl p-5 border border-green-700 relative overflow-hidden shadow-md">
                  <div className="absolute right-4 bottom-4 text-emerald-800/20"><Building className="w-24 h-24" /></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-emerald-300 block">ธนาคารสำหรับการโอน</span>
                      <span className="text-sm font-black tracking-tight text-white block">ธนาคารกสิกรไทย (KBANK)</span>
                    </div>
                    <CreditCard className="w-6 h-6 text-emerald-300" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-emerald-300 block">เลขที่บัญชีรับเงิน (Account No.)</span>
                      <span className="text-lg font-mono font-bold tracking-widest text-[#EBDCB2] block">128-8-01962-9</span>
                    </div>

                    <div className="flex justify-between items-center gap-1">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-emerald-300 block">ชื่อบัญชีรับเงิน (Holder)</span>
                        <span className="text-xs font-bold text-white block">นายธเนษฐ ทองมณี</span>
                      </div>
                      <div className="bg-emerald-700/80 border border-emerald-500 rounded px-2.5 py-1 text-[10px] font-semibold text-white">
                        กระแสรายวัน
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-stone-700 space-y-2 text-xs">
                  <span className="font-bold text-amber-800 block">ℹ️ ข้อมูลการจัดวางสิทธิ์:</span>
                  <ul className="list-disc pl-4 space-y-1 block leading-normal text-[11px]">
                    <li>ราคาคงที่ <b className="text-amber-800">฿2,000 ต่อ 1 เดือนแรกเรตเดียว</b></li>
                    <li>แบนเนอร์จะสุ่มแสดงต่อสายตายูสเซอร์บนหน้าแผนที่หลัก</li>
                    <li>เมื่อแอดมินอนุมัติแคมเปญจะเริ่มต้นสัญญาทันที</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-sand-200 pt-4 mt-6">
                <span className="text-[11px] text-stone-400 block font-sans">
                  ⏱️ แอดมินจะได้รับ Gmail แจ้งเตือนด่วนเพื่อเปิดระบบมาอนุมัติให้กับคุณภายในไม่กี่นาที
                </span>
              </div>
            </div>

            {/* Right Box: Setup details and slip uploader file */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-sand-220 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
              
              <form onSubmit={handleSubmitSponsor} className="space-y-4">
                
                {success && (
                  <div id="sponsor-success-widget" className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-850 text-xs rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">ส่งหลักฐานสลิปและข้อมูลสำเร็จ!</span>
                      <span className="text-[10px] block text-emerald-700 leading-normal">
                        ระบบจัดตั้งแคมเปญของคุณเรียบร้อยแล้ว แอดมิน <b className="text-forest-900">thaneththong@gmail.com</b> ได้รับสาส์นด่วนทาง Gmail เรียบร้อยแล้ว ขอเวลารอสักครู่แอดมินจะกดยืนยันให้ทันที!
                      </span>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div id="sponsor-error-widget" className="p-3.5 bg-rose-50 border border-rose-150 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="font-bold">{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700" htmlFor="sponsor-title-input">
                    หัวข้อโฆษณา / ป้ายแบนเนอร์โฆษณา *
                  </label>
                  <input
                    id="sponsor-title-input"
                    type="text"
                    required
                    placeholder="เช่น เช่าเต็นท์กวางป่า อุปกรณ์ครบครันลดเพิ่ม 15% ทันที"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700 animate-pulse" htmlFor="sponsor-months-select">
                      ระยะเวลาโฆษณา (เดือน) *
                    </label>
                    <select
                      id="sponsor-months-select"
                      value={months}
                      onChange={(e) => setMonths(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 bg-white"
                    >
                      {[1, 2, 3, 6, 12].map(m => (
                        <option key={m} value={m}>เช่าสปอนเซอร์ {m} เดือน</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      สรุปยอดที่ต้องโอนเงินจริง
                    </label>
                    <div className="w-full bg-sand-100 border border-sand-200 text-stone-800 p-2.5 rounded-xl font-bold font-mono text-center text-sm">
                      ฿{totalPrice.toLocaleString()} บาทถ้วน
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700" htmlFor="sponsor-image-url">
                    URL รูปภาพแบนเนอร์โฆษณา * (แนะนำภาพ 800 x 400 พิกเซล)
                  </label>
                  <input
                    id="sponsor-image-url"
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 font-mono"
                  />
                  
                  {/* Preset quick fill selection */}
                  <div className="flex gap-1.5 pt-1 flex-wrap">
                    <span className="text-[9px] uppercase font-bold text-stone-400 py-1">ใช้ตัวอย่าง:</span>
                    {PRESET_SPONSOR_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className="text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded border border-sand-250 transition-all"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700" htmlFor="sponsor-target-url">
                    ลิงก์ปลายทาง (Target URL / Click Destination) *
                  </label>
                  <input
                    id="sponsor-target-url"
                    type="url"
                    required
                    placeholder="https://yourbrand.com/promotion"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 font-mono"
                  />
                </div>

                {/* Drag and Drop Payment Slip uploader as specified in Usability Patterns */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    แนบไฟล์สลิปหลักฐานการโอนเงิน (Payment Slip File) *
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`w-full min-h-[110px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all relative ${
                      dragActive 
                        ? 'border-forest-600 bg-forest-50/50' 
                        : base64File 
                          ? 'border-emerald-500 bg-emerald-50/20' 
                          : 'border-sand-300 bg-stone-50 hover:bg-stone-100/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="sponsor-slip-file-picker"
                      required={!base64File}
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="text-center space-y-1 z-10 pointer-events-none">
                      {base64File ? (
                        <>
                          <Check className="h-6 w-6 text-emerald-650 mx-auto" />
                          <p className="text-xs font-bold text-emerald-800 max-w-[250px] truncate">
                            {fileName || 'ไฟล์ภาพสลิปที่แนบ'}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            ลากไฟล์ทับเพื่อแทนที่หลักฐานอันเดิม
                          </p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-7 w-7 text-stone-400 mx-auto" />
                          <p className="text-xs font-semibold text-stone-700">
                            ลากและวางใบสลิปตรงนี้ หรือ <span className="text-forest-800 hover:underline">คลิกเพื่อเลือกไฟล์</span>
                          </p>
                          <p className="text-[10px] text-stone-400 font-sans">
                            รองรับไฟล์สลิปรูปภาพ JPG, PNG ขนาดไม่เกิน 5MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="submit-ad-request"
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-forest-900 hover:bg-forest-950 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-97 select-none disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>กำลังประมวลผลคำขอแบนเนอร์...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>ยืนยันการแนบสลิปเพื่อขออนุมัติแบนเนอร์</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
