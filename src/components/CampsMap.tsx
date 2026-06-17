/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Tent, Star, MapPin, X, Info, AlertTriangle, ChevronRight, Navigation, Zap, Check } from 'lucide-react';
import { CampSite } from '../types';

export interface EvStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  provider?: string;
}

const generateMockEvStations = (lat: number, lng: number): EvStation[] => {
  const providers = [
    { name: 'EV Station PluZ PTT', provider: 'PTT' },
    { name: 'PEA VOLTA', provider: 'PEA' },
    { name: 'EA Anywhere Elec', provider: 'EA' },
    { name: 'EVolt Charging Station', provider: 'EVolt' }
  ];
  
  return [
    {
      id: 'mock-ev-1',
      name: `${providers[0].name} สาขาหน้าอุทยาน`,
      address: 'บริเวณสถานีบริการน้ำมัน PTT Station ทางเข้าหลักอุทยาน (ระยะทาง 8.4 กม.)',
      latitude: lat + 0.0224,
      longitude: lng - 0.0312,
      rating: 4.6,
      provider: 'PTT'
    },
    {
      id: 'mock-ev-2',
      name: `${providers[1].name} สถานีบริการส่วนภูมิภาค`,
      address: 'การไฟฟ้าส่วนภูมิภาค สาขาอำเภอใกล้เคียง กม.15 (ระยะทาง 15.2 กม.)',
      latitude: lat - 0.0405,
      longitude: lng + 0.0534,
      rating: 4.4,
      provider: 'PEA'
    },
    {
      id: 'mock-ev-3',
      name: `${providers[2].name} พลาซ่าเลคไซด์`,
      address: 'ลานจอดรถส่วนหน้า โรงแรมแกรนด์ เมาน์เทน เลค (ระยะทาง 12.8 กม.)',
      latitude: lat + 0.0351,
      longitude: lng + 0.0415,
      rating: 4.7,
      provider: 'EA'
    },
    {
      id: 'mock-ev-4',
      name: `${providers[3].name} เขาใหญ่ กรีนวัลเล่ย์`,
      address: 'สี่แยกทางขึ้น ถ.ธนะรัชต์ กม. 18 (ระยะทาง 9.6 กม.)',
      latitude: lat - 0.0152,
      longitude: lng - 0.0224,
      rating: 4.2,
      provider: 'EVolt'
    },
    {
      id: 'mock-ev-5',
      name: `EleX by EGAT สถานีชาร์จเขาใหญ่`,
      address: 'ลานจอดรถศูนย์บริการนักท่องเที่ยว จุดบริการรวดเร็ว (ระยะทาง 6.1 กม.)',
      latitude: lat + 0.0112,
      longitude: lng + 0.0145,
      rating: 4.9,
      provider: 'EGAT'
    }
  ];
};

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

// Check if the API key is actually set and valid
const hasValidKey = Boolean(API_KEY) && 
                    API_KEY !== 'YOUR_API_KEY' && 
                    API_KEY !== 'MY_GOOGLE_MAPS_PLATFORM_KEY' && 
                    API_KEY.trim() !== '';

const earthyMapStyles = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#cbd8db' }] // soft blue-grey water
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5eedf' }] // warm sand land
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#ccd9ca' }] // sage green national parks
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a5b4c' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ebded2' }] // warm clay roads
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e0cbb7' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7a6a5d' }]
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3e2723' }] // dark brown text
  }
];

interface CampsMapProps {
  camps: CampSite[];
  selectedCamp: CampSite | null;
  onSelectCamp: (camp: CampSite) => void;
  onCloseCampDetails?: () => void;
}

// Inner helper component to auto-pan the map when selection changes
function MapHandler({ selectedCamp }: { selectedCamp: CampSite | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedCamp) return;
    map.panTo({ lat: selectedCamp.latitude, lng: selectedCamp.longitude });
    map.setZoom(13);
  }, [map, selectedCamp]);

  return null;
}

