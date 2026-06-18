/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Tent, Star, MapPin, X, Info, AlertTriangle, ChevronRight, Navigation, Zap, Check, Sparkles } from 'lucide-react';
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

const NATIONWIDE_EV_STATIONS: EvStation[] = [
  // --- กรุงเทพฯ และปริมณฑล ---
  {
    id: 'th-ev-ptt-vibhavadi',
    name: 'EV Station PluZ PTT - วิภาวดีรังสิต (กรุงเทพฯ)',
    address: 'สถานีบริการน้ำมัน PTT Station ถ.วิภาวดีรังสิต แขวงสามเสนใน เขตพญาไท',
    latitude: 13.7844,
    longitude: 100.5611,
    rating: 4.8,
    provider: 'PTT'
  },
  {
    id: 'th-ev-pea-headquarters',
    name: 'PEA VOLTA - สำนักงานใหญ่การไฟฟ้าส่วนภูมิภาค (กรุงเทพฯ)',
    address: 'ถ.งามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร',
    latitude: 13.8471,
    longitude: 100.5552,
    rating: 4.7,
    provider: 'PEA'
  },
  {
    id: 'th-ev-ea-paragon',
    name: 'EA Anywhere - สยามพารากอน ชั้น B1',
    address: 'ศูนย์การค้าสยามพารากอน ถ.พระรามที่ 1 เขตปทุมวัน กรุงเทพมหานคร',
    latitude: 13.7461,
    longitude: 100.5348,
    rating: 4.6,
    provider: 'EA'
  },
  {
    id: 'th-ev-evolt-centralworld',
    name: 'EVolt - เซ็นทรัลเวิลด์ อาคารจอดรถชั้น 2',
    address: 'ถ.ราชดำริ แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร',
    latitude: 13.7469,
    longitude: 100.5393,
    rating: 4.5,
    provider: 'EVolt'
  },
  {
    id: 'th-ev-egat-headquarters',
    name: 'EleX by EGAT - สำนักงานกลาง กฟผ. บางกรวย',
    address: 'ถ.จรัญสนิทวงศ์ ต.บางกรวย อ.บางกรวย นนทบุรี',
    latitude: 13.8052,
    longitude: 100.4912,
    rating: 4.9,
    provider: 'EGAT'
  },
  {
    id: 'th-ev-sharge-chidlom',
    name: 'SHARGE - ห้างสรรพสินค้าเซ็นทรัลชิดลม',
    address: 'ถ.เพลินจิต แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร',
    latitude: 13.7445,
    longitude: 100.5444,
    rating: 4.4,
    provider: 'SHARGE'
  },
  {
    id: 'th-ev-tesla-iconsiam',
    name: 'Tesla Supercharger - ไอคอนสยาม ชั้น B1',
    address: 'ถ.เจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพมหานคร',
    latitude: 13.7268,
    longitude: 100.5111,
    rating: 4.9,
    provider: 'Tesla'
  },
  {
    id: 'th-ev-altervim-rama4',
    name: 'AlterVim - โลตัส พระราม 4',
    address: 'ถ.พระรามที่ 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    latitude: 13.7198,
    longitude: 100.5668,
    rating: 4.5,
    provider: 'AlterVim'
  },

  // --- ภาคเหนือ (ทางสู่ป่า ภูเขา ดอย และทางท่องเที่ยว) ---
  {
    id: 'th-ev-pea-doisaket',
    name: 'PEA VOLTA - ดอยสะเก็ด (เชียงใหม่)',
    address: 'ต.เชิงดอย อ.ดอยสะเก็ด เชียงใหม่ (พิกัดปักหมุดยอดนิยมขึ้นฮอดและพายพาย)',
    latitude: 18.8712,
    longitude: 99.1354,
    rating: 4.7,
    provider: 'PEA'
  },
  {
    id: 'th-ev-ptt-hangdong',
    name: 'EV Station PluZ PTT - หางดง (เชียงใหม่)',
    address: 'PTT Station ถ.เชียงใหม่-ฮอด ต.หางดง อ.หางดง เชียงใหม่',
    latitude: 18.7302,
    longitude: 98.9482,
    rating: 4.6,
    provider: 'PTT'
  },
  {
    id: 'th-ev-egat-bhumibol',
    name: 'EleX by EGAT - เขื่อนภูมิพล (ตาก)',
    address: 'บริเวณลานจอดรถส่วนหน้าเขื่อนภูมิพล อ.สามเงา ตาก (ใกล้จุดกางเต็นท์เขื่อน)',
    latitude: 17.2422,
    longitude: 98.9712,
    rating: 4.9,
    provider: 'EGAT'
  },
  {
    id: 'th-ev-evolt-chiangrai',
    name: 'EVolt - เซ็นทรัล เชียงราย ชั้น G',
    address: 'ถ.พหลโยธิน ต.รอบเวียง อ.เมืองเชียงราย เชียงราย',
    latitude: 19.8974,
    longitude: 99.8322,
    rating: 4.6,
    provider: 'EVolt'
  },
  {
    id: 'th-ev-ea-nakonsawan',
    name: 'EA Anywhere - ตลาดศรีนคร นครสวรรค์',
    address: 'ถ.พหลโยธิน ต.ปากน้ำโพ อ.เมืองนครสวรรค์ นครสวรรค์',
    latitude: 15.7112,
    longitude: 100.1254,
    rating: 4.4,
    provider: 'EA'
  },
  {
    id: 'th-ev-sharge-phitsanulok',
    name: 'REVER SHARGE - ปั๊มเชลล์ พิษณุโลก',
    address: 'ถ.เลี่ยงเมืองพิษณุโลก ต.สมอแข อ.เมืองพิษณุโลก พิษณุโลก',
    latitude: 16.8222,
    longitude: 100.2654,
    rating: 4.5,
    provider: 'SHARGE'
  },

  // --- ภาคตะวันออกเฉียงเหนือ (Isan) ---
  {
    id: 'th-ev-ptt-pakchong',
    name: 'EV Station PluZ PTT - มิตรภาพปากช่อง (นครราชสีมา)',
    address: 'PTT Station ถ.มิตรภาพ ต.ปากช่อง อ.ปากช่อง นครราชสีมา (ปากทางขึ้นด่านเขาใหญ่)',
    latitude: 14.6982,
    longitude: 101.4112,
    rating: 4.8,
    provider: 'PTT'
  },
  {
    id: 'th-ev-pea-prasat',
    name: 'PEA VOLTA - ปราสาท (สุรินทร์)',
    address: 'หน้าเทสโก้ โลตัส สาขาปราสาท ถ.โชคชัย-เดชอุดม ต.กังแอน อ.ปราสาท สุรินทร์',
    latitude: 14.6222,
    longitude: 103.4124,
    rating: 4.6,
    provider: 'PEA'
  },
  {
    id: 'th-ev-egat-lamtakhong',
    name: 'EleX by EGAT - ศูนย์ทดสอบโรงไฟฟ้าลำตะคองลำตะคอง',
    address: 'โรงไฟฟ้าลำตะคองชลภาวัฒนา ต.คลองไผ่ อ.สีคิ้ว นครราชสีมา',
    latitude: 14.8622,
    longitude: 101.5224,
    rating: 4.9,
    provider: 'EGAT'
  },
  {
    id: 'th-ev-ea-khonkaen',
    name: 'EA Anywhere - เซ็นทรัล ขอนแก่น',
    address: 'ถ.ศรีจันทร์ ต.ในเมือง อ.เมืองขอนแก่น ขอนแก่น',
    latitude: 16.4322,
    longitude: 102.8254,
    rating: 4.7,
    provider: 'EA'
  },
  {
    id: 'th-ev-evolt-udon',
    name: 'EVolt - เซ็นทรัล อุดรธานี ชั้นใต้ดิน',
    address: 'ถ.ประจักษ์ศิลปาคม ต.หมากแข้ง อ.เมืองอุดรธานี อุดรธานี',
    latitude: 17.4084,
    longitude: 102.7952,
    rating: 4.5,
    provider: 'EVolt'
  },
  {
    id: 'th-ev-altervim-buriram',
    name: 'AlterVim - บิ๊กซี บุรีรัมย์',
    address: 'ถ.เลี่ยงเมืองบุรีรัมย์ ต.อิสาณ อ.เมืองบุรีรัมย์ บุรีรัมย์',
    latitude: 15.0022,
    longitude: 103.1112,
    rating: 4.6,
    provider: 'AlterVim'
  },

  // --- ภาคตะวันตก (กาญจนบุรี แหล่งแคมป์ปิ้งยอดฮิต) ---
  {
    id: 'th-ev-pea-saiyok',
    name: 'PEA VOLTA - ไทรโยค (กาญจนบุรี)',
    address: 'บริเวณหน้าสหกรณ์การเกษตรไทรโยค ต.ลุ่มสุ่ม อ.ไทรโยค กาญจนบุรี (ใกล้อุทยานไทรโยค)',
    latitude: 14.1222,
    longitude: 99.1354,
    rating: 4.7,
    provider: 'PEA'
  },
  {
    id: 'th-ev-ptt-kanchanaburi',
    name: 'EV Station PluZ PTT - เลี่ยงเมืองกาญจนบุรี',
    address: 'PTT Station ถ.เลี่ยงเมืองกาญจนบุรี ต.ปากแพรก อ.เมืองกาญจนบุรี กาญจนบุรี',
    latitude: 14.0322,
    longitude: 99.5254,
    rating: 4.6,
    provider: 'PTT'
  },
  {
    id: 'th-ev-egat-srinagarind',
    name: 'EleX by EGAT - เขื่อนศรีนครินทร์ (กาญจนบุรี)',
    address: 'ลานจอดรถส่วนในติดศูนย์ลานกางเต็นท์เขื่อนศรีนครินทร์ ต.ท่ากระดาน อ.ศรีสวัสดิ์ กาญจนบุรี',
    latitude: 14.4022,
    longitude: 99.1124,
    rating: 4.9,
    provider: 'EGAT'
  },
  {
    id: 'th-ev-ea-phetchaburi',
    name: 'EA Anywhere - เพชรบุรี เขาวัง',
    address: 'ถ.คีรีรัฐยา ต.คลองกระแชง อ.เมืองเพชรบุรี เพชรบุรี',
    latitude: 13.1112,
    longitude: 99.9454,
    rating: 4.5,
    provider: 'EA'
  },

  // --- ภาคตะวันออก ---
  {
    id: 'th-ev-ptt-saensuk',
    name: 'EV Station PluZ PTT - สาขาแสนสุข บางแสน (ชลบุรี)',
    address: 'ถ.ลงหาดบางแสน ต.แสนสุข อ.เมืองชลบุรี ชลบุรี',
    latitude: 13.2922,
    longitude: 100.9254,
    rating: 4.7,
    provider: 'PTT'
  },
  {
    id: 'th-ev-pea-sriracha',
    name: 'PEA VOLTA - สหพัฒน์ศรีราชา (ชลบุรี)',
    address: 'นิคมอุตสาหกรรมปิ่นทอง ถ.เก้ากิโล ต.สุรศักดิ์ อ.ศรีราชา ชลบุรี',
    latitude: 13.0822,
    longitude: 100.9654,
    rating: 4.5,
    provider: 'PEA'
  },
  {
    id: 'th-ev-ptt-klaeng',
    name: 'EV Station PluZ PTT - เลี่ยงเมืองแกลง (ระยอง)',
    address: 'PTT Station ถ.สุขุมวิท ต.ทางเกวียน อ.แกลง ระยอง',
    latitude: 12.7822,
    longitude: 101.6542,
    rating: 4.7,
    provider: 'PTT'
  },
  {
    id: 'th-ev-sharge-pattaya',
    name: 'SHARGE - พัทยา อเวนิว แฟลชชาร์จ',
    address: 'ศูนย์การค้าพัทยา อเวนิว ถ.พัทยาสายสอง เมืองพัทยา ชลบุรี',
    latitude: 12.9284,
    longitude: 100.8842,
    rating: 4.4,
    provider: 'SHARGE'
  },
  {
    id: 'th-ev-evolt-nongnooch',
    name: 'EVolt - สวนนงนุช พัทยา',
    address: 'ต.นาจอมเทียน อ.สัตหีบ ชลบุรี (จุดจอดรถหน้าทางท่องเที่ยวหลัก)',
    latitude: 12.7662,
    longitude: 100.9324,
    rating: 4.8,
    provider: 'EVolt'
  },

  // --- ภาคใต้ ---
  {
    id: 'th-ev-pea-chumphon',
    name: 'PEA VOLTA - ชุมพร สี่แยกปฐมพร',
    address: 'ถ.เพชรเกษม ต.วังไผ่ อ.เมืองชุมพร ชุมพร (ประตูผ่านทางลงเกาะใต้ฝั่งทะเล)',
    latitude: 10.4522,
    longitude: 99.1242,
    rating: 4.6,
    provider: 'PEA'
  },
  {
    id: 'th-ev-ptt-phunphin',
    name: 'EV Station PluZ PTT - พุนพิน (สุราษฎร์ธานี)',
    address: 'PTT Station ถ.สายทอง ต.ท่าสะท้อน อ.พุนพิน สุราษฎร์ธานี',
    latitude: 9.1154,
    longitude: 99.2342,
    rating: 4.7,
    provider: 'PTT'
  },
  {
    id: 'th-ev-egat-ratchaprapha',
    name: 'EleX by EGAT - เขื่อนรัชชประภา (สุราษฎร์ธานี)',
    address: 'ลานจอดรถท่าเรือเขื่อนรัชชประภา ต.เขาพัง อ.บ้านตาขุน สุราษฎร์ธานี',
    latitude: 8.9712,
    longitude: 98.8154,
    rating: 4.9,
    provider: 'EGAT'
  },
  {
    id: 'th-ev-ea-huahin',
    name: 'EA Anywhere - บลูพอร์ต หัวหิน ชั้นใต้ดิน',
    address: 'ถ.เพชรเกษม ต.หนองแก อ.หัวหิน ประจวบคีรีขันธ์',
    latitude: 12.5512,
    longitude: 99.9612,
    rating: 4.6,
    provider: 'EA'
  },
  {
    id: 'th-ev-evolt-phuket',
    name: 'EVolt - เซ็นทรัล ภูเก็ต ฟลอเรสต้า',
    address: 'ถ.วิชิตสงคราม ต.ตลาดใหญ่ อ.เมืองภูเก็ต ภูเก็ต',
    latitude: 7.8922,
    longitude: 98.3654,
    rating: 4.7,
    provider: 'EVolt'
  },
  {
    id: 'th-ev-sharge-hatyai',
    name: 'SHARGE - เซ็นทรัล หาดใหญ่ เลนชาร์จพิเศษ',
    address: 'ถ.กาญจนวานิช ต.คอหงส์ อ.หาดใหญ่ สงขลา',
    latitude: 6.9922,
    longitude: 100.4854,
    rating: 4.8,
    provider: 'SHARGE'
  },
  {
    id: 'th-ev-tesla-phuket',
    name: 'Tesla Supercharger - บลูทรี ภูเก็ต',
    address: 'ต.เชิงทะเล อ.ถลาง ภูเก็ต',
    latitude: 7.9818,
    longitude: 98.3152,
    rating: 4.9,
    provider: 'Tesla'
  }
];

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyAyHQbzKb6CXvVaVbQB64veUt-khi7AewQ';

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
  onAnalyzeWithAi?: (camp: CampSite) => void;
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
    const combined = [...NATIONWIDE_EV_STATIONS];
    mocks.forEach(m => {
      if (!combined.some(c => c.id === m.id)) {
        combined.push(m);
      }
    });
    setEvStations(combined);
    setEvSearchCenterName(name);
  };

  const handleSearchEVStations = () => {
    let targetLat = 13.7367;
    let targetLng = 100.5231;
    let targetZoom = 6;
    let targetName = 'ทั่วประเทศไทย (ทุกค่ายทุกยี่ห้อ)';

    if (selectedCamp) {
      targetLat = selectedCamp.latitude;
      targetLng = selectedCamp.longitude;
      targetZoom = 11;
      targetName = selectedCamp.name;
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
          map.setZoom(targetZoom);
        }
      }, 600);
      return;
    }

    try {
      const service = new placesLib.PlacesService(map);
      const request: google.maps.places.TextSearchRequest = {
        location: new google.maps.LatLng(targetLat, targetLng),
        radius: selectedCamp ? 30000 : 100000, // wider radius if looking generally
        query: 'EV Charging Station สถานีชาร์จรถไฟฟ้า ' + (selectedCamp ? targetName : '')
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
          
          const combined = [...NATIONWIDE_EV_STATIONS];
          foundStations.forEach(s => {
            if (!combined.some(c => c.id === s.id)) {
              combined.push(s);
            }
          });
          
          setEvStations(combined);
          setEvSearchCenterName(targetName);

          map.panTo({ lat: targetLat, lng: targetLng });
          map.setZoom(targetZoom);
        } else {
          fallbackToMock(targetLat, targetLng, targetName);
          map.panTo({ lat: targetLat, lng: targetLng });
          map.setZoom(targetZoom);
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
  onCloseCampDetails,
  onAnalyzeWithAi
}: CampsMapProps) {
  const [activeOverlayCamp, setActiveOverlayCamp] = useState<CampSite | null>(null);

  // EV Charging stations states
  const [evStations, setEvStations] = useState<EvStation[]>([]);
  const [selectedEvStation, setSelectedEvStation] = useState<EvStation | null>(null);
  const [isLoadingEV, setIsLoadingEV] = useState<boolean>(false);
  const [evSearchCenterName, setEvSearchCenterName] = useState<string>('');
  const [searchTrigger, setSearchTrigger] = useState<number>(0);
  const [selectedEvProvider, setSelectedEvProvider] = useState<string>('ALL');

  const filteredEvStations = evStations.filter(station => {
    if (selectedEvProvider === 'ALL') return true;
    return (station.provider || '').toUpperCase() === selectedEvProvider.toUpperCase();
  });

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
          {filteredEvStations.map((station) => (
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
                  setSelectedEvProvider('ALL');
                }}
                className="text-stone-400 hover:text-stone-600 p-0.5 rounded-full hover:bg-stone-100 transition-colors"
                title="ซ่อนสถานีทั้งหมด"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[10px] leading-normal text-stone-600 font-sans">
              ค้นหารอบ: <strong className="text-forest-900 font-bold">{evSearchCenterName}</strong>
            </p>

            {/* Choose Brand / Provider Network */}
            <div className="mt-2 text-stone-600 font-sans border-t border-sand-100 pt-2">
              <label htmlFor="ev-provider-select" className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                ระบุค่่ายให้บริการ (Network Provider):
              </label>
              <select
                id="ev-provider-select"
                value={selectedEvProvider}
                onChange={(e) => {
                  setSelectedEvProvider(e.target.value);
                  setSelectedEvStation(null); // Clear selected item detail overlay when filter shifts
                }}
                className="w-full bg-stone-50 border border-sand-200 text-stone-800 text-[11px] rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium cursor-pointer"
              >
                <option value="ALL">🔌 ทั้งหมดทุกค่าย ({evStations.length} แห่ง)</option>
                <option value="PTT">🔵 EV Station PluZ (PTT)</option>
                <option value="PEA">🟣 PEA VOLTA</option>
                <option value="EA">🟢 EA Anywhere</option>
                <option value="EGAT">🟡 EleX by EGAT</option>
                <option value="EVolt">🟠 EVolt</option>
                <option value="SHARGE">🔴 SHARGE / REVER</option>
                <option value="Tesla">⚫ Tesla Supercharger</option>
                <option value="AlterVim">🟢 AlterVim (CP)</option>
              </select>
            </div>
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
            <div className="flex items-center gap-1.5 text-[10px] text-blue-700 bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-blue-100 mb-2.5 font-medium">
              <Zap className="h-3 w-3 text-blue-600 fill-blue-300 animate-pulse" />
              <span>รองรับการเดินทางด้วยรถ EV! กดปุ่มมุมบนซ้ายเพื่อค้นหาสถานีชาร์จ</span>
            </div>

            {/* CampHub AI Shortcut Link */}
            <button
              id={`ai-plan-link-${activeOverlayCamp.id}`}
              onClick={() => {
                if (onAnalyzeWithAi) {
                  onAnalyzeWithAi(activeOverlayCamp);
                }
              }}
              className="w-full mb-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-655 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer border border-amber-300/30"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-100 fill-amber-300/20 animate-pulse" />
              <span>จัดกิจกรรม & แพ็กทริปด้วย CampHub AI</span>
            </button>

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
