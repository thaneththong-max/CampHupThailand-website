/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  auth, 
  googleProvider, 
  facebookProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  registerOrFetchUser
} from '../lib/firebase';
import { 
  Mail, Lock, Chrome, Facebook, Trees, Compass, ArrowLeft, Eye, EyeOff, Sparkles, User, LogIn, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface AuthPageProps {
  onNavigate: (path: string) => void;
}

export default function AuthPage({ onNavigate }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Validation basic
        if (password.length < 6) {
          throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await registerOrFetchUser(userCredential.user.uid, email, displayName || email.split('@')[0]);
        setSuccess('สมัครสมาชิกสำเร็จเรียบร้อย! กำลังนำคุณเข้าสู่ระบบ...');
        setTimeout(() => {
          onNavigate('/');
        }, 1500);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await registerOrFetchUser(userCredential.user.uid, userCredential.user.email || email, userCredential.user.displayName || '');
        setSuccess('เข้าสู่ระบบสำเร็จ! ขอต้อนรับท่านแคมป์เปอร์...');
        setTimeout(() => {
          onNavigate('/');
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'เกิดข้อผิดพลาดคลาวด์เซสชัน โปรดลองใหม่อีกครั้ง';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'อีเมลนี้ถูกใช้งานแล้วในระบบ';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'รูปแบบอีเมลไม่เหมาะสม';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await registerOrFetchUser(
        userCredential.user.uid, 
        userCredential.user.email || '', 
        userCredential.user.displayName || '', 
        userCredential.user.photoURL || undefined
      );
      setSuccess('เข้าสู่ระบบด้วย Google สำเร็จ! ยินดีต้อนรับคนรักธรรมชาติ...');
      setTimeout(() => {
        onNavigate('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ Google โปรดลองอีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userCredential = await signInWithPopup(auth, facebookProvider);
      await registerOrFetchUser(
        userCredential.user.uid, 
        userCredential.user.email || `${userCredential.user.uid}@facebook.com`, 
        userCredential.user.displayName || 'Facebook User', 
        userCredential.user.photoURL || undefined
      );
      setSuccess('เข้าสู่ระบบด้วย Facebook สำเร็จ! ยินดีต้อนรับคนรักธรรมชาติ...');
      setTimeout(() => {
        onNavigate('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ Facebook โปรดลองอีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const demoEmail = 'democamper@camphub.com';
      const demoPassword = 'democamper123';
      try {
        // Try to sign in
        const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        await registerOrFetchUser(userCredential.user.uid, demoEmail, 'นักแคมป์ปิ้งจำลอง (Demo)');
      } catch (err: any) {
        // If not found or credential invalid, create it
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await registerOrFetchUser(userCredential.user.uid, demoEmail, 'นักแคมป์ปิ้งจำลอง (Demo)');
        } else {
          throw err;
        }
      }
      setSuccess('เข้าสู่ระบบด่วนด้วยบัญชีทดลองสำเร็จ เรียบร้อย!');
      setTimeout(() => {
        onNavigate('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถใช้บัญชีทดลองได้ในระบบชั่วคราว โปรดใช้วิธีอื่น');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="auth-container" 
      className="min-h-screen bg-stone-50 flex flex-col md:flex-row relative overflow-hidden font-sans"
    >
      {/* Decorative Forest background vectors/blobs for visual style alignment */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-forest-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-earth-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse pointer-events-none" />

      {/* Visual earth panel - Left/Top */}
      <div 
        id="auth-visual-hero-panel"
        className="w-full md:w-1/2 bg-forest-900 border-r border-forest-950 flex flex-col justify-between p-8 md:p-16 text-sand-50 relative min-h-[300px] md:min-h-screen"
      >
        {/* Background texture overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-15 pointer-events-none"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200&auto=format&fit=crop")' }}
        />

        <div className="flex items-center justify-between z-10">
          <button
            id="auth-visual-back-button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-forest-300 hover:text-white transition-colors bg-forest-950/40 px-3.5 py-2 rounded-xl border border-forest-800 backdrop-blur-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับหน้าหลัก</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700/80 px-3.5 py-1.5 rounded-full border border-emerald-500 shadow-sm">
            <Compass className="h-3.5 w-3.5 animate-spin" />
            <span>ระบบความปลอดภัยสูง (SSL/Firebase Secure)</span>
          </div>
        </div>

        <div className="space-y-4 my-auto py-12 md:py-0 z-10 max-w-sm">
          <div className="bg-forest-800 p-3 rounded-2xl border border-forest-600 inline-block">
            <Trees className="h-8 w-8 text-forest-300" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            ร่วมเป็นส่วนหนึ่งกับ <span className="text-emerald-300">CampHub Thailand</span>
          </h2>
          <p className="text-sm text-forest-200 leading-relaxed font-sans">
            บันทึกจุดกางเต็นท์ในฝัน เขียนรีวิวแลกเปลี่ยนประสบการณ์ และค้นหาสถานที่แคมป์ปิ้งคุณภาพที่มีความสะดวกสบาย พร้อมพิกัดสถานีชาร์จรถไฟฟ้า (EV Charging) ทั่วประเทศ
          </p>

          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-forest-800/80">
            <div className="p-3 bg-forest-950/40 rounded-xl border border-forest-800/60">
              <span className="block text-[10px] font-bold text-forest-400 uppercase tracking-widest">อุทยานทั่วประเทศ</span>
              <span className="text-lg font-bold text-white">100% ครอบคลุม</span>
            </div>
            <div className="p-3 bg-forest-950/40 rounded-xl border border-forest-800/60">
              <span className="block text-[10px] font-bold text-forest-400 uppercase tracking-widest">จุดชาร์จ EV</span>
              <span className="text-lg font-bold text-white">ค้นหารัศมี 30 กม.</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-forest-400 flex items-center gap-1 z-10 font-mono">
          <span>CAMPHUB THAILAND CO-PILOT APP © 2026</span>
        </div>
      </div>

      {/* Auth action control forms - Right/Bottom */}
      <div 
        id="auth-form-card-panel"
        className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-white shrink-0"
      >
        <motion.div 
          key={isSignUp ? 'signup-step' : 'login-step'}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Form Header info */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-forest-700 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-earth-500 fill-earth-200" />
              <span>ยินดีต้อนรับชาวแคมป์</span>
            </div>
            <h3 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              {isSignUp ? 'สร้างบัญชีชาวแคมป์ของคุณ' : 'เข้าสู่ระบบ CampHub Thailand'}
            </h3>
            <p className="text-xs text-stone-500">
              {isSignUp ? 'สมัครเป็นสมาชิกคนพิเศษเพื่อบันทึกบันทึกการเดินทาง' : 'เข้าสู่เซสชันของคุณเพื่อเริ่มต้นการเดินทางค่ายธรรมชาติ'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div 
              id="auth-error-banner"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs animate-slide-in"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div 
              id="auth-success-banner"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs animate-slide-in"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{success}</span>
            </div>
          )}

          {/* Primary Google Gmail Auth Option - Extremely prominent */}
          <div className="space-y-3 bg-gradient-to-br from-red-50/40 via-white to-orange-50/30 p-4 sm:p-5 rounded-3xl border border-red-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#EA4335] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EA4335] animate-pulse" />
                สมัครและเข้าสู่ระบบด้วย Google (Gmail)
              </span>
              <span className="bg-[#EA4335]/15 text-[#D62F20] text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                แนะนำ: ง่ายใน 1 คลิก
              </span>
            </div>
            <button
              id="btn-google-oauth-sign-in"
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-[#EA4335] hover:bg-[#D62F20] text-white font-extrabold py-3.5 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-lg active:scale-99 hover:scale-101 border border-red-500 cursor-pointer text-center"
            >
              <Chrome className="h-4.5 w-4.5 text-white fill-white/10 shrink-0" />
              <span>ลงทะเบียน / เข้าสู่ระบบด้วย Google Gmail</span>
            </button>
            <p className="text-[10px] text-stone-500 leading-normal text-center">
              *ข้อมูลสมาชิก เช่น อีเมล รูปโปรไฟล์ และชื่อแสดงผล จะถูกซิงก์เข้าระบบโดยอัตโนมัติอย่างถูกต้องและปลอดภัย
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-4 text-stone-450 text-[10px] uppercase font-bold tracking-widest">หรือ ลงชื่อเข้าใช้ด้วยอีเมลปกติ</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* Core Auth Forms - Now secondary */}
          <form id="email-auth-form" onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700" htmlFor="auth-name-input">
                  ชื่อเล่นของชาวแคมป์
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    placeholder="ระบุชื่อเรียกในระบบ"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent text-sm text-stone-800 bg-stone-50/50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700" htmlFor="auth-email-input">
                ที่อยู่อีเมล (Email)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent text-sm text-stone-800 bg-stone-50/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700" htmlFor="auth-password-input">
                  รหัสผ่าน (Password)
                </label>
                {!isSignUp && (
                  <span className="text-[10px] text-stone-400 hover:text-forest-700 cursor-help font-medium">
                    ต้องการความช่วยเหลือ?
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="• • • • • • •"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent text-sm text-stone-800 bg-stone-50/50"
                />
                <button
                  id="toggle-auth-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              id="submit-auth-button"
              type="submit"
              disabled={isLoading}
              className="w-full bg-forest-800 hover:bg-forest-900 text-white font-bold p-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-1 focus:ring-forest-700 select-none disabled:opacity-50 disabled:cursor-wait"
            >
              <LogIn className="h-4 w-4 text-forest-200" />
              <span>
                {isLoading ? 'โปรดรอสักครู่...' : isSignUp ? 'ลงทะเบียนครอบครัวแคมป์เปอร์' : 'ลงชื่อเข้าใช้ระบบค่าย'}
              </span>
            </button>
          </form>

          {/* Secondary Social/Demo Auth fallbacks */}
          <div className="space-y-2 pt-2">
            <button
              id="btn-demo-auth-sign-in"
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold p-3 rounded-2xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all duration-300 border border-amber-600/30 shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-950 shrink-0 animate-bounce" />
              <span>⚡ ทดลองเข้าใช้งานทันทีด้วยบัญชีตัวอย่าง</span>
            </button>

            <button
              id="btn-facebook-auth-sign-in"
              type="button"
              onClick={handleFacebookAuth}
              disabled={isLoading}
              className="w-full bg-[#1877F2]/10 hover:bg-[#1877F2]/15 text-[#1877F2] font-semibold p-2.5 rounded-2xl text-[11px] flex items-center justify-center gap-1.5 transition-all duration-300 border border-[#1877F2]/20 cursor-pointer"
            >
              <Facebook className="h-3.5 w-3.5 fill-[#1877F2]" />
              <span>เข้าสู่ระบบสำรองด้วย Facebook</span>
            </button>
          </div>

          {/* Toggle Login/Sign Up link */}
          <p className="text-center text-xs text-stone-500 font-sans">
            {isSignUp ? 'มีบัญชีชาวแคมป์อยู่แล้ว?' : 'ยังไม่มีบัญชีชาวแคมป์ใช่ไหม?'}{' '}
            <button
              id="toggle-auth-signup-mode-button"
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-forest-700 hover:text-forest-900 font-bold hover:underline transition-colors focus:outline-none"
            >
              {isSignUp ? 'เข้าสู่ระบบที่นี่' : 'สมัครสมาชิกฟรีตอนนี้'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
