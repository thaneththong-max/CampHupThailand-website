/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Compass, Tent, Heart, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  favoritesCount: number;
  onShowFavorites: () => void;
  showFavoritesOnly: boolean;
  totalCamps: number;
  user: User | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function Header({
  favoritesCount,
  onShowFavorites,
  showFavoritesOnly,
  totalCamps,
  user,
  onNavigate,
  onLogout
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-forest-900 text-sand-50 shadow-md border-b-2 border-earth-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo and Slogan */}
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => onNavigate('/')} id="header-logo-container">
          <div className="bg-forest-700 p-2 rounded-xl border border-forest-400">
            <Tent className="h-6 w-6 text-forest-300 animate-pulse" id="header-logo-icon" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              CampHub Thailand <span className="text-xs font-normal text-forest-400 bg-forest-950/40 px-2 py-0.5 rounded border border-forest-800 hidden sm:inline">v1.2</span>
            </h1>
            <p className="text-xs text-forest-300 font-sans font-medium tracking-tight">ศูนย์รวมพิกัดลานกางเต็นท์อันดับหนึ่งของพรานแคมป์</p>
          </div>
        </div>

        {/* Middle Navigation Menu */}
        <nav className="hidden lg:flex items-center space-x-1 font-sans text-xs font-bold text-forest-100">
          <button 
            id="nav-home-btn"
            onClick={() => onNavigate('/')} 
            className="hover:text-amber-300 hover:bg-forest-800/40 px-3 py-2 rounded-xl transition-all"
          >
            ค้นหาลานกางเต็นท์
          </button>
          <button 
            id="nav-sponsor-btn"
            onClick={() => onNavigate('/sponsor')} 
            className="text-amber-300 hover:text-amber-200 hover:bg-forest-800/40 px-3 py-2 rounded-xl transition-all flex items-center gap-1"
          >
            <span>ลงโฆษณา (฿2,000/ด)</span>
            <span className="bg-red-650 text-white rounded text-[8px] font-extrabold px-1 animate-pulse">HOT</span>
          </button>
          <button 
            id="nav-contact-btn"
            onClick={() => onNavigate('/contact')} 
            className="hover:text-amber-300 hover:bg-forest-800/40 px-3 py-2 rounded-xl transition-all"
          >
            ติดต่อเรา
          </button>
          {user && (
            <button 
              id="nav-profile-btn"
              onClick={() => onNavigate('/profile')} 
              className="hover:text-amber-300 hover:bg-forest-800/40 px-3 py-2 rounded-xl transition-all"
            >
              แก้ไขโปรไฟล์
            </button>
          )}
        </nav>

        {/* Stats and Action controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-4 text-xs text-forest-200 mr-2 bg-forest-950/30 px-3 py-1.5 rounded-lg border border-forest-800">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-sand-600" />
              <span>ทั้งหมด {totalCamps} แห่ง</span>
            </div>
          </div>

          <button
            id="filter-favorites-button"
            onClick={onShowFavorites}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              showFavoritesOnly
                ? 'bg-earth-500 hover:bg-earth-600 text-white shadow-inner scale-95 border border-earth-300'
                : 'bg-forest-800 hover:bg-forest-700 text-forest-50 hover:text-white border border-forest-700'
            }`}
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current text-white animate-bounce' : 'text-earth-400'}`} />
            <span>
              {showFavoritesOnly ? 'แสดงทั้งหมด' : `รายการโปรด (${favoritesCount})`}
            </span>
          </button>

          {/* User Auth controls */}
          {user ? (
            <div className="flex items-center gap-2 bg-forest-950/40 p-1 pr-3 rounded-full border border-forest-800 pl-1" id="header-user-profile-widget">
              {user.photoURL ? (
                <img
                  id="header-user-avatar"
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-7 w-7 rounded-full border border-forest-600"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div id="header-user-fallback-icon" className="h-7 w-7 bg-forest-750 rounded-full border border-forest-600 flex items-center justify-center text-forest-300">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
              <span className="text-xs font-semibold text-forest-200 hidden lg:inline max-w-[100px] truncate" id="header-user-name">
                {user.displayName || user.email?.split('@')[0] || 'ชาวแคมป์'}
              </span>
              <button
                id="header-logout-button"
                onClick={onLogout}
                title="ออกจากระบบ"
                className="hover:bg-red-950/40 p-1.5 rounded-full text-red-400 hover:text-red-300 transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="header-login-button"
              onClick={() => onNavigate('/auth')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-550 hover:bg-amber-600 text-white border border-amber-400 active:scale-95 transition-all duration-300 hover:shadow-md"
            >
              <LogIn className="h-4 w-4" />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Header Navigation bar */}
      <div className="flex lg:hidden items-center justify-around border-t border-forest-800/40 bg-forest-950/25 py-2 px-1 text-[11px] font-bold text-forest-100">
        <button id="mobile-nav-home" onClick={() => onNavigate('/')} className="hover:text-amber-300 transition-colors">ลานกางเต็นท์</button>
        <button id="mobile-nav-sponsor" onClick={() => onNavigate('/sponsor')} className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-0.5">
          <span>ลงโฆษณา (฿2,000)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </button>
        <button id="mobile-nav-contact" onClick={() => onNavigate('/contact')} className="hover:text-amber-300 transition-colors">ติดต่อเรา</button>
        {user && <button id="mobile-nav-profile" onClick={() => onNavigate('/profile')} className="hover:text-amber-300 transition-colors">โปรไฟล์</button>}
      </div>
    </header>
  );
}
