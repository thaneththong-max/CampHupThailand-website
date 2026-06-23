/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, PlusCircle, Calendar, MessageCircle, Eye, 
  Tag, ArrowLeft, Send, AlertCircle, Sparkles, User as UserIcon, LogIn, Compass, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface WebboardProps {
  user: User | null;
  onNavigate: (path: string) => void;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  tag: string;
  createdAt: string;
  repliesCount: number;
  viewsCount: number;
}

interface Reply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: string;
}

// Custom error handler helper according to guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Webboard Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const FORUM_TAGS = [
  { value: 'ทั่วไป', label: '💬 แฟนคลับทั่วไป', bg: 'bg-stone-100 text-stone-800' },
  { value: 'รีวิวลานกางเต็นท์', label: '🏕️ รีวิวลานกางเต็นท์', bg: 'bg-forest-100 text-forest-800 border-forest-200' },
  { value: 'หาเพื่อนร่วมทริป', label: '🚗 หาเพื่อนร่วมทริป', bg: 'bg-orange-100 text-orange-850 border-orange-200' },
  { value: 'ถาม-ตอบ', label: '❓ สอบถามข้อมูล', bg: 'bg-sky-100 text-sky-850 border-sky-200' },
  { value: 'แนะนำอุปกรณ์', label: '🎒 แนะนำอุปกรณ์', bg: 'bg-amber-100 text-amber-850 border-amber-200' },
];

