/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, MapPin, Trees, Mountain, Heart, Eye, Share2, Check, Navigation } from 'lucide-react';
import { CampSite } from '../types';

interface CampCardProps {
  camp: CampSite;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelect: (camp: CampSite) => void;
}

export default function CampCard({
  camp,
  isFavorite,
  onToggleFavorite,
  onSelect
}: CampCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const shareText = `🏕️ แนะนำจุดกางเต็นท์ธรรมชาติ: ${camp.name} (จังหวัด ${camp.province})\n🏔️ ${camp.elevation}\n📍 พิกัดนำทาง Google Maps: https://www.google.com/maps/dir/?api=1&destination=${camp.latitude},${camp.longitude}\n🌿 ดูจุดเที่ยวอื่นๆ เพิ่มเติมและปักหมุดลานแคมป์ทางพิกัดแอพฯ: ${window.location.origin}?camp=${camp.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: camp.name,
          text: `ทริปแคมป์ปิ้งธรรมชาติปักหมุดที่นี่: ${camp.name} จังหวัด ${camp.province}`,
          url: `${window.location.origin}?camp=${camp.id}`
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.log('Web Share API sharing cancelled or failed, using clipboard', err);
        fallbackCopyShare(shareText);
      }
    } else {
      fallbackCopyShare(shareText);
    }
  };

  const fallbackCopyShare = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy to clipboard', err);
    });
  };

  return (
    <div
      id={`camp-card-${camp.id}`}
      onClick={() => onSelect(camp)}
      className="group bg-white rounded-2xl overflow-hidden border border-sand-200 hover:border-forest-300 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col h-full hover:-translate-y-1"
    >
      {/* Thumbnail and Tags */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        <img
          src={camp.image}
          alt={camp.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Dark overlay for top action items */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />

        {/* Type tag */}
        <div className="absolute top-3 left-3 flex items-center space-x-1">
          {camp.type === 'national' ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-forest-900/90 text-forest-100 backdrop-blur-xs rounded-lg border border-forest-500/30">
              <Trees className="h-3.5 w-3.5 text-forest-300" />
              อุทยานแห่งชาติ
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-earth-800/90 text-earth-100 backdrop-blur-xs rounded-lg border border-earth-500/30">
              <Trees className="h-3.5 w-3.5 text-earth-300" />
              เอกชน
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          id={`favorite-badge-${camp.id}`}
          onClick={(e) => onToggleFavorite(camp.id, e)}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-earth-900 rounded-full shadow-sm border border-sand-200 transition-all duration-300 backdrop-blur-xs hover:scale-110 active:scale-95 z-10"
          title={isFavorite ? 'นำออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors ${
              isFavorite ? 'fill-earth-500 text-earth-500' : 'text-stone-400 hover:text-earth-500'
            }`}
          />
        </button>

        {/* Share Button */}
        <div className="absolute top-3 right-14 z-10 flex flex-col items-end">
          <button
            id={`share-button-${camp.id}`}
            onClick={handleShare}
            className="p-2 bg-white/90 hover:bg-white text-stone-700 hover:text-forest-700 rounded-full shadow-sm border border-sand-200 transition-all duration-300 backdrop-blur-xs hover:scale-110 active:scale-95 flex items-center justify-center relative"
            title="แชร์พิกัดและตำแหน่งแคมป์"
          >
            {copied ? (
              <Check className="h-4.5 w-4.5 text-forest-600 animate-pulse" />
            ) : (
              <Share2 className="h-4.5 w-4.5" />
            )}
          </button>
          
          {copied && (
            <span className="mt-1 bg-stone-900/95 text-white text-[9px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap border border-white/10 backdrop-blur-md anim-fade">
              คัดลอกพิกัดพาส่งต่อกลุ่ม 🔗
            </span>
          )}
        </div>

        {/* Elevation Level */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium text-white bg-black/50 backdrop-blur-xs px-2 py-1 rounded">
          <Mountain className="h-3 w-3 text-sand-200" />
          <span>{camp.elevation}</span>
        </div>
      </div>

      {/* Camp description text */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center text-xs text-stone-500 font-medium">
            <MapPin className="h-3.5 w-3.5 text-earth-500 mr-1" />
            <span>จังหวัด{camp.province}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold bg-sand-100 text-earth-800 px-2 py-0.5 rounded-md border border-sand-200">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span>{camp.rating}</span>
          </div>
        </div>

        <h3 className="font-semibold text-stone-900 text-base line-clamp-1 group-hover:text-forest-700 transition-colors">
          {camp.name}
        </h3>
        
        <p className="text-xs text-stone-500 font-mono mt-0.5 mb-2">
          {camp.nameEn}
        </p>

        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed flex-grow">
          {camp.description}
        </p>

        {/* Bottom Details */}
        <div className="mt-4 pt-3 border-t border-sand-100 flex flex-col gap-2.5">
          {/* Key amenities list */}
          <div className="flex flex-wrap gap-1">
            {camp.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-forest-50 text-forest-700 font-medium px-2 py-0.5 rounded border border-forest-100/60"
              >
                {amenity}
              </span>
            ))}
            {camp.amenities.length > 3 && (
              <span className="text-[10px] bg-stone-50 text-stone-400 font-medium px-1.5 py-0.5 rounded border border-stone-100">
                +{camp.amenities.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs mt-0.5">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">ค่ากางเต็นท์</span>
              <span className="font-semibold text-earth-600 font-sans">{camp.priceRange}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${camp.latitude},${camp.longitude}`, '_blank');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-forest-800 to-forest-700 hover:from-forest-700 hover:to-forest-600 text-[11px] text-white font-bold rounded-lg transition-all border border-forest-900 active:scale-95 shadow-xs"
                title="นำทางด้วย Google Maps"
              >
                <Navigation className="h-3 w-3" />
                <span>นำทาง Google Maps</span>
              </button>

              <span className="flex items-center gap-1 text-forest-700 font-semibold group-hover:text-forest-500 transition-colors">
                ดูรายละเอียด
                <Eye className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