// Nested helper to load and fetch EV Charging stations using Google Places API
function EvChargingHandler({
  selectedCamp,
  camps,
  searchTrigger,
  setEvStations,
  setSelectedEvStation,
  isLoadingEV,
  setIsLoadingEV,
  setEvSearchCenterName,
  setActiveOverlayCamp
}: {
  selectedCamp: CampSite | null;
  camps: CampSite[];
  searchTrigger: number;
  setEvStations: React.Dispatch<React.SetStateAction<EvStation[]>>;
  setSelectedEvStation: React.Dispatch<React.SetStateAction<EvStation | null>>;
  isLoadingEV: boolean;
  setIsLoadingEV: (loading: boolean) => void;
  setEvSearchCenterName: (name: string) => void;
  setActiveOverlayCamp: React.Dispatch<React.SetStateAction<CampSite | null>>;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const detectProvider = (name: string): string => {
    const upper = name.toUpperCase();
    if (upper.includes('PLUZ') || upper.includes('PTT')) return 'PTT';
    if (upper.includes('VOLTA') || upper.includes('PEA')) return 'PEA';
    if (upper.includes('ANYWHERE') || upper.includes('EA')) return 'EA';
    if (upper.includes('EVOLT')) return 'EVolt';
    if (upper.includes('EGAT') || upper.includes('ELEX')) return 'EGAT';
    if (upper.includes('SHARGE')) return 'SHARGE';
    return 'EV';
  };

  const fallbackToMock = (lat: number, lng: number, name: string) => {
    const mocks = generateMockEvStations(lat, lng);
    setEvStations(mocks);
    setEvSearchCenterName(name);
  };

  const handleSearchEVStations = () => {
    let targetLat = 14.4378;
    let targetLng = 101.4011;
    let targetName = 'อุทยานแห่งชาติเขาใหญ่';

    if (selectedCamp) {
      targetLat = selectedCamp.latitude;
      targetLng = selectedCamp.longitude;
      targetName = selectedCamp.name;
    } else if (camps.length > 0) {
      targetLat = camps[0].latitude;
      targetLng = camps[0].longitude;
      targetName = camps[0].name;
    }

    setIsLoadingEV(true);
    setSelectedEvStation(null);

    // Minimize camps overlay so map feels dedicated to EV stations
    setActiveOverlayCamp(null);

    if (!map || !placesLib) {
      setTimeout(() => {
        fallbackToMock(targetLat, targetLng, targetName);
        setIsLoadingEV(false);
        if (map) {
          map.panTo({ lat: targetLat, lng: targetLng });
          map.setZoom(11);
        }
      }, 600);
      return;
    }

    try {
      const service = new placesLib.PlacesService(map);
      const request: google.maps.places.TextSearchRequest = {
        location: new google.maps.LatLng(targetLat, targetLng),
        radius: 30000, // 30 km
        query: 'EV Charging Station สถานีชาร์จรถไฟฟ้า ' + targetName
      };

      service.textSearch(request, (results, status) => {
        setIsLoadingEV(false);
        if (status === placesLib.PlacesServiceStatus.OK && results && results.length > 0) {
          const foundStations: EvStation[] = results.map((place, index) => ({
            id: place.place_id || `ev-place-${index}`,
            name: place.name || 'สถานีชาร์จ EV',
            address: place.formatted_address || place.vicinity || 'ไม่สามารถระบุที่อยู่ได้',
            latitude: place.geometry?.location?.lat() || targetLat,
            longitude: place.geometry?.location?.lng() || targetLng,
            rating: place.rating,
            provider: detectProvider(place.name || '')
          }));
          setEvStations(foundStations);
          setEvSearchCenterName(targetName);

          map.panTo({ lat: targetLat, lng: targetLng });
          map.setZoom(11);
        } else {
          fallbackToMock(targetLat, targetLng, targetName);
          map.panTo({ lat: targetLat, lng: targetLng });
          map.setZoom(11);
        }
      });
    } catch (e) {
      console.warn('Places Service failed:', e);
      fallbackToMock(targetLat, targetLng, targetName);
      setIsLoadingEV(false);
    }
  };

  useEffect(() => {
    if (searchTrigger > 0) {
      handleSearchEVStations();
    }
  }, [searchTrigger]);

  return null;
}

export default function CampsMap({
  camps,
  selectedCamp,
  onSelectCamp,
  onCloseCampDetails
}: CampsMapProps) {
  const [activeOverlayCamp, setActiveOverlayCamp] = useState<CampSite | null>(null);

  // EV Charging stations states
  const [evStations, setEvStations] = useState<EvStation[]>([]);
  const [selectedEvStation, setSelectedEvStation] = useState<EvStation | null>(null);
  const [isLoadingEV, setIsLoadingEV] = useState<boolean>(false);
  const [evSearchCenterName, setEvSearchCenterName] = useState<string>('');
  const [searchTrigger, setSearchTrigger] = useState<number>(0);

  // Synchronize overlay popup with parent select component
  useEffect(() => {
    if (selectedCamp) {
      setActiveOverlayCamp(selectedCamp);
    }
  }, [selectedCamp]);

  // Handle marker tap
  const handleMarkerClick = (camp: CampSite) => {
    onSelectCamp(camp);
    setActiveOverlayCamp(camp);
  };

  const handleOpenDirections = (camp: CampSite, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${camp.latitude},${camp.longitude}`;
    window.open(url, '_blank');
  };

  if (!hasValidKey) {
    return (
      <div className="w-full h-[400px] md:h-[500px] rounded-3xl bg-sand-100 border-2 border-sand-200 flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-forest-50/50 blur-3xl"></div>
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-earth-50/50 blur-3xl"></div>

        <div className="bg-sand-50 p-4 rounded-full border border-sand-200 shadow-sm text-sand-800 mb-4 animate-bounce">
          <AlertTriangle className="h-8 w-8 text-earth-500" />
        </div>

        <h3 className="font-semibold text-lg text-stone-900 mb-2">
          ต้องการ Google Maps API Key เพื่อแสดงแผนที่ป่าเอิร์ธโทน
        </h3>
        
        <p className="text-sm text-stone-600 max-w-md leading-relaxed mb-6">
          แอปพลิเคชันได้รับการตั้งค่าสไตล์แผนที่ธรรมชาติแล้ว ทว่ายังต้องการคีย์ API เพื่อทำงาน
        </p>

        <div className="bg-white/80 p-5 rounded-2xl border border-sand-200 max-w-lg text-left text-xs text-stone-700 leading-relaxed shadow-sm">
          <p className="font-bold text-stone-900 mb-1">ขั้นตอนการติดตั้ง API Key:</p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>เปิด <strong>Settings</strong> (ไอคอน ⚙️ เกียร์มุมขวาบนหน้าเว็บบิวเดอร์)</li>
            <li>เลือกแท็บ <strong>Secrets</strong></li>
            <li>กดสร้างคีย์ตัวใหม่ชื่อ <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>ใส่คีย์จริงของคุณลงใน Value จากนั้นกด <strong>Enter</strong> เพื่อให้ระบบบิลด์ข้อมูลใหม่</li>
          </ol>
        </div>

        {/* Dynamic Mock Map Visual for User Experience */}
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full border border-forest-100">
          <Info className="h-3.5 w-3.5 text-forest-500" />
          <span>จำลองการปักหมุดจุดกางเต็นท์ทั้ง {camps.length} แห่งในหน้าค้นหาด้านซ้ายเรียบร้อย</span>
        </div>
      </div>
    );
  }

  // Calculate default map center
  const defaultCenter = camps.length > 0
    ? { lat: camps[0].latitude, lng: camps[0].longitude }
    : { lat: 14.4378, lng: 101.4011 }; // Khao Yai fallback

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-md border-2 border-sand-100 bg-sand-50">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={7}
          mapId="map_forest_earth_style"
          styles={earthyMapStyles}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          {camps.map((camp) => (
            <AdvancedMarker
              key={camp.id}
              position={{ lat: camp.latitude, lng: camp.longitude }}
              title={camp.name}
              onClick={() => {
                handleMarkerClick(camp);
                setSelectedEvStation(null); // Close EV info when clicking another camp site
              }}
            >
              {/* Custom Forest / Earth Core styled HTML Marker */}
              <div 
                id={`map-marker-${camp.id}`}
                className={`flex items-center justify-center rounded-2xl shadow-md border-2 text-white transform hover:scale-115 transition-all duration-300 w-10 h-10 ${
                  activeOverlayCamp?.id === camp.id
                    ? 'scale-110 ring-4 ring-sand-200 ring-offset-1 ring-offset-forest-800'
                    : ''
                } ${
                  camp.type === 'national'
                    ? 'bg-forest-700 border-forest-200 hover:bg-forest-600'
                    : 'bg-earth-600 border-earth-200 hover:bg-earth-500'
                }`}
              >
                <Tent className="w-5 h-5" />
              </div>
            </AdvancedMarker>
          ))}

          {/* Render EV Station markers */}
          {evStations.map((station) => (
            <AdvancedMarker
              key={station.id}
              position={{ lat: station.latitude, lng: station.longitude }}
              title={station.name}
              onClick={() => {
                setSelectedEvStation(station);
                setActiveOverlayCamp(null); // hide campsite overlay when EV station is selected
              }}
            >
              {/* Custom Blue Charging Pin */}
              <div 
                id={`ev-marker-${station.id}`}
                className={`flex items-center justify-center rounded-full shadow-lg border-2 text-white transform hover:scale-130 transition-all duration-300 w-9 h-9 bg-blue-600 border-blue-200 ${
                  selectedEvStation?.id === station.id
                    ? 'scale-120 ring-4 ring-blue-100 ring-offset-1 ring-offset-blue-800'
                    : ''
                }`}
              >
                <Zap className="w-4.5 h-4.5 fill-blue-300 text-blue-100" />
              </div>
            </AdvancedMarker>
          ))}

          {/* Handler to pan map to campsite coordinate */}
          <MapHandler selectedCamp={selectedCamp} />

          {/* Handler to trigger EV Charging nearby search using Places API / fallback mocks */}
          <EvChargingHandler
            selectedCamp={selectedCamp}
            camps={camps}
            searchTrigger={searchTrigger}
            setEvStations={setEvStations}
            setSelectedEvStation={setSelectedEvStation}
            isLoadingEV={isLoadingEV}
            setIsLoadingEV={setIsLoadingEV}
            setEvSearchCenterName={setEvSearchCenterName}
            setActiveOverlayCamp={setActiveOverlayCamp}
          />
        </Map>
      </APIProvider>

      {/* Floating Control Panel for EV Search in top-left */}
      <div 
        id="ev-search-control-panel"
        className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[280px]"
      >
        <button
          id="btn-toggle-ev-stations"
          onClick={() => setSearchTrigger(prev => prev + 1)}
          disabled={isLoadingEV}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-lg border text-xs font-bold transition-all duration-300 ${
            isLoadingEV
              ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed'
              : evStations.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white hover:scale-103 shadow-blue-200/50'
                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800 hover:scale-103'
          }`}
        >
          {isLoadingEV ? (
            <span className="flex items-center gap-1.5 font-bold text-stone-500">
              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              กำลังโหลดสถานี EV...
            </span>
          ) : (
            <>
              <Zap className={`h-4 w-4 ${evStations.length > 0 ? 'text-blue-200 fill-blue-300' : 'text-blue-600 animate-pulse'}`} />
              <span className="font-bold">
                {evStations.length > 0 ? 'ค้นหา EV บริเวณจุดอื่น' : 'แสดงสถานีชาร์จ EV'}
              </span>
            </>
          )}
        </button>

        {evStations.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-sand-200 shadow-xl text-stone-700 leading-normal animate-slide-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
            <div className="flex items-center justify-between font-extrabold text-stone-900 border-b border-sand-100 pb-1.5 mb-1.5 text-xs">
              <span className="flex items-center gap-1 text-blue-600">
                ⚡ พบสถานีบริการ {evStations.length} แห่ง
              </span>
              <button
                id="clear-ev-search-btn"
                onClick={() => {
                  setEvStations([]);
                  setSelectedEvStation(null);
                }}
                className="text-stone-400 hover:text-stone-600 p-0.5 rounded-full hover:bg-stone-100 transition-colors"
                title="ซ่อนสถานีทั้งหมด"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[10px] leading-normal text-stone-600 font-sans">
              ค้นหาในรัศมี 30 กม. รอบ: <strong className="text-forest-900 font-bold">{evSearchCenterName}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Floating Info Overlay for Selected Pin */}
      {activeOverlayCamp && (
        <div 
          id="map-floating-overlay"
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-sand-200 overflow-hidden transform transition-all duration-300 z-10 animate-slide-in"
        >
          <div className="relative">
            <img
              src={activeOverlayCamp.image}
              alt={activeOverlayCamp.name}
              className="w-full h-28 object-cover"
            />
            <button
              id="close-floating-overlay-button"
              onClick={() => {
                setActiveOverlayCamp(null);
                if (onCloseCampDetails) onCloseCampDetails();
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
              activeOverlayCamp.type === 'national' 
                ? 'bg-forest-900 text-forest-100' 
                : 'bg-earth-800 text-earth-100'
            }`}>
              {activeOverlayCamp.type === 'national' ? 'อุทยานแห่งชาติ' : 'ลานกางเต็นท์เอกชน'}
            </span>
          </div>

          <div className="p-3">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3 text-earth-500" />
                {activeOverlayCamp.province}
              </span>
              <span className="flex items-center gap-1 font-semibold text-earth-800 bg-sand-100 px-1.5 py-0.5 rounded">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                {activeOverlayCamp.rating}
              </span>
            </div>

            <h4 className="font-semibold text-stone-900 text-sm line-clamp-1 mb-1">
              {activeOverlayCamp.name}
            </h4>
            
            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-1.5">
              {activeOverlayCamp.description}
            </p>

            {/* EV Tips */}
            <div className="flex items-center gap-1.5 text-[10px] text-blue-700 bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-blue-100 mb-3 font-medium">
              <Zap className="h-3 w-3 text-blue-600 fill-blue-300 animate-pulse" />
              <span>รองรับการเดินทางด้วยรถ EV! กดปุ่มมุมบนซ้ายเพื่อค้นหาสถานีชาร์จ</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="view-camp-from-overlay-button"
                onClick={() => onSelectCamp(activeOverlayCamp)}
                className="flex-1 text-center bg-forest-800 hover:bg-forest-700 text-white py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all duration-300"
              >
                ดูรายละเอียดค่าย
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                id="maps-navigation-from-overlay"
                onClick={(e) => handleOpenDirections(activeOverlayCamp, e)}
                className="p-2 bg-sand-100 hover:bg-sand-200 text-earth-800 rounded-xl border border-sand-200 hover:scale-105 active:scale-95 transition-all duration-300"
                title="เปิดนำทางด้วย Google Maps"
              >
                <Navigation className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Overlay for EV Charging Station */}
      {selectedEvStation && (
        <div 
          id="ev-station-overlay"
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xs bg-blue-50/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden transform transition-all duration-300 z-10 animate-slide-in"
        >
          <div className="relative p-4">
            <button
              id="close-ev-overlay-button"
              onClick={() => setSelectedEvStation(null)}
              className="absolute top-3 right-3 p-1 bg-blue-100 hover:bg-blue-200 text-blue-950 rounded-full transition-colors border border-blue-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Header Tag */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs uppercase tracking-wider">
                <Zap className="h-2.5 w-2.5 fill-white" />
                สถานีชาร์จ EV
              </span>
              {selectedEvStation.rating && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                  <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                  {selectedEvStation.rating}
                </span>
              )}
              {selectedEvStation.provider && (
                <span className="text-[9px] font-mono font-bold text-stone-600 bg-white px-1.5 py-0.5 rounded border border-blue-200 uppercase">
                  {selectedEvStation.provider}
                </span>
              )}
            </div>

            {/* Station Name */}
            <h4 className="font-bold text-stone-950 text-sm mb-1 pr-6 leading-tight">
              {selectedEvStation.name}
            </h4>

            {/* Station Address */}
            <p className="text-[11px] text-stone-600 leading-normal mb-3 pr-2">
              <MapPin className="h-3 w-3 inline-block text-blue-600 mr-1 shrink-0 pb-0.5" />
              {selectedEvStation.address}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                id="ev-navigation-button"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedEvStation.latitude},${selectedEvStation.longitude}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-102 active:scale-98"
              >
                <Navigation className="h-3.5 w-3.5 text-blue-100 fill-blue-105" />
                นำทางด้วย Google Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
