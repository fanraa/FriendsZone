import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Image, Search } from "lucide-react";
import { Author, Post, MOCK_AUTHORS } from "../types";
import { PostCard } from "../components/feed/PostCard";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { compressImageBase64 } from "../utils/imageCompressor";
import { scanImageSkinDensity } from "../utils/nudityScanner";

interface FeedViewProps {
  isAuthenticated: boolean;
  currentUser?: Author | null;
  onNavigate: (path: string) => void;
  isScrolled: boolean;
  hasNewPosts: boolean;
  setHasNewPosts: (val: boolean) => void;
  openComments: (post: Post) => void;
  openProfile: (author: Author) => void;
  showNotification: (message: string, type?: any) => void;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

const SEARCH_PHRASES = [
  "Who is Fanra?",
  "Search posts or people...",
  "Let's explore active users...",
  "Find active tournament moments...",
  "Connect with Friendszone members..."
];

export const FeedView = ({
  isAuthenticated,
  currentUser,
  onNavigate,
  isScrolled,
  hasNewPosts,
  setHasNewPosts,
  openComments,
  openProfile,
  showNotification,
  posts,
  setPosts
}: FeedViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [placeholder, setPlaceholder] = useState("");

  // Multiple base64 images upload state (up to 30)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState(false);

  // Separate position pan & zoom for each image index
  const [imagePositions, setImagePositions] = useState<Record<number, { scale: number; x: number; y: number }>>({});
  const [imageAspects, setImageAspects] = useState<Record<string, number>>({});
  const [containerSize, setContainerSize] = useState(380);
  const cropContainerRef = React.useRef<HTMLDivElement>(null);

  const updateContainerSize = () => {
    if (cropContainerRef.current) {
      setContainerSize(cropContainerRef.current.getBoundingClientRect().width);
    }
  };

  const getPositionForIndex = (idx: number) => {
    return imagePositions[idx] || { scale: 1, x: 0, y: 0 };
  };

  const updatePositionForIndex = (idx: number, updates: Partial<{ scale: number; x: number; y: number }>) => {
    setImagePositions((prev) => {
      const current = prev[idx] || { scale: 1, x: 0, y: 0 };
      
      // Scale is strictly locked to 1. No zooming or shrinking allowed.
      const nextScale = 1;
      
      let nextX = updates.x !== undefined ? updates.x : current.x;
      let nextY = updates.y !== undefined ? updates.y : current.y;
      
      const imgKey = uploadedImages[idx] || "";
      const aspect = imageAspects[imgKey] || 1;
      
      let maxOffsetX = 0;
      let maxOffsetY = 0;
      
      if (aspect >= 1) {
        // Landscape (fills height, crop horizontally)
        const scaledWidth = containerSize * aspect;
        maxOffsetX = Math.max(0, (scaledWidth - containerSize) / 2);
      } else {
        // Portrait (fills width, crop vertically)
        const scaledHeight = containerSize / aspect;
        maxOffsetY = Math.max(0, (scaledHeight - containerSize) / 2);
      }
      
      // Guard boundaries cleanly so that black/blank areas are never ever exposed
      nextX = Math.min(Math.max(nextX, -maxOffsetX), maxOffsetX);
      nextY = Math.min(Math.max(nextY, -maxOffsetY), maxOffsetY);
      
      return {
        ...prev,
        [idx]: { scale: nextScale, x: nextX, y: nextY }
      };
    });
  };

  React.useEffect(() => {
    if (isUploadModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isUploadModalOpen]);

  // Drag and zoom mouse gesture state for the active photo
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);

  const activePosition = getPositionForIndex(activeImageIndex);
  const activeImgKey = uploadedImages[activeImageIndex] || "";
  const activeAspect = imageAspects[activeImgKey] || 1;

  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    updateContainerSize();
    setIsDraggingImage(true);
    setDragStartPos({ x: e.clientX - activePosition.x, y: e.clientY - activePosition.y });
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage) return;
    updatePositionForIndex(activeImageIndex, {
      x: e.clientX - dragStartPos.x,
      y: e.clientY - dragStartPos.y
    });
  };

  const handleImageMouseUpOrLeave = () => {
    setIsDraggingImage(false);
  };

  const handleImageWheel = (e: React.WheelEvent) => {
    // Zoom is disabled as requested, only allow panning
    e.preventDefault();
  };

  // Touch gesture support: pan only (zoom/pinch is disabled)
  const handleImageTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      updateContainerSize();
      setIsDraggingImage(true);
      const touch = e.touches[0];
      setDragStartPos({ x: touch.clientX - activePosition.x, y: touch.clientY - activePosition.y });
    }
  };

  const handleImageTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingImage) {
      const touch = e.touches[0];
      updatePositionForIndex(activeImageIndex, {
        x: touch.clientX - dragStartPos.x,
        y: touch.clientY - dragStartPos.y
      });
    }
  };

  const handleImageTouchEnd = () => {
    setIsDraggingImage(false);
    setTouchStartDist(null);
  };

  // Search Placeholder effect
  React.useEffect(() => {
    let currentPhraseIndex = 0;
    let currentCharacterIndex = 0;
    let isDeleting = false;
    let timer: any;

    const tick = () => {
      const fullPhrase = SEARCH_PHRASES[currentPhraseIndex];
      
      if (!isDeleting) {
        setPlaceholder(fullPhrase.substring(0, currentCharacterIndex + 1));
        currentCharacterIndex++;

        if (currentCharacterIndex === fullPhrase.length) {
          isDeleting = true;
          timer = setTimeout(tick, 1800);
        } else {
          timer = setTimeout(tick, 70); 
        }
      } else {
        setPlaceholder(fullPhrase.substring(0, currentCharacterIndex - 1));
        currentCharacterIndex--;

        if (currentCharacterIndex === 0) {
          isDeleting = false;
          currentPhraseIndex = (currentPhraseIndex + 1) % SEARCH_PHRASES.length;
          timer = setTimeout(tick, 500); 
        } else {
          timer = setTimeout(tick, 35); 
        }
      }
    };

    timer = setTimeout(tick, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Multi-image file loaders
  const handleMultipleFilesLoad = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const availableSlots = 30 - uploadedImages.length;
    if (availableSlots <= 0) {
      showNotification("Maximum 30 images allowed", "info");
      return;
    }
    const filesToLoad = fileArray.slice(0, availableSlots);

    filesToLoad.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          // Compress post photos to maximum of 800x800 at quality 0.7
          const base64Data = await compressImageBase64(rawBase64, 800, 800, 0.7);
          
          // Pre-check skin color density before hosting / uploading to firestore
          const scanRes = await scanImageSkinDensity(base64Data);
          if (scanRes.isSuspicious) {
            showNotification(`Warning: High skin density detected (${scanRes.skinPercentage}%). Please ensure compliant upload.`, "info");
          }

          setUploadedImages((prev) => {
            const next = [...prev, base64Data];
            // Immediately set active image selector to the newly uploaded image!
            setActiveImageIndex(next.length - 1);
            return next;
          });
          
          // Measure and record the natural aspect ratio of the uploaded image
          const img = new window.Image();
          img.onload = () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            setImageAspects((prev) => ({
              ...prev,
              [base64Data]: aspect
            }));
          };
          img.src = base64Data;
        } catch (err) {
          showNotification("Failed to compress image", "error");
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePublishPost = async () => {
    if (uploadedImages.length === 0) return;

    setIsPublishing(true);
    const postId = "post_" + Date.now().toString();

    // Map each image's position structure for persistent placement rendering
    const imageTransforms = uploadedImages.map((img, idx) => {
      const pos = imagePositions[idx] || { scale: 1, x: 0, y: 0 };
      const aspect = imageAspects[img] || 1;
      const refSize = containerSize || 380;
      return {
        scale: pos.scale,
        x: pos.x / refSize, // Store as a responsive percentage/fraction
        y: pos.y / refSize, // Store as a responsive percentage/fraction
        aspect: aspect
      };
    });

    const newPost: Post = {
      id: postId,
      author: currentUser || MOCK_AUTHORS["andi"],
      images: uploadedImages,
      imageTransforms: imageTransforms,
      caption: newCaption.trim() ? newCaption.trim().slice(0, 2200) : "",
      likes: 0,
      comments: 0,
      date: "Just now",
      commentList: []
    };

    try {
      await setDoc(doc(db, "posts", postId), {
        ...newPost,
        createdAt: Date.now()
      });
      showNotification("Memory shared successfully!", "success");
      handleResetUploadState();
    } catch (err) {
      console.error("Firestore post creation failed:", err);
      showNotification("Failed to upload memory", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetUploadState = () => {
    setUploadedImages([]);
    setImagePositions({});
    setActiveImageIndex(0);
    setNewCaption("");
    setIsUploadModalOpen(false);
  };

  const [showShareBar, setShowShareBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowShareBar(false);
      } else {
        setShowShareBar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesLoad(e.dataTransfer.files);
      setIsUploadModalOpen(true);
    }
  };

  return (
    <motion.div 
      key="feed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full max-w-lg mx-auto relative min-h-screen pt-4 px-4 sm:px-0 transition-all duration-300 ${isDragging ? "bg-[var(--surface2)]/50 rounded-2xl scale-[0.99]" : ""}`}
    >
      {/* Scroll to Top Arrow */}
      <AnimatePresence>
         {isScrolled && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="fixed bottom-12 right-6 z-[500] w-10 h-10 rounded-full bg-[var(--bg2)] border border-[var(--border)] text-[var(--text)] shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all opacity-80 hover:opacity-100"
            >
              <ChevronRight className="-rotate-90" size={20} />
            </motion.button>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {hasNewPosts && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full btn-primary text-white text-[10px] font-medium shadow-lg cursor-pointer flex items-center gap-2"
            onClick={() => { setHasNewPosts(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            New Updates
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden multiple files loader input */}
      {isAuthenticated && (
        <input 
          type="file" 
          id="drawer-file-upload" 
          multiple
          accept="image/*" 
          className="hidden" 
          onChange={(e) => handleMultipleFilesLoad(e.target.files)} 
        />
      )}

      {/* Upload Full Page Overlay & Slider using Portal to prevent transform bugs */}
      {createPortal(
        <AnimatePresence>
          {isUploadModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 w-full h-screen bg-white text-slate-800 z-[9999] flex flex-col items-center justify-center p-4 md:p-8"
            >
              <div className="w-full max-w-4xl mx-auto flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-y-auto no-scrollbar justify-center">
                
                {/* Clean, beautifully balanced layout layout - Left Side (Cropper Viewport), Right Side (Inputs & Buttons) */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center w-full">
                  
                  {/* Left Side: Immersive Cropper with shadow */}
                  <div className="w-full flex-1 flex flex-col justify-center items-center min-h-0">
                    {uploadedImages.length === 0 ? (
                      <div 
                        onClick={() => document.getElementById("drawer-file-upload")?.click()}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => { e.preventDefault(); handleMultipleFilesLoad(e.dataTransfer.files); }}
                        className="aspect-square w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-50 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all duration-300 select-none max-w-[420px] shadow-sm bg-white"
                      >
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                          <img src="https://cdn-icons-png.flaticon.com/128/9261/9261196.png" className="w-9 h-9 object-contain" alt="Upload" />
                        </div>
                        <div className="text-center px-4">
                          <span className="text-sm text-slate-700 font-semibold font-sans block mb-1">Choose files or drag them here</span>
                          <span className="text-[11px] text-slate-400">Drag multiple images to select up to 30</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        ref={cropContainerRef}
                        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center max-w-[420px] shadow-sm select-none shrink-0"
                      >
                        <div 
                          className="w-full h-full relative overflow-hidden flex items-center justify-center rounded-2xl"
                          onMouseDown={handleImageMouseDown}
                          onMouseMove={handleImageMouseMove}
                          onMouseUp={handleImageMouseUpOrLeave}
                          onMouseLeave={handleImageMouseUpOrLeave}
                          onWheel={handleImageWheel}
                          onTouchStart={handleImageTouchStart}
                          onTouchMove={handleImageTouchMove}
                          onTouchEnd={handleImageTouchEnd}
                        >
                          <img 
                            src={uploadedImages[activeImageIndex]} 
                            alt="Crop target" 
                            className="pointer-events-none select-none max-w-none max-h-none origin-center"
                            referrerPolicy="no-referrer"
                            style={{
                              width: activeAspect >= 1 ? `${activeAspect * 100}%` : "100%",
                              height: activeAspect < 1 ? `${(1 / activeAspect) * 100}%` : "100%",
                              transform: `scale(${activePosition.scale}) translate(${activePosition.x}px, ${activePosition.y}px)`,
                              cursor: isDraggingImage ? "grabbing" : "grab",
                              transition: "none"
                            }}
                          />
                        </div>
                        
                        {/* Immersive drag warning */}
                        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-sans px-3 py-1 rounded-full pointer-events-none select-none flex items-center gap-1.5 align-middle">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Drag photo to adjust placement
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Professional parameters panel */}
                  <div className="w-full md:w-[400px] flex flex-col justify-between shrink-0 text-left">
                    <div className="flex flex-col gap-5">

                      {/* Captions textarea context */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Memory Caption</label>
                        <textarea
                          maxLength={2200}
                          value={newCaption}
                          onChange={(e) => setNewCaption(e.target.value)}
                          placeholder="Write an interesting caption..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none min-h-[140px] text-slate-800 font-normal no-scrollbar"
                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        />
                      </div>

                      {/* Photo selector thumbnails */}
                      {uploadedImages.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Photos ({uploadedImages.length} of 30)</label>
                          <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar max-w-full">
                            {uploadedImages.map((img, idx) => (
                              <div 
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 ${idx === activeImageIndex ? "border-blue-500 shadow-sm" : "border-slate-100 opacity-75 hover:opacity-100"}`}
                              >
                                <img src={img} className="w-full h-full object-cover pointer-events-none select-none" alt="Mini preview" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = uploadedImages.filter((_, i) => i !== idx);
                                    setUploadedImages(updated);
                                    const updatedPositions = { ...imagePositions };
                                    delete updatedPositions[idx];
                                    setImagePositions(updatedPositions);
                                    if (activeImageIndex >= updated.length) {
                                      setActiveImageIndex(Math.max(0, updated.length - 1));
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-rose-600/95 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-700 transition-colors cursor-pointer flex items-center justify-center w-4 h-4"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {uploadedImages.length < 30 && (
                              <button
                                type="button"
                                onClick={() => document.getElementById("drawer-file-upload")?.click()}
                                className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom main buttons */}
                    <div className="flex gap-4 mt-8 shrink-0">
                      <button
                        type="button"
                        onClick={handleResetUploadState}
                        className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePublishPost}
                        disabled={isPublishing || uploadedImages.length === 0}
                        className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {isPublishing ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sharing...
                          </>
                        ) : (
                          <>
                            <img src="https://cdn-icons-png.flaticon.com/128/18099/18099127.png" className="w-4 h-4 object-contain" alt="Share" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="px-4 sm:px-0 flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-medium tracking-tight">Feed</h2>
        </div>

        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm mb-2">
            <div>
              <h3 className="font-semibold text-xs text-[var(--text)]">Become a part of Friendszone</h3>
              <p className="text-[10px] text-[var(--text-dim)] mt-1">Connect with friends, share memories, and search for people around you.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => onNavigate("/friendszone/login")}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] font-medium text-xs text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all cursor-pointer text-center whitespace-nowrap"
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate("/friendszone/register")}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--purple)] hover:opacity-90 active:scale-95 text-white font-medium text-xs transition-all cursor-pointer text-center whitespace-nowrap shadow-sm"
              >
                Register
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 items-center w-full">
          {isAuthenticated && (
            <button 
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="p-1 text-[var(--purple)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Upload memory"
            >
              <img src="https://cdn-icons-png.flaticon.com/128/9261/9261196.png" className="w-6 h-6 object-contain" alt="Upload Memory" />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={15} />
            <input 
              type="text"
              placeholder={placeholder}
              className="w-full bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-3.5 text-xs font-normal focus:outline-none focus:border-[var(--purple)] focus:ring-1 focus:ring-[var(--purple)]/10 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all text-[var(--text)] placeholder:text-[var(--text-dim)]/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-[var(--border)]">
        {posts
          .filter(post => 
            post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            post.caption.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onOpenComments={openComments} 
            onOpenProfile={openProfile} 
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => onNavigate("/friendszone/login")}
            onShowNotification={showNotification}
            currentUser={currentUser}
          />
        ))}
        {searchQuery && posts.filter(p => p.caption.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
           <div className="py-20 text-center px-10">
              <p className="text-sm text-[var(--text-dim)] font-normal">No results found for "{searchQuery}"</p>
           </div>
        )}
      </div>

      <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-60">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    </motion.div>
  );
};
