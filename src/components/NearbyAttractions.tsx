/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useMapsLibrary, APIProvider } from '@vis.gl/react-google-maps';
import { MapPin, Star, Droplets, Trees, Mountain, ExternalLink, Navigation, Compass, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { CampSite } from '../types';

interface NearbyAttractionsProps {
  camp: CampSite;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyAyHQbzKb6CXvVaVbQB64veUt-khi7AewQ';

const hasValidKey = Boolean(API_KEY) && 
                    API_KEY !== 'YOUR_API_KEY' && 
                    API_KEY !== 'MY_GOOGLE_MAPS_PLATFORM_KEY' && 
                    API_KEY.trim() !== '';

// Haversine distance calculator helper
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

function getLatLng(loc: any) {
  if (!loc) return null;
  if (typeof loc.lat === 'function') {
    return { lat: loc.lat(), lng: loc.lng() };
  }
  if (typeof loc.lat === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

function AttractionsLoader({ camp }: NearbyAttractionsProps) {
  const placesLib = useMapsLibrary('places');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placesLib || !camp.latitude || !camp.longitude) return;

    setLoading(true);
    setError(null);

    // Modern Places API (New) Nearby Search
    placesLib.Place.searchNearby({
      locationRestriction: {
        center: { lat: camp.latitude, lng: camp.longitude },
        radius: 10000, // 10km in meters
      },
      // includedTypes: from table A of Places API
      includedTypes: ['waterfall', 'hiking_area', 'park', 'tourist_attraction'],
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount', 'editorialSummary', 'photos', 'types'],
      maxResultCount: 12,
    })
      .then(({ places }) => {
        // Exclude the campground itself or other commercial/camping listings if possible (keep focus on nature)
        const naturalPlaces = (places || []).filter((p: any) => {
          const name = (typeof p.displayName === 'string' ? p.displayName : p.displayName?.text || '').toLowerCase();
          const types = p.types || [];
          // Skip if it is specifically another camping site name
          if (name.includes('ลานกางเต็นท์') || name.includes('campsite') || name.includes('resort') || name.includes('โฮมสเตย์')) {
            return false;
          }
          return true;
        });

        // Sort by distance from our camp
        naturalPlaces.forEach((p: any) => {
          const loc = getLatLng(p.location);
          p.computedDistance = loc ? calculateDistance(camp.latitude, camp.longitude, loc.lat, loc.lng) : 999;
        });

        naturalPlaces.sort((a: any, b: any) => a.computedDistance - b.computedDistance);

        setPlaces(naturalPlaces);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching nearby places:', err);
        setError('ไม่สามารถดึงข้อมูลสถานที่ท่องเที่ยวใกล้เคียงได้ในขณะนี้');
        setLoading(false);
      });
  }, [placesLib, camp.latitude, camp.longitude]);

  // Photo rendering helper
  const getPlacePhoto = (place: any) => {
    if (place.photos && place.photos.length > 0) {
      try {
        return place.photos[0].getURI({ maxWidth: 400 });
      } catch (err) {
        console.error('Error fetching photo URI', err);
      }
    }
    // Beautiful scenic fallback photos based on place type
    if (place.types && place.types.includes('waterfall')) {
      return 'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?q=80&w=600&auto=format&fit=crop';
    }
    if (place.types && (place.types.includes('hiking_area') || place.types.includes('park'))) {
      return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=600&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop';
  };

  // Category mapping
  const getCategoryTheme = (types: string[]) => {
    const list = types || [];
    if (list.includes('waterfall')) {
      return { text: 'น้ำตก', color: 'bg-cyan-50 text-cyan-800 border-cyan-150', icon: Droplets };
    }
    if (list.includes('hiking_area')) {
      return { text: 'เส้นทางเดินป่า / ไฮกิ้ง', color: 'bg-amber-50 text-amber-800 border-amber-150', icon: Mountain };
    }
    if (list.includes('campground')) {
      return { text: 'จุดชมวิวสำรวจป่า', color: 'bg-emerald-50 text-emerald-800 border-emerald-150', icon: Trees };
    }
    return { text: 'ธรรมชาติสำคัญ', color: 'bg-stone-100 text-stone-805 border-stone-200', icon: Trees };
  };

  if (loading) {
    return (
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-bold text-forest-900 border-l-4 border-forest-600 pl-2 mb-4 flex items-center gap-1.5">
          <Compass className="h-4 w-4 animate-spin text-forest-600" />
          <span>กำลังค้นหาสวนธรรมชาติและน้ำตกใกล้เคียง...</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-sand-100/40 border border-sand-200 rounded-2xl overflow-hidden flex h-28">
              <div className="w-28 bg-sand-200 h-full flex-shrink-0" />
              <div className="p-3 flex-1 space-y-2">
                <div className="h-4 bg-sand-200 rounded w-3/4" />
                <div className="h-3 bg-sand-200 rounded w-1/2" />
                <div className="h-3 bg-sand-200 rounded w-1/4 mt-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-center space-x-2 text-red-700">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span className="text-xs font-medium">{error}</span>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-8 bg-sand-50 rounded-2xl border border-dashed border-sand-300 space-y-2">
        <Trees className="h-8 w-8 text-stone-300 mx-auto" />
        <p className="text-xs text-stone-400 font-mono">ไม่พบสถานที่ท่องเที่ยวทางธรรมชาติที่ปลอดภัยหรือเด่นชัดในระยะ 10 กม.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-forest-900 border-l-4 border-forest-600 pl-2">
          🌳 จุดท่องเที่ยวธรรมชาติใกล้เคียง (รัศมี 10 กม.)
        </h4>
        <span className="text-[10px] bg-forest-100 text-forest-800 px-2 py-0.5 rounded-full font-bold">
          พบ {places.length} แห่ง
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {places.map((place) => {
          const loc = getLatLng(place.location);
          const title = typeof place.displayName === 'string' ? place.displayName : place.displayName?.text || 'สถานที่ธรรมชาติ';
          const distance = place.computedDistance;
          const displayDist = distance < 1 ? `${(distance * 1000).toFixed(0)} เมตร` : `${distance.toFixed(1)} กม.`;
          
          const theme = getCategoryTheme(place.types);
          const CatIcon = theme.icon;

          const mapsUrl = loc 
            ? `https://www.google.com/maps/dir/?api=1&origin=${camp.latitude},${camp.longitude}&destination=${loc.lat},${loc.lng}`
            : '#';

          const summaryText = typeof place.editorialSummary === 'string' 
            ? place.editorialSummary 
            : (place.editorialSummary?.text || null);

          return (
            <motion.div
              key={place.id || title}
              whileHover={{ y: -2 }}
              className="bg-white border border-sand-200 rounded-2xl overflow-hidden flex shadow-xs hover:shadow-md transition-all h-32"
            >
              {/* Photo section */}
              <div className="w-28 relative flex-shrink-0 bg-stone-100">
                <img
                  src={getPlacePhoto(place)}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* info section */}
              <div className="p-3 flex-grow flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${theme.color}`}>
                      <CatIcon className="h-2.5 w-2.5" />
                      {theme.text}
                    </span>
                    <span className="text-[9px] font-bold bg-sand-100 text-sand-800 border border-sand-250 px-1.5 py-0.5 rounded-md">
                      📍 {displayDist}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-stone-900 truncate" title={title}>
                    {title}
                  </h5>

                  {summaryText ? (
                    <p className="text-[10px] text-stone-500 line-clamp-1 leading-normal font-sans">
                      {summaryText}
                    </p>
                  ) : place.formattedAddress ? (
                    <p className="text-[10px] text-stone-400 line-clamp-1 font-mono tracking-tight">
                      {place.formattedAddress}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-sand-100 mt-1">
                  <div className="flex items-center gap-1">
                    {place.rating ? (
                      <div className="flex items-center text-amber-500 text-[10px] font-bold">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="ml-0.5 font-mono text-stone-700">{place.rating.toFixed(1)}</span>
                        {place.userRatingCount && (
                          <span className="text-stone-400 font-normal ml-0.5">({place.userRatingCount})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-mono text-stone-400">ยังไม่มีคะแนน</span>
                    )}
                  </div>

                  {loc && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-700 hover:text-forest-600 bg-forest-50 px-2 py-1 rounded-lg border border-forest-100 transition-colors"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>นำทาง</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function NearbyAttractions({ camp }: NearbyAttractionsProps) {
  if (!hasValidKey) {
    return (
      <div className="bg-sand-100/30 p-5 rounded-2xl border border-sand-200 text-center space-y-3.5 pt-4">
        <Trees className="h-8 w-8 text-forest-705 mx-auto animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-stone-800"> live ค้นหาจุดท่องเที่ยวมุมสูงต้องการ Google Maps API Key</h4>
          <p className="text-[10px] max-w-sm mx-auto text-stone-500 leading-normal">
            เพื่อพรูฟพิกัดและล่องสายหมอกเหนือน้ำในทางภูมิศาสตร์จริง แนะนำเชื่อมต่อ API Key ปลั๊กอินของคุณระบบ Google Maps Platform
          </p>
        </div>
        
        <div className="bg-white p-3 rounded-xl border border-sand-250 text-left text-[10px] leading-relaxed max-w-sm mx-auto shadow-xs text-stone-605">
          <p className="font-bold text-forest-900 border-b border-sand-150 pb-1 mb-1">💡 วิธีตั้งค่าคีย์ด่วนของคุณใน 30 วินาที:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>เปิด <strong>Settings</strong> (⚙️ ไอคอนฟันเฟืองมุมขวาบน)</li>
            <li>เลือกเมนู <strong>Secrets</strong></li>
            <li>ตั้งชื่อ <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>วางคีย์ที่ได้จาก Google Cloud แล้วกดคีย์บันทึก</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly" libraries={['places']}>
      <AttractionsLoader camp={camp} />
    </APIProvider>
  );
}
