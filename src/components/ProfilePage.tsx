/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, auth, updateProfile } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  User as UserIcon, LogOut, ShieldAlert, ArrowLeft, Heart, CheckCircle2, AlertCircle, Edit2, ShieldCheck, Mail, Calendar
} from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function ProfilePage({ user, onNavigate, onLogout }: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load additional profile details from Firestore
  useEffect(() => {
    async function loadProfile() {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserRole(data.role || 'user');
          if (data.createdAt) {
            setCreatedAt(new Date(data.createdAt).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }));
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    }
    loadProfile();
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // 1. Update firebase auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: newName.trim()
        });
      }

      // 2. Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: newName.trim()
      });

      setDisplayName(newName.trim());
      setIsEditing(false);
      setSuccess('อัปเดตชื่อแสดงผลชาวแคมป์ของคุณสำเร็จ!');
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถอัปเดตโปรไฟล์ได้ โปรดลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    onNavigate('/');
  };

  return (
    <div id="profile-page-container" className="min-h-screen bg-stone-50 py-8 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Back navigation */}
        <div className="mb-6">
          <button
            id="profile-back-button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-forest-700 hover:text-forest-900 bg-sand-100 hover:bg-sand-200/80 px-4 py-2 rounded-2xl border border-sand-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับสู่หน้าแผนที่และจุดกางเต็นท์</span>
          </button>
        </div>

        {/* Profile Card layout */}
        <div className="bg-white rounded-3xl border border-sand-200 shadow-xl overflow-hidden">
          
          {/* Cover photo */}
          <div className="h-36 bg-forest-900 relative">
            <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20"
                 style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop")' }} />
            
            <div className="absolute -bottom-12 left-8">
              {user.photoURL ? (
                <img
                  id="profile-avatar-img"
                  src={user.photoURL}
                  alt={displayName}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-stone-100 shadow-stone-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div id="profile-avatar-fallback" className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-forest-100 flex items-center justify-center text-forest-600">
                  <UserIcon className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="absolute right-6 bottom-4">
              {userRole === 'admin' ? (
                <div id="profile-badge-admin" className="flex items-center gap-1.5 bg-amber-500/90 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-amber-300 shadow-sm backdrop-blur-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>ผู้ดูแลระบบ (Admin)</span>
                </div>
              ) : (
                <div id="profile-badge-user" className="flex items-center gap-1.5 bg-forest-600/95 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-forest-500 shadow-sm backdrop-blur-xs">
                  <Heart className="h-3.5 w-3.5" />
                  <span>ชาวแคมป์ทั่วไป (Camper)</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile details */}
          <div className="pt-16 p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="profile-user-displayname" className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                    {displayName || 'ชาวแคมป์ไร้นาม'}
                  </h2>
                  <p className="text-xs text-stone-500 block font-mono">{user.email}</p>
                </div>

                {!isEditing && (
                  <button
                    id="profile-edit-name-toggle"
                    onClick={() => {
                      setNewName(displayName);
                      setIsEditing(true);
                      setSuccess(null);
                      setError(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-white hover:bg-forest-800 border border-forest-600 px-3.5 py-2 rounded-xl transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>แก้ไขชื่อเรียก</span>
                  </button>
                )}
              </div>

              {/* Edit display name form */}
              {isEditing && (
                <form id="profile-name-edit-form" onSubmit={handleUpdateName} className="mt-4 p-4 rounded-2xl bg-sand-50 border border-sand-200 shadow-inner max-w-md space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700" htmlFor="edit-name-input">
                      แก้ไขชื่อแสดงตนของคุณ
                    </label>
                    <input
                      id="edit-name-input"
                      type="text"
                      required
                      placeholder="ระบุชื่อแสดงใหม่ของคุณ..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-forest-600 focus:outline-none text-stone-800 bg-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="profile-save-name-button"
                      type="submit"
                      disabled={isLoading}
                      className="bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                    <button
                      id="profile-cancel-name-button"
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Notification messages */}
            {success && (
              <div id="profile-success-banner" className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div id="profile-error-banner" className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* General details table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-150">
                <Mail className="h-5 w-5 text-stone-400" />
                <div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">การยืนยันตัวตน</span>
                  <span className="text-xs font-semibold text-stone-800">
                    {user.emailVerified ? 'ยืนยันอีเมลเรียบร้อย' : 'ลงทะเบียนผ่านระบบแอป'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-150">
                <Calendar className="h-5 w-5 text-stone-400" />
                <div>
                  <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">ลงทะเบียนเข้าร่วมเมื่อ</span>
                  <span className="text-xs font-semibold text-stone-800">
                    {createdAt || 'ไม่ระบุวันเวลา'}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin control panel link and Logout action buttons */}
            <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              {userRole === 'admin' && (
                <button
                  id="profile-goto-admin-button"
                  onClick={() => onNavigate('/admin')}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-colors shadow-md hover:shadow-lg"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>เข้าสู่ระบบจัดการโฆษณา (Admin Panel)</span>
                </button>
              )}

              <button
                id="profile-logout-button"
                onClick={handleLogoutClick}
                className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold px-6 py-3 rounded-2xl text-xs transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>ออกจากเซสชัน</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
