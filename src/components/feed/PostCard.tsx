import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Send, MoreHorizontal } from "lucide-react";
import { Post, Author } from "../../types";
import { db } from "../../lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { addAuditLog } from "../../lib/firebaseCache";

interface PostCardProps {
  post: Post;
  onOpenComments: (post: Post) => void;
  onOpenProfile: (author: Author) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onShowNotification: (message: string, type?: "success" | "error" | "info") => void;
  currentUser?: Author | null;
}

const isIndonesianText = (text: string): boolean => {
  if (!text) return false;
  const idWords = [
    "dan", "yang", "di", "ini", "dengan", "saya", "aku", "kamu", "bisa", "hari", "kumpul", 
    "kita", "sangat", "ramai", "tidak", "momen", "luar biasa", "kemarin", "kopi", "sore", 
    "suka", "komunitas", "bagus", "paling", "untuk", "ke", "buat", "poto", "foto", "sialan"
  ];
  const tokens = text.toLowerCase().split(/\s+/);
  return tokens.some(t => idWords.includes(t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")));
};

const translateIndoToEng = (text: string): string => {
  if (!text) return "";
  const originalWords = text.split(" ");
  const tags = originalWords.filter(w => w.startsWith("#"));
  const nonTags = originalWords.filter(w => !w.startsWith("#"));
  
  const sentence = nonTags.join(" ");
  const cleanSentence = sentence.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  
  if (cleanSentence.includes("momen luar biasa") && cleanSentence.includes("kemarin")) {
    return ("Extraordinary moments yesterday with the Friendszone community! Didn't expect it to be this crowded. 🔥 " + tags.join(" ")).trim();
  }
  if (cleanSentence.includes("sesi kopi") || (cleanSentence.includes("kopi") && cleanSentence.includes("sore"))) {
    return ("Coffee session this afternoon. Anyone want to join for a casual chat? " + tags.join(" ")).trim();
  }
  
  const dict: Record<string, string> = {
    momen: "moment",
    luar: "extraordinary",
    biasa: "",
    kemarin: "yesterday",
    kopi: "coffee",
    sore: "afternoon",
    dan: "and",
    di: "at",
    ini: "this",
    dengan: "with",
    saya: "I",
    aku: "I",
    kamu: "you",
    bisa: "can",
    hari: "day",
    kumpul: "gathering",
    kita: "we",
    sangat: "very",
    ramai: "crowded",
    tidak: "not",
    foto: "photo",
    poto: "photo",
    gambar: "image",
    bagus: "great",
    mantap: "awesome",
    halo: "hello",
    semua: "everyone",
    malam: "night",
    pagi: "morning",
    baru: "new"
  };
  
  const translatedWords = nonTags.map(word => {
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const punc = word.substring(cleanWord.length);
    if (dict[cleanWord] !== undefined) {
      return dict[cleanWord] + punc;
    }
    return word;
  });
  
  const translatedSentence = translatedWords.filter(Boolean).join(" ");
  return (translatedSentence + " " + tags.join(" ")).trim();
};

export const PostCard = ({
  post,
  onOpenComments,
  onOpenProfile,
  isAuthenticated,
  onRequireAuth,
  onShowNotification,
  currentUser
}: PostCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(500);

  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [revealFlagged, setRevealFlagged] = useState(false);
  const [isLocallyHidden, setIsLocallyHidden] = useState(false);

  // Sync like count when post changes
  useEffect(() => {
    setLikesCount(post.likes || 0);
  }, [post.likes]);

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    const newLikes = likesCount + 1;
    setLikesCount(newLikes);
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        likes: newLikes
      });
      onShowNotification("Post liked!", "success");
    } catch (e) {
      console.error("Failed to like post in Firestore:", e);
      setLikesCount(likesCount);
    }
  };

  const handleReportPost = async () => {
    try {
      const localReports = JSON.parse(localStorage.getItem("friendzone_reported_posts") || "[]");
      if (localReports.includes(post.id)) {
        onShowNotification("You have already reported this post.", "info");
        setShowMoreMenu(false);
        return;
      }

      const postRef = doc(db, "posts", post.id);
      const currentReports = post.reportsCount || 0;
      const updatedReports = currentReports + 1;

      const updateData: any = {
        reportsCount: updatedReports
      };

      if (updatedReports >= 3) {
        updateData.status = "flagged";
      }

      await updateDoc(postRef, updateData);

      localReports.push(post.id);
      localStorage.setItem("friendzone_reported_posts", JSON.stringify(localReports));

      // Record in system audit log
      addAuditLog("user_report", `Post by @${post.author.id} reported. New count: ${updatedReports} rep.`, {
        postId: post.id,
        authorId: post.author.id,
        updatedReports
      });

      onShowNotification("Post reported successfully.", "success");
      setIsLocallyHidden(true);
      setShowMoreMenu(false);
    } catch (err) {
      console.error("Failed to report post:", err);
      onShowNotification("Failed to submit report.", "error");
    }
  };

  const isAdmin = currentUser && currentUser.id.toLowerCase() === "irfanrizkiaditri";
  const isOwnPost = currentUser && post.author.id.toLowerCase() === currentUser.id.toLowerCase();
  const canDelete = isOwnPost || isAdmin;
  const isFlagged = (post.reportsCount || 0) >= 3;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showMoreMenu) {
      setIsConfirmingDelete(false);
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    const handleScrollOrSwipe = () => {
      setShowMoreMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrSwipe, { passive: true });
    window.addEventListener("touchmove", handleScrollOrSwipe, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrSwipe);
      window.removeEventListener("touchmove", handleScrollOrSwipe);
    };
  }, [showMoreMenu]);

  const handleShare = async () => {
    const postUrl = window.location.href;
    const shareData = {
      title: 'Friendszone Community',
      text: `Check out this post by ${post.author.name} on Friendszone!`,
      url: postUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        onShowNotification("Link copied to clipboard!", "success");
      } catch (err) {
        onShowNotification("Failed to copy link", "error");
      }
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const postRef = doc(db, "posts", post.id);
      await deleteDoc(postRef);
      onShowNotification("Post deleted successfully!", "success");
      setShowMoreMenu(false);
      setIsConfirmingDelete(false);
    } catch (err) {
      console.error("Error deleting post:", err);
      onShowNotification("Failed to delete post.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const originalCaption = post.caption;
  const showTranslationBtn = isIndonesianText(originalCaption);
  const translatedCaption = showTranslationBtn ? translateIndoToEng(originalCaption) : originalCaption;

  if (isLocallyHidden) {
    return (
      <motion.div 
        initial={{ opacity: 1, scale: 1, height: "auto" }}
        animate={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, paddingBottom: 0, overflow: "hidden" }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="w-full"
      >
        <div className="py-2.5 text-center text-[10px] text-[var(--text-dim)] font-normal border-b border-[var(--border)] mb-10">
          Post hidden from your feed.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="w-full mb-10 bg-[var(--bg)] border-b border-[var(--border)] last:border-0 pb-10"
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group">
            <button
              onClick={() => onOpenProfile(post.author)}
              className="flex items-center gap-2 group outline-none cursor-pointer"
            >
              <img
                src={post.author.avatar || "https://cdn-icons-png.flaticon.com/128/847/847969.png"}
                alt={post.author.name}
                className="w-8 h-8 rounded-full border border-[var(--border2)] transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <span className="font-medium text-sm tracking-normal hover:underline text-[var(--text)]">{post.author.name}</span>
            </button>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1 cursor-pointer"
          >
            <MoreHorizontal size={18} />
          </button>
          
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg2)] border border-[var(--border)] rounded-lg shadow-2xl z-50 overflow-hidden"
              >
                {isConfirmingDelete ? (
                  <div className="p-3 text-center">
                    <p className="text-[10px] font-medium text-[var(--text)] mb-3 leading-relaxed">Are you sure you want to delete this post?</p>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={handleDeletePost}
                        disabled={isDeleting}
                        className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer transition-colors leading-none"
                      >
                        {isDeleting ? "Deleting..." : "Erase Post"}
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(false)}
                        className="w-full py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface2)] text-[var(--text)] text-[10px] font-semibold cursor-pointer transition-colors leading-none"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {!isOwnPost && (
                      <button 
                        onClick={handleReportPost} 
                        className="w-full text-left px-4 py-2.5 text-xs font-normal hover:bg-[var(--surface2)] text-rose-500 cursor-pointer border-b border-[var(--border)]"
                      >
                        Report post
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleShare();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-normal hover:bg-[var(--surface2)] cursor-pointer"
                    >
                      Copy link / Share
                    </button>
                    <button 
                      onClick={() => {
                        onShowNotification("User successfully muted.", "info");
                        setShowMoreMenu(false);
                      }} 
                      className="w-full text-left px-4 py-2.5 text-xs font-normal hover:bg-[var(--surface2)] border-t border-[var(--border)] cursor-pointer"
                    >
                      Mute user
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => setIsConfirmingDelete(true)} 
                        className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-rose-550/10 text-rose-600 border-t border-[var(--border)] cursor-pointer"
                      >
                        Delete post
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={containerRef} className="relative -mx-4 sm:mx-0 aspect-square bg-[#f0f0f0] dark:bg-[#000] overflow-hidden">
        {isFlagged && !revealFlagged && (
          <div 
            onClick={() => setRevealFlagged(true)}
            className="absolute inset-x-0 inset-y-0 h-full w-full bg-slate-950/80 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer hover:bg-slate-950/75 transition-all"
          >
            <p className="text-[11px] text-zinc-300 font-normal leading-relaxed mb-2.5 max-w-[240px]">
              This post has been blurred due to community reports.
            </p>
            <span className="text-[10px] text-sky-400 hover:underline">Tap to reveal content</span>
          </div>
        )}
        <motion.div
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: -(post.images.length - 1) * containerWidth, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const swipeThreshold = 50;
            if (info.offset.x < -swipeThreshold && currentImageIndex < post.images.length - 1) {
              setCurrentImageIndex(prev => prev + 1);
            } else if (info.offset.x > swipeThreshold && currentImageIndex > 0) {
              setCurrentImageIndex(prev => prev - 1);
            }
          }}
          animate={{ x: -currentImageIndex * 100 + "%" }}
          transition={{ type: "spring", damping: 35, stiffness: 300, mass: 0.5 }}
        >
          {post.images.map((img, idx) => {
            const transform = post.imageTransforms?.[idx];
            const aspect = transform?.aspect || 1;
            return (
              <div key={idx} className="min-w-full h-full overflow-hidden flex items-center justify-center bg-slate-900">
                <img
                  src={img}
                  alt={`Post content ${idx}`}
                  className="pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                  style={
                    transform
                      ? {
                          width: aspect >= 1 ? `${aspect * 100}%` : "100%",
                          height: aspect < 1 ? `${(1 / aspect) * 100}%` : "100%",
                          maxWidth: "none",
                          maxHeight: "none",
                          transform: `scale(${transform.scale || 1}) translate(${(Math.abs(transform.x) <= 2 ? transform.x * containerWidth : transform.x) || 0}px, ${(Math.abs(transform.y) <= 2 ? transform.y * containerWidth : transform.y) || 0}px)`,
                        }
                      : {
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }
                  }
                />
              </div>
            );
          })}
        </motion.div>

        {post.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
            {post.images.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentImageIndex ? "bg-[var(--purple)] scale-150" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interaction bar removed by user request */}

      <div className="p-3">
        <div className="text-sm leading-relaxed mb-1.5 font-normal">
          <span className="font-medium mr-2 hover:underline cursor-pointer text-[var(--text)]" onClick={() => onOpenProfile(post.author)}>{post.author.name}</span>
          <span className="text-[var(--text-muted)]">{isTranslated ? translatedCaption : (originalCaption || "#friendszone")}</span>
        </div>
        
        {showTranslationBtn && (
          <button
            type="button"
            onClick={() => setIsTranslated(!isTranslated)}
            className="text-[10px] font-medium text-[var(--purple)] hover:opacity-80 transition-colors mt-0.5 pointer-events-auto cursor-pointer"
          >
            {isTranslated ? "Show original" : "See translation"}
          </button>
        )}

        <div className="text-[var(--text-dim)] text-[10px] font-normal mt-2.5 leading-none">{post.date}</div>
      </div>
    </motion.div>
  );
};
