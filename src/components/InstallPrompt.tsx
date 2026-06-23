/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, X, ChevronRight, CheckCircle2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [isDismissed, setIsDismissed] = useState(true); // Default high-safety state
  const [stepOpen, setStepOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const dismissed = localStorage.getItem('camphub-pwa-dismissed') === 'true';
    
    // Check if already in standalone browser (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed, do not show any installer buttons
    }

    // Detect mobile platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    }

    // Capture standard install trigger
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowPrompt(true);
        setIsDismissed(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS users, we show a friendly hint initially if they haven't dismissed
    if (isIos && !dismissed) {
      // Delay slightly to welcome user first
      const timer = setTimeout(() => {
        setShowPrompt(true);
        setIsDismissed(false);
      }, 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform === 'ios') {
      setStepOpen(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.info('User installed CampHub applet successfully!');
        handleDismiss();
      }
      setDeferredPrompt(null);
    } else {
      // If prompt event did not fire, open helpful step instructions
      setStepOpen(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('camphub-pwa-dismissed', 'true');
  };

  if (isDismissed || !showPrompt) return null;

  return (
    <>
      {/* Floating Sticky Mobile Installer Action banner - only visible on mobile screen sizes */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="bg-forest-950/95 border border-forest-850 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md pointer-events-auto max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-gradient-to-tr from-amber-400 to-orange-500 p-2.5 rounded-2xl text-stone-950 shrink-0">
              <Smartphone className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1">
                ติดตั้งแอป CampHub บนมือถือ
                <span className="text-[9px] bg-emerald-500/30 text-emerald-350 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">PWA</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-forest-200 mt-0.5 truncate">
                เข้าถึงพิกัดกางเต็นท์ ออฟไลน์ และลื่นไหลเหมือนแอปทั่วไป
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-[11px] px-3.5 py-2.5 rounded-xl shadow-md border border-amber-400/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ติดตั้ง</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 bg-forest-900/40 hover:bg-forest-900/80 rounded-full transition-colors cursor-pointer text-forest-300"
              title="ปิดแจ้งเตือน"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Step by Step Mobile Guide Modal */}
      <AnimatePresence>
        {stepOpen && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl overflow-hidden border border-sand-200 shadow-2xl max-w-sm w-full relative"
            >
              {/* Header */}
              <div className="bg-forest-900 text-white p-5 relative">
                <button
                  onClick={() => setStepOpen(false)}
                  className="absolute top-4 right-4 text-forest-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-amber-350" />
                  <h3 className="font-extrabold text-sm sm:text-base">คำแนะนำติดตั้งแอปพลิเคชัน</h3>
                </div>
                <p className="text-xs text-forest-200 mt-1">
                  ทำตามขั้นตอนสั้นๆ นี้เพื่อใช้งานเสมือนแอปพื้นฐานบนสมาร์ทโฟน
                </p>
              </div>

              {/* Instructions steps */}
              <div className="p-5 space-y-4 font-sans text-xs sm:text-sm text-stone-700">
                {platform === 'ios' ? (
                  <>
                    <p className="font-medium text-stone-800 text-[13px] leading-relaxed">
                      คุณกำลังใช้งานผ่านอุปกรณ์ <span className="font-bold text-forest-800">iOS (Apple Safari)</span> โปรดปฏิบัติตามคำแนะนำถัดไปนี้:
                    </p>
                    
                    <div className="space-y-3.5 mt-2">
                      <div className="flex items-start gap-3 bg-sand-50 p-2.5 rounded-xl border border-sand-200/50">
                        <div className="bg-forest-900 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">กดปุ่มแชร์ (Share) ทาสก์บาร์ Safari</p>
                          <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                            มองหาไอคอน <Share className="h-3.5 w-3.5 text-forest-800" /> บริเวณขอบจอด้านล่าง
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-sand-50 p-2.5 rounded-xl border border-sand-200/50">
                        <div className="bg-forest-900 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">เลือก "เพิ่มไปยังหน้าจอโฮม"</p>
                          <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                            เลื่อนลงมาด้านล่างแล้วแตะเมนู <PlusSquare className="h-3.5 w-3.5 text-forest-800" /> <span className="font-bold text-stone-800">"Add to Home Screen"</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-sand-50 p-2.5 rounded-xl border border-sand-200/50">
                        <div className="bg-forest-900 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          3
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">กด "เพิ่ม" (Add) ด้านบนขวา</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            พร้อมระบุชื่อและเปิดหน้าจอใช้แอปพลิเคชันได้ตรงไอคอนหน้าจอของคุณทันที!
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-stone-800 text-[13px]">
                      คลิกเพื่อดาวน์โหลดแอปพลิเคชันหรือดำเนินการผ่านเมนูเบราว์เซอร์:
                    </p>

                    <div className="space-y-3.5 mt-2">
                      <div className="flex items-start gap-3 bg-sand-50 p-2.5 rounded-xl border border-sand-200/50">
                        <div className="bg-forest-900 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">แตะเมนูมุมบนขวาของเบราว์เซอร์ (๓ จุด)</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            มองหาเครื่องหมายไข่ปลา หรือเครื่องหมายตั้งค่าเพิ่มเติม
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-sand-50 p-2.5 rounded-xl border border-sand-200/50">
                        <div className="bg-forest-900 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 leading-tight">เลือก "ติดตั้งแอป" หรือ "เพิ่มลงหน้าจอแรก"</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            เมนูดังกล่าวจะทำการบันทึกและจำลองเป็น Progressive Web App ลงในลิ้นชักแอปของคุณ
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-sand-200/80 text-center">
                  <button
                    onClick={() => {
                      setStepOpen(false);
                      handleDismiss();
                    }}
                    className="w-full bg-forest-900 hover:bg-forest-950 text-white font-bold py-2.5 px-4 rounded-xl shadow transition-colors cursor-pointer text-xs"
                  >
                    เข้าใจแล้ว, ปิดหน้าต่างนี้
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
