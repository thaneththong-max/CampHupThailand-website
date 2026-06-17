/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { Sparkles, ExternalLink, Speaker } from 'lucide-react';

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
}

export default function AdBanner() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [impressionLogged, setImpressionLogged] = useState(false);

  useEffect(() => {
    async function fetchAd() {
      try {
        const adsRef = collection(db, 'ads');
        const activeAdsQuery = query(adsRef, where('active', '==', true));
        const snapshot = await getDocs(activeAdsQuery);
        
        if (!snapshot.empty) {
          const adsList: Ad[] = [];
          snapshot.forEach((doc) => {
            adsList.push({ id: doc.id, ...doc.data() } as Ad);
          });
          
          // Randomly pick one ad
          const randomIndex = Math.floor(Math.random() * adsList.length);
          const selectedAd = adsList[randomIndex];
          setAd(selectedAd);
          setImpressionLogged(false); // Reset impression logged for the new ad
        } else {
          setAd(null);
        }
      } catch (err) {
        console.error('Error fetching ads:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAd();
  }, []);

  // Record impression automatically when ad is loaded and displayed to user
  useEffect(() => {
    if (ad && !impressionLogged) {
      const recordImpression = async () => {
        try {
          const adDocRef = doc(db, 'ads', ad.id);
          await updateDoc(adDocRef, {
            impressions: increment(1)
          });
          setImpressionLogged(true);
        } catch (err) {
          console.error('Error logging ad impression:', err);
        }
      };
      recordImpression();
    }
  }, [ad, impressionLogged]);

  const handleAdClick = async () => {
    if (!ad) return;
    
    try {
      // Record click asynchronously
      const adDocRef = doc(db, 'ads', ad.id);
      await updateDoc(adDocRef, {
        clicks: increment(1)
      });
    } catch (err) {
      console.error('Error logging ad click:', err);
    }
    
    // Open target url in a new tab safely
    window.open(ad.targetUrl, '_blank');
  };

  if (loading || !ad) {
    return null; // Don't show anything or empty space if loading or no ads are set up yet
  }

  return (
    <div 
      id={`ad-card-${ad.id}`}
      onClick={handleAdClick}
      className="bg-amber-50/50 hover:bg-amber-50 rounded-3xl border border-amber-200/80 p-4 shadow-xs transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex flex-col sm:flex-row items-stretch gap-4 overflow-hidden relative group"
    >
      {/* Tiny Sponsored badge */}
      <div className="absolute top-2.5 right-2.5 bg-amber-600 text-[9px] text-white font-extrabold px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-xs tracking-wider uppercase z-10">
        <Speaker className="h-2.5 w-2.5" />
        <span>SPONSORED AD</span>
      </div>

      {/* Hero Image */}
      <div className="w-full sm:w-1/3 h-28 sm:h-auto min-h-[96px] rounded-2xl overflow-hidden relative shrink-0 border border-amber-100 shadow-inner">
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-none" />
      </div>

      {/* Text Copy details */}
      <div className="flex-1 flex flex-col justify-between py-1 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold uppercase tracking-widest">
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-300" />
            <span>โปรโมชันพิเศษสิทธิ์ชาวแคมป์</span>
          </div>
          <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
            {ad.title}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-stone-500 font-sans tracking-tight">
            คลิกเพื่อชมรายละเอียดเพิ่มเติมและรับคูปองส่วนลด
          </span>
          <span className="text-amber-800 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>ไปที่หน้าเว็บ</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