export default function Webboard({ user, onNavigate }: WebboardProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(false);
  
  // Tag filter state
  const [curTag, setCurTag] = useState<string>('all');

  // Topic Creater Form state
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('ทั่วไป');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Reply Form state
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  // Subscribe to Topics Feed
  useEffect(() => {
    const p = 'webboard_topics';
    const q = query(collection(db, p), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Topic[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          title: d.title || '',
          content: d.content || '',
          authorId: d.authorId || '',
          authorName: d.authorName || 'ชาวแค้มป์',
          authorPhoto: d.authorPhoto || '',
          tag: d.tag || 'ทั่วไป',
          createdAt: d.createdAt || '',
          repliesCount: d.repliesCount || 0,
          viewsCount: d.viewsCount || 0
        });
      });
      setTopics(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, p);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Selected Topic Replies when selected
  useEffect(() => {
    if (!selectedTopic) {
      setReplies([]);
      return;
    }

    setRepliesLoading(true);
    const p = `webboard_topics/${selectedTopic.id}/replies`;
    const q = query(collection(db, p), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Reply[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          topicId: d.topicId,
          content: d.content,
          authorId: d.authorId,
          authorName: d.authorName,
          authorPhoto: d.authorPhoto,
          createdAt: d.createdAt
        });
      });
      setReplies(list);
      setRepliesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, p);
    });

    return () => unsubscribe();
  }, [selectedTopic]);

  // Handle viewing topic (increment views count)
  const handleViewTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    
    // Smooth scroll to top of details pane on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const topicDoc = doc(db, 'webboard_topics', topic.id);
      await updateDoc(topicDoc, {
        viewsCount: increment(1)
      });
    } catch (err) {
      // Non-blocking view update count error
      console.warn('Unable to increment viewsCount safely', err);
    }
  };

  // Create new Topic form handler
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newTitle.trim() || !newContent.trim()) {
      setFormError('โปรดกรอกข้อมูล "หัวข้อเรื่อง" และ "เนื้อหากระทู้" ที่คุณต้องการคุยให้ครบถ้วน');
      return;
    }

    setFormError(null);
    try {
      const topicData = {
        title: newTitle.trim(),
        content: newContent.trim(),
        tag: newTag,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'CampHub User',
        authorPhoto: user.photoURL || '',
        createdAt: new Date().toISOString(),
        repliesCount: 0,
        viewsCount: 0
      };

      const path = 'webboard_topics';
      await addDoc(collection(db, path), topicData);
      
      setNewTitle('');
      setNewContent('');
      setNewTag('ทั่วไป');
      setSubmitSuccess(true);
      setIsCreatingTopic(false);

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setFormError('ไม่สามารถโพสต์กระทู้ได้เนื่องจากเหตุขัดข้องทางเครือข่าย โปรดลองอีกครั้ง');
    }
  };

  // Submit reply comment handler
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic) return;

    if (!replyText.trim()) {
      setReplyError('โปรดป้อนเนื้อหาความคิดเห็นของคุณ');
      return;
    }

    setReplyError(null);
    const text = replyText.trim();
    setReplyText('');

    try {
      const replyData = {
        topicId: selectedTopic.id,
        content: text,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Unknown Camper',
        authorPhoto: user.photoURL || '',
        createdAt: new Date().toISOString()
      };

      const repliesPath = `webboard_topics/${selectedTopic.id}/replies`;
      await addDoc(collection(db, repliesPath), replyData);

      // Increment repliesCount on the topic
      const topicDoc = doc(db, 'webboard_topics', selectedTopic.id);
      await updateDoc(topicDoc, {
        repliesCount: increment(1)
      });
    } catch (err) {
      setReplyError('ส่งข้อความล้มเหลว กรุณาลองตรวจสอบความเชื่อมต่ออินเทอร์เน็ต');
    }
  };

  // Local helper to format ISO strings to friendly local Thai string
  const formatFriendlyDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Filtered topics based on tag selection
  const filteredTopics = curTag === 'all' 
    ? topics 
    : topics.filter(t => t.tag === curTag);

  return (
    <div className="min-h-screen bg-sand-50 pb-16 text-stone-900 font-sans" id="camphub-webboard-main">
      {/* Mini Navigation Bar */}
      <div className="bg-forest-950 text-white py-3 border-b border-forest-800">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs text-forest-300 hover:text-white font-extrabold cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>กลับไปแผนทื่นโยบายหลัก</span>
          </button>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold">
            🔴 WEBBOARD COMMUNITY LIVE
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Decorative board header */}
        <div className="bg-gradient-to-br from-forest-900 via-forest-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-xl relative space-y-3">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md text-amber-300 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-white/5">
              <Sparkles className="h-3 w-3" /> ชุมชนคนรักป่า แคมป์ฮับไทยแลนด์
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              สภากลางล้อมวงคุยเรื่องจุดกางเต็นท์
            </h2>
            <p className="text-xs sm:text-sm text-forest-200 leading-relaxed font-sans font-medium">
              กระดานแลกเปลี่ยนข้อมูล สอบถามเส้นทาง รีวิวพิกัดลานเปิดใหม่ หาเพื่อนร่วมทริป หรือตอบข้อสงสัยสภาพกาศกับเพื่อนสายแคมป์ปิ้งด้วยกันแบบเรียลไทม์
            </p>
          </div>
        </div>

        {submitSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold"
          >
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>โพสต์กระทู้สนทนาของคุณเรียบร้อยแล้ว กำลังอัพโหลดขึ้นกระดานในไม่ช้า!</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* List of Topics block or topic creating controller */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Action controls & Tab tag triggers */}
            <div className="bg-white rounded-3xl p-5 border border-sand-200 shadow-3xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-forest-800" />
                  <span>กระทู้สนทนาในชุมชน</span>
                </h3>

                {user ? (
                  <button
                    onClick={() => {
                      setIsCreatingTopic(!isCreatingTopic);
                      setSelectedTopic(null);
                    }}
                    className="bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer max-w-fit shrink-0 border border-forest-800"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>ตั้งกระทู้ใหม่</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('/auth')}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer max-w-fit shrink-0 border border-amber-600"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>เข้าสู่ระบบเพื่อสร้างกระทู้</span>
                  </button>
                )}
              </div>

              {/* Tags Horizontal Scrolling selection */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  onClick={() => setCurTag('all')}
                  className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shrink-0 border transition-all cursor-pointer ${
                    curTag === 'all'
                      ? 'bg-forest-900 text-white border-forest-900'
                      : 'bg-sand-50/70 border-sand-200 text-stone-600 hover:text-stone-900 hover:bg-sand-100'
                  }`}
                >
                  ทั้งหมด ({topics.length})
                </button>
                {FORUM_TAGS.map(tag => {
                  const count = topics.filter(t => t.tag === tag.value).length;
                  return (
                    <button
                      key={tag.value}
                      onClick={() => setCurTag(tag.value)}
                      className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shrink-0 border transition-all cursor-pointer ${
                        curTag === tag.value
                          ? 'bg-forest-900 text-white border-forest-900'
                          : `bg-sand-10/40 border-sand-200/50 text-stone-600 hover:text-stone-900 hover:bg-sand-50`
                      }`}
                    >
                      {tag.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create Topic Expand Panel */}
            {isCreatingTopic && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-3xl p-5 border border-forest-100 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-sand-200/50">
                  <h4 className="text-sm font-extrabold text-forest-950 flex items-center gap-1.5">
                    🏕️ สร้างกระทู้ใหม่บนกระดานแคมป์ฮับ
                  </h4>
                  <button 
                    onClick={() => setIsCreatingTopic(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                  >
                    ยกเลิก
                  </button>
                </div>

                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">
                      หัวข้อกระทู้สนทนา 
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="เช่น แนะนำจุดกางเต็นท์ริมน้ำบรรยากาศเงียบสงบในเพชรบุรีหน่อยครับ..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sand-50/50 border border-sand-200 focus:outline-hidden focus:ring-1 focus:ring-forest-600 text-xs sm:text-sm text-stone-900 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-600 block mb-1">
                        เลือกประเภทหมวดหมู่ (Tag)
                      </label>
                      <select
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-sand-50/50 border border-sand-200 focus:outline-hidden text-xs sm:text-sm text-stone-800"
                      >
                        {FORUM_TAGS.map(t => (
                          <option key={t.value} value={t.value}>{t.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">
                      รายละเอียดเนื้อหากระทู้
                    </label>
                    <textarea
                      rows={6}
                      maxLength={1500}
                      placeholder="เขียนรายละเอียดที่คุณต้องการจะเล่า สอบถาม หรือบอกต่อความประทับใจพิกัดลานกางเต็นท์..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full p-4 rounded-xl bg-sand-50/50 border border-sand-200 focus:outline-hidden focus:ring-1 focus:ring-forest-600 text-xs sm:text-sm text-stone-900 font-sans leading-relaxed"
                    />
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center gap-2 font-bold">
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCreatingTopic(false)}
                      className="px-4 py-2 border border-sand-300 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-sand-50 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      ลงกระจกโพสต์กระทู้
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* List topics Render block */}
            {loading ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-sand-200">
                <RefreshCw className="h-8 w-8 text-forest-700 animate-spin mx-auto" />
                <p className="text-xs text-stone-500 mt-2">กำลังล้อมวงเช็คกระดานกระทู้แคมเปอร์ออนไลน์...</p>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-sand-200 text-center space-y-3 shadow-3xs">
                <div className="p-3 bg-sand-50 rounded-full w-fit mx-auto text-sand-700">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-stone-950 font-bold text-sm">ไม่พบกระทู้สนทนาในหมวดหมู่นี้</h4>
                  <p className="text-[11px] text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    ยังไม่มีใครเริ่มคุยในหมวดนี้นัก คิกเปิดประเด็นริสร้างผลงานเป็นคนแรกเพื่อชวนเพื่อนๆ มาล้อมวงคุยกันได้เลย!
                  </p>
                </div>
                {user && (
                  <button
                    onClick={() => {
                      setNewTag(curTag !== 'all' ? curTag : 'ทั่วไป');
                      setIsCreatingTopic(true);
                    }}
                    className="bg-forest-900/10 hover:bg-forest-900 text-forest-900 hover:text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>เริ่มตั้งกระทู้แรก</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTopics.map((topic) => {
                  const tagInfo = FORUM_TAGS.find(t => t.value === topic.tag) || { bg: 'bg-stone-50 text-stone-700 border-sand-200' };
                  const isSelected = selectedTopic?.id === topic.id;
                  
                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleViewTopic(topic)}
                      className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-xs cursor-pointer ${
                        isSelected 
                          ? 'border-forest-700 ring-1 ring-forest-700 shadow-xs' 
                          : 'border-sand-200 hover:border-sand-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${tagInfo.bg}`}>
                            {topic.tag}
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatFriendlyDate(topic.createdAt)}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm sm:text-base text-stone-950 hover:text-forest-900 leading-snug transition-colors">
                          {topic.title}
                        </h4>

                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {topic.content}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-sand-100 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {topic.authorPhoto ? (
                              <img
                                src={topic.authorPhoto}
                                alt={topic.authorName}
                                className="h-5.5 w-5.5 rounded-full border border-sand-300 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-5.5 w-5.5 rounded-full bg-sand-200 text-stone-600 flex items-center justify-center border border-sand-300">
                                <UserIcon className="h-3 w-3" />
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-stone-700">
                              {topic.authorName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 font-semibold font-mono">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5 text-stone-400" />
                              <span>{topic.viewsCount} อ่าน</span>
                            </span>
                            <span className="flex items-center gap-1 bg-sand-100/60 text-forest-900 px-2 py-0.5 rounded-lg border border-sand-200/50">
                              <MessageCircle className="h-3.5 w-3.5 text-forest-700" />
                              <span>{topic.repliesCount} ตอบ</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Selected Topic details view container */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-10">
            {selectedTopic ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl overflow-hidden border border-sand-200 shadow-md flex flex-col max-h-[85vh]"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-forest-900 to-forest-950 p-4 shrink-0 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-amber-300" />
                    <span className="text-xs font-extrabold">อ่านรายละเอียดกระทู้</span>
                  </div>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="text-[10px] text-forest-200 hover:text-white font-extrabold border border-forest-800/40 hover:border-forest-700/50 rounded-lg px-2 py-1 bg-forest-950/20"
                  >
                    ปิดแสดง
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5 flex-1 select-text scrollbar-thin">
                  {/* Author profile and meta */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-sand-200/50">
                    <div className="flex items-center gap-2">
                      {selectedTopic.authorPhoto ? (
                        <img
                          src={selectedTopic.authorPhoto}
                          alt={selectedTopic.authorName}
                          className="h-8 w-8 rounded-full border border-sand-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-sand-100 text-stone-600 flex items-center justify-center border border-sand-200">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-stone-900">{selectedTopic.authorName}</p>
                        <p className="text-[10px] text-stone-400 font-mono font-medium">ตั้งกระทู้คำถาม</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 font-mono">
                      {formatFriendlyDate(selectedTopic.createdAt)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <span className="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-sand-200 font-extrabold uppercase">
                      ⚓ {selectedTopic.tag}
                    </span>
                    <h3 className="text-sm font-extrabold text-stone-950 leading-snug">
                      {selectedTopic.title}
                    </h3>
                    <p className="text-xs text-stone-700 leading-relaxed font-sans whitespace-pre-line bg-sand-50/50 p-3 rounded-2xl border border-sand-200/50">
                      {selectedTopic.content}
                    </p>
                  </div>

                  {/* Comments lists */}
                  <div className="space-y-3 pt-3 border-t border-sand-200/60">
                    <h4 className="text-xs font-extrabold text-stone-900 flex items-center justify-between">
                      <span>ความคิดเห็นตอบกลับ ({replies.length} ข้อความ)</span>
                      {repliesLoading && <RefreshCw className="h-3 w-3 text-forest-700 animate-spin" />}
                    </h4>

                    {replies.length === 0 && !repliesLoading ? (
                      <p className="text-[10px] text-stone-400 italic text-center py-4">
                        ยังไม่มีเพื่อนแคมป์คนไหนร่วมตอบกระทู้นี้ มารับบทประเดิมข้อความแรกกันดีกว่า!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {replies.map((reply) => (
                          <div key={reply.id} className="bg-sand-10/40 p-3.5 rounded-2xl border border-sand-200/50 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2 pb-1 border-b border-sand-200/20">
                              <div className="flex items-center gap-1.5">
                                {reply.authorPhoto ? (
                                  <img
                                    src={reply.authorPhoto}
                                    alt={reply.authorName}
                                    className="h-4.5 w-4.5 rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="h-4.5 w-4.5 rounded-full bg-sand-100 text-stone-600 flex items-center justify-center">
                                    <UserIcon className="h-3 w-3" />
                                  </div>
                                )}
                                <span className="font-bold text-stone-800 text-[11px]">{reply.authorName}</span>
                              </div>
                              <span className="text-[9px] text-stone-400 font-mono font-medium">
                                {formatFriendlyDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-stone-700 leading-relaxed whitespace-pre-line pl-1.5 font-sans">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit comment action footer */}
                <div className="p-4 bg-sand-50/70 border-t border-sand-200 shrink-0">
                  {user ? (
                    <form onSubmit={handleSubmitReply} className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={500}
                          placeholder="ร่วมแสดงความคิดเห็น แนะนำข้อมูลของคุณ..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-sand-300 focus:outline-hidden focus:ring-1 focus:ring-forest-600 text-xs text-stone-900"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                          title="ส่งความคิดเห็น"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {replyError && (
                        <p className="text-[10px] text-red-650 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{replyError}</span>
                        </p>
                      )}
                    </form>
                  ) : (
                    <div className="text-center py-1">
                      <p className="text-[10px] text-stone-500 font-bold mb-2">
                        🔒 คุณจำเป็นต้องเข้าสู่ระบบแอปก่อนแสดงความคิดเห็น
                      </p>
                      <button
                        onClick={() => onNavigate('/auth')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-[10px] cursor-pointer shadow-3xs"
                      >
                        <LogIn className="h-3 w-3" />
                        <span>เข้าสู่ระบบแค้มเปอร์</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="hidden lg:block bg-gradient-to-br from-white to-[#fdfbf6] rounded-3xl p-6 border border-sand-200 border-dashed text-center py-16 space-y-3">
                <div className="p-4 bg-sand-100 text-sand-700 rounded-full w-fit mx-auto">
                  <Compass className="h-7 w-7 text-forest-700 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">ไม่มีกระทู้ที่กำลังเปิดอ่านอยู่</h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 mt-1 leading-relaxed max-w-xs mx-auto">
                    คลิกเลือกหัวข้อกระทู้สนทนาที่คุณสนใจทางด้านซ้าย เพื่อเปิดอ่านรายละเอียด โพสต์ตอบ และปรึกษาหารือกับครอบครัวรักการเต็นท์ของเราได้ทันทีครับ
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
