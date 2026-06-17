/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, X, Check, Trash2, CameraOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CampCameraProps {
  campId: string;
  onPhotoSaved: (photoUrl: string) => void;
}

export default function CampCamera({ campId, onPhotoSaved }: CampCameraProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load existing user saved photos from localStorage for this campground
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`camp_photos_${campId}`);
      if (stored) {
        setSavedPhotos(JSON.parse(stored));
      } else {
        setSavedPhotos([]);
      }
    } catch (e) {
      console.error('Error loading saved photos from localStorage', e);
    }
  }, [campId]);

  // Handle stream release/cleanup when camera closes or component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  // Request & Start Camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setError(null);
    setCapturedPhoto(null);
    
    // Stop any existing streams first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPermissionState('granted');
    } catch (err: any) {
      console.error('Error opening camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('ไม่ได้รับอนุญาตให้เข้าถึงกล้องถ่ายภาพ กรุณาเปิดสิทธิ์กล้องในเบราว์เซอร์ของคุณ');
        setPermissionState('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('ไม่บพบอุปกรณ์กล้องถ่ายภาพที่เชื่อมต่อกับเครื่องนี้');
      } else {
        setError(`ไม่สามารถเปิดใช้งานกล้องได้: ${err.message || 'ข้อผิดพลาดระบบ'}`);
      }
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isActive) {
      startCamera(nextMode);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas size to match current video aspect ratio
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw active frame onto canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract image data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
      } catch (err) {
        console.error('Failed to capture frame as base64 data URL', err);
        setError('เกิดข้อผิดพลาดในการบันทึกภาพถ่ายจากกล้อง');
      }
    }
  };

  const savePhoto = () => {
    if (!capturedPhoto) return;

    try {
      const updatedList = [capturedPhoto, ...savedPhotos];
      setSavedPhotos(updatedList);
      localStorage.setItem(`camp_photos_${campId}`, JSON.stringify(updatedList));
      onPhotoSaved(capturedPhoto);
      setCapturedPhoto(null);
    } catch (err) {
      console.error('LocalStorage allocation full or write failed', err);
      setError('พื้นที่จัดเก็บภาพถ่ายในบราวเซอร์เต็ม ไม่สามารถบันทึกภาพเพิ่มได้');
    }
  };

  const deletePhoto = (indexToDelete: number) => {
    const updatedList = savedPhotos.filter((_, idx) => idx !== indexToDelete);
    setSavedPhotos(updatedList);
    localStorage.setItem(`camp_photos_${campId}`, JSON.stringify(updatedList));
  };

  return (
    <div className="bg-sand-100/40 p-4 rounded-2xl border border-sand-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="h-4.5 w-4.5 text-forest-700" />
          <h4 className="text-sm font-bold text-stone-900">กล้องแคมป์รายงานสด (Live Camp Camera)</h4>
        </div>
        {!isActive && !capturedPhoto && (
          <button
            onClick={() => startCamera()}
            className="text-[11px] font-bold text-white bg-forest-700 hover:bg-forest-600 px-3 py-1.5 rounded-xl border border-forest-800 transition-colors flex items-center space-x-1"
          >
            <Camera className="h-3 w-3" />
            <span>เปิดใช้งานกล้อง</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-stone-500 leading-normal">
        ถ่ายรูปสภาพแวดล้อมหรือบรรยากาศสดๆ ของลานกางเต็นท์เพื่อใช้ประโยชน์ในการจดบันทึกของคุณ หรือแชร์สภาพสถานที่จริงแบบเรียลไทม์
      </p>

      {/* Error Message Box */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start space-x-2 text-xs">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">พบสิ่งผิดปกติ</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Camera Interface container (Active or preview) */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-stone-800 shadow"
          >
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Live indicator tag */}
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white block" />
              LIVE PREVIEW
            </span>

            {/* Controls Bar integrated over stream */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-4 px-4">
              {/* Change Camera Facing button */}
              <button
                onClick={toggleFacingMode}
                className="bg-stone-900/80 hover:bg-stone-800 text-sand-50 p-2.5 rounded-full border border-stone-700 shadow backdrop-blur-xs transition-colors"
                title="สลับกล้องหน้า/หลัง"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              {/* Big capture button */}
              <button
                onClick={capturePhoto}
                className="h-14 w-14 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 shadow-xl transform active:scale-90 transition-transform flex items-center justify-center text-white"
                title="กดถ่ายรูป"
              >
                <span className="h-8 w-8 rounded-full bg-white opacity-40 block animate-ping absolute" />
              </button>

              {/* Cancel stream button */}
              <button
                onClick={stopCamera}
                className="bg-stone-900/80 hover:bg-stone-800 text-sand-50 p-2.5 rounded-full border border-stone-700 shadow backdrop-blur-xs transition-colors"
                title="ปิดกล้อง"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Capture Snapshot Preview & Confirmation */}
        {capturedPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-stone-950 rounded-2xl overflow-hidden border border-sand-300 shadow"
          >
            <img
              src={capturedPhoto}
              alt="Snapshot preview"
              className="w-full aspect-video object-cover"
            />

            {/* Capture confirmation panel */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/90 to-transparent p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setCapturedPhoto(null);
                  startCamera();
                }}
                className="bg-stone-800/90 hover:bg-stone-700 text-sand-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-stone-700 transition"
              >
                ถ่ายใหม่ (Retake)
              </button>
              <button
                onClick={savePhoto}
                className="bg-forest-600 hover:bg-forest-550 text-white text-xs font-bold px-4 py-2 rounded-xl shadow border border-forest-700 transition flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                บันทึกภาพถ่าย (Save)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HTML5 drawing layer */}
      <canvas ref={canvasRef} className="hidden" />

      {/* User's captured photos scrollbar section */}
      {savedPhotos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-sand-200">
          <span className="text-[11px] font-bold text-stone-700 block">
            📸 อัลบั้มส่วนตัวของคุณ ({savedPhotos.length} รูป)
          </span>
          <div className="flex space-x-3 overflow-x-auto pb-1.5 scrollbar-thin">
            {savedPhotos.map((photo, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border border-sand-300 group shadow-xs"
              >
                <img
                  src={photo}
                  alt={`My capture ${index}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => onPhotoSaved(photo)}
                />
                <button
                  onClick={() => deletePhoto(index)}
                  className="absolute top-1 right-1 p-1 rounded-md bg-stone-900/80 hover:bg-red-600 text-sand-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
