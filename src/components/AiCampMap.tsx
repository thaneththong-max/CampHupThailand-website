/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, AlertTriangle, Compass, Star, Check, Copy } from 'lucide-react';
import { CampSite } from '../types';

interface AiCampMapProps {
  camp: CampSite;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const isDemoOrEmptyKey = 
  !API_KEY || 
  !API_KEY.startsWith('AIzaSy') ||
  API_KEY === 'YOUR_API_KEY' || 
  API_KEY === 'MY_GOOGLE_MAPS_PLATFORM_KEY' || 
  API_KEY === 'AIzaSyAyHQbzKb6CXvVaVbQB64veUt-khi7AewQ' ||
  API_KEY.trim() === '';

export default function AiCampMap({ camp }: AiCampMapProps) {
  const [copied, setCopied] = useState(false);
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);

  const mapCenter = { lat: camp.latitude, lng: camp.longitude };
  const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${camp.latitude},${camp.longitude}`;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${camp.latitude}, ${camp.longitude}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  // Elegant mock static-visual layout for users who don't have configured keys yet
  if (isDemoOrEmptyKey) {
    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Warning Indicator */}
        <div className="bg-amber-500/10 border border-amber-200/50 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5 text-amber-900 leading-relaxed">
            <p className="font-bold">⚠️ ต้องการรหัสแผนที่ Google Maps API Key</p>
            <p className="text-stone-600">
              แผนที่แบบโต้ตอบต้องการคีย์จริงตั้งค่าในระบบ โปรดเปิดไฟล์ <code>.env.example</code> หรือกล่องคีย์ในการตั้งค่า แล้วระบุคีย์ตัวแปร <code>GOOGLE_MAPS_PLATFORM_KEY</code> เพื่อเปิดใช้งานแผนที่โต้ตอบ 3D
            </p>
          </div>
        </div>

        {/* High-fidelity Visual Representation of Map */}
        <div className="relative h-64 rounded-3xl overflow-hidden border-2 border-sand-200 bg-sand-50 group shadow-inner">
          {/* Subtle Grid Art background simulating Map lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e0d8_1px,transparent_1px),linear-gradient(to_bottom,#e5e0d8_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
          
          {/* Visual Earthy Circles simulating forests/parks */}
          <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full bg-emerald-100/60 blur-md pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-emerald-100/40 blur-md pointer-events-none" />
          
          {/* Animated Target Marker Pointer */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="relative">
              {/* Radial pulse waves */}
              <span className="absolute -top-1 -left-1 flex h-10 w-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-40"></span>
                <span className="relative inline-flex rounded-full h-10 w-10 bg-amber-400 opacity-20"></span>
              </span>
              <div className="bg-gradient-to-tr from-forest-800 to-emerald-600 p-2.5 rounded-2xl text-white shadow-md relative z-10">
                <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>
            
            <div className="mt-3.5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-sand-200 text-center max-w-[85%]">
              <h5 className="text-[11.5px] font-extrabold text-stone-900 leading-tight">
                {camp.name}
              </h5>
              <p className="text-[10px] text-stone-500 mt-0.5">
                พิกัด: {camp.latitude.toFixed(4)}, {camp.longitude.toFixed(4)} ({camp.province})
              </p>
            </div>
          </div>

          {/* Location Badge */}
          <div className="absolute bottom-3 left-3 bg-forest-900/90 backdrop-blur-xs text-white text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-lg">
            📍 โหมดภาพจำลองพิกัด
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyCoordinates}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-sand-50 text-stone-700 font-bold text-[11px] py-2.5 px-3 rounded-xl border border-sand-300 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>คัดลอกพิกัดแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>คัดลอกค่าพิกัดละติจูด</span>
              </>
            )}
          </button>
          
          <a
            href={directionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-forest-800 to-forest-700 hover:from-forest-750 hover:to-forest-650 text-white font-bold text-[11px] py-2.5 px-3 rounded-xl border border-forest-900 shadow-3xs transition-colors cursor-pointer text-center"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>เปิดนำทางใน Google Maps</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Dynamic Map container */}
      <div className="relative h-64 rounded-3xl overflow-hidden border-2 border-sand-200 bg-sand-50 shadow-inner">
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={14}
            mapId="map_planner_rec_style"
            gestureHandling="cooperative"
            disableDefaultUI={false}
          >
            <AdvancedMarker 
              position={mapCenter}
              onClick={() => setInfoWindowOpen(true)}
            >
              <Pin 
                background={'#1e5128'} 
                glyphColor={'#ffffff'} 
                borderColor={'#123018'} 
                scale={1.2}
              />
            </AdvancedMarker>

            {infoWindowOpen && (
              <InfoWindow
                position={mapCenter}
                onCloseClick={() => setInfoWindowOpen(false)}
              >
                <div className="p-1 max-w-[180px] font-sans">
                  <h6 className="font-extrabold text-[12px] text-stone-900 leading-snug">
                    {camp.name}
                  </h6>
                  <p className="text-[10px] text-stone-500 mt-1">
                    📍 {camp.province}
                  </p>
                  <p className="text-[9px] font-semibold text-emerald-800 mt-0.5">
                    ระดับความสูง {camp.elevation || 'ไม่ระบุ'}
                  </p>
                  <a
                    href={directionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-800 hover:text-forest-900 underline mt-2"
                  >
                    <span>ขอเส้นทางขับรถ</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Helper coordinates panel */}
      <div className="bg-sand-50 p-3 rounded-2xl border border-sand-250 flex items-center justify-between text-xs text-stone-600 font-sans">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-forest-800" />
          <div>
            <span className="block font-bold text-stone-800">พิกัดภูมิศาสตร์ตรงแคมป์</span>
            <span className="font-mono text-[10px] text-stone-500">
              {camp.latitude.toFixed(6)}, {camp.longitude.toFixed(6)}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={copyCoordinates}
            className="p-2 bg-white hover:bg-sand-100 text-stone-700 rounded-xl border border-sand-300 transition-colors cursor-pointer"
            title="คัดลอกพิกัด GPS"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          
          <a
            href={directionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl border border-forest-950 transition-colors flex items-center justify-center"
            title="เปิดด้วยแอปภายนอก"
          >
            <Navigation className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
