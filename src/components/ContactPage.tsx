/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Phone, Mail, MapPin, Send, MessageSquare, CheckCircle, Trees } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export default function ContactPage({ onNavigate }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => {
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div id="contact-page-container" className="min-h-screen bg-sand-50 font-sans text-stone-850 py-10 relative overflow-hidden">
      {/* Decorative ambiance blur/blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-forest-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-50px] w-96 h-96 bg-earth-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        
        {/* Back Link and Brand */}
        <div className="flex items-center justify-between border-b border-sand-200 pb-5">
          <button
            id="contact-back-btn"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-forest-800 hover:text-forest-950 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-sand-250 transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับหน้าแผนที่</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900 bg-sand-100 px-3.5 py-1.5 rounded-full border border-sand-200">
            <Trees className="h-4 w-4 text-forest-750" />
            <span>ศูนย์บริการข้อมูลชาวแคมป์</span>
          </div>
        </div>

        {/* Hero title */}
        <div className="space-y-2 text-center max-w-2xl mx-auto py-4">
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            ติดต่อผู้ดูแลระบบ <span className="text-forest-800">CampHub Thailand</span>
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            หากคุณพบปัญหาการใช้งาน มีข้อเสนอแนะเพิ่มเติม หรือสนใจติดต่อประสานงานข้อมูลพิกัดลานกางเต็นท์ ทีมแอดมินของเราพร้อมช่วยเหลือคุณเสมอ
          </p>
        </div>

        {/* Contact Split layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Card Left: Contact Info */}
          <div className="md:col-span-5 bg-forest-900 text-sand-50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-forest-950 shadow-lg relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-10 pointer-events-none"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop")' }}
            />
            
            <div className="space-y-8 z-10">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-forest-300 uppercase tracking-widest block">Contact Information</span>
                <h3 className="text-xl font-bold tracking-tight text-white leading-tight">ช่องทางติดต่อหลัก</h3>
              </div>

              {/* Direct Info List */}
              <div className="space-y-6">
                <a 
                  href="tel:0803249225"
                  className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-forest-800/50 transition-all border border-transparent hover:border-forest-700/30"
                >
                  <div className="w-10 h-10 bg-forest-850 rounded-xl flex items-center justify-center text-forest-300 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-forest-400 uppercase tracking-widest">สายด่วนแอดมิน (Phone)</span>
                    <span className="text-sm font-bold text-white block group-hover:text-amber-300 transition-colors">080-324-9225</span>
                  </div>
                </a>

                <a 
                  href="mailto:thaneththong@gmail.com"
                  className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-forest-800/50 transition-all border border-transparent hover:border-forest-700/30"
                >
                  <div className="w-10 h-10 bg-forest-850 rounded-xl flex items-center justify-center text-forest-300 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-forest-400 uppercase tracking-widest">อีเมลทางแคมป์ปิ้ง (Email)</span>
                    <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors truncate">thaneththong@gmail.com</span>
                  </div>
                </a>

                <div 
                  className="flex items-center gap-4 p-2 rounded-2xl cursor-default"
                >
                  <div className="w-10 h-10 bg-forest-850 rounded-xl flex items-center justify-center text-forest-300 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-forest-400 uppercase tracking-widest">พิกัดสำนักงาน (Location)</span>
                    <span className="text-xs font-bold text-forest-100 block">กรุงเทพฯ - เชียงใหม่, ประเทศไทย</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 z-10 text-[10px] text-forest-400 border-t border-forest-800 font-sans mt-4">
              <p>⏱️ เวลาสนับสนุน: แอดมินตรวจสอบ ทุกวัน 08.00 - 21.00 น.</p>
            </div>
          </div>

          {/* Card Right: Live feedback Form */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-sand-220 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-sand-150">
                <MessageSquare className="h-4 w-4 text-forest-800" />
                <span>ส่งข้อความหาแอดมินโดยตรง</span>
              </h3>

              {submitted && (
                <div id="contact-success-alert" className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded-2xl flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">ได้รับข้อความเรียบร้อย!</span>
                    <span className="text-[10px] text-emerald-700">แอดมินจะติดต่อกลับคุณทางที่อยู่อีเมลที่แจ้งไว้ในครึ่งชั่วโมง</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700" htmlFor="contact-name-input">
                      ชื่อของคุณ *
                    </label>
                    <input
                      id="contact-name-input"
                      type="text"
                      required
                      placeholder="ระบุชื่อจริงหรือนามสมมุติ"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 bg-stone-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700" htmlFor="contact-email-input">
                      ที่อยู่อีเมลของคุณ *
                    </label>
                    <input
                      id="contact-email-input"
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 bg-stone-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700" htmlFor="contact-msg-input">
                    หัวข้อหรือข้อร้องเรียนที่คุณต้องการสอบถาม *
                  </label>
                  <textarea
                    id="contact-msg-input"
                    required
                    rows={4}
                    placeholder="เขียนรายละเอียดข้อสเปกแคมป์ สายดิน ชลประทาน หรือปัญหาบัญชี..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-forest-800 bg-stone-50/50"
                  />
                </div>

                <button
                  id="submit-contact-btn"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-forest-850 hover:bg-forest-900 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all active:scale-98 select-none"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>ส่งสาส์นหาแกลลอรี่ทันที</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
