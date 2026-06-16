import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Info, User, Globe, Pencil } from "lucide-react";
import { Author, Post } from "../types";
import { PostCard } from "../components/feed/PostCard";
import { compressImageBase64 } from "../utils/imageCompressor";

interface ProfileViewProps {
  author: Author;
  onBack: () => void;
  onOpenComments: (post: Post) => void;
  onOpenProfile: (author: Author) => void;
  currentUser: Author | null;
  onPreviewAvatar: (author: Author) => void;
  onShowNotification: (m: string, t?: any) => void;
  posts: Post[];
  onUpdateProfile?: (updatedData: Partial<Author>) => void;
}

export const ProfileView = ({ 
  author, 
  onBack, 
  onOpenComments, 
  onOpenProfile, 
  currentUser,
  onPreviewAvatar,
  onShowNotification,
  posts,
  onUpdateProfile
}: ProfileViewProps) => {
  const userPosts = posts.filter(p => p.author.id === author.id);
  const isMyProfile = currentUser?.id === author.id;

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(author.name);
  const [editBio, setEditBio] = useState(author.bio || "");
  const [editAvatar, setEditAvatar] = useState(author.avatar);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          onShowNotification("Compressing image...", "info");
          const compressedBase64 = await compressImageBase64(rawBase64, 1000, 350, 0.7);
          if (onUpdateProfile) {
            onUpdateProfile({ banner: compressedBase64 });
            onShowNotification("Banner updated successfully!", "success");
          }
        } catch (err) {
          onShowNotification("Failed to process banner", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync edits when author changes
  useEffect(() => {
    setEditName(author.name);
    setEditBio(author.bio || "");
    setEditAvatar(author.avatar);
  }, [author]);

  // Prevent background scrolling when preview is open
  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isPreviewOpen]);

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    } else {
      setIsPreviewOpen(true);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          onShowNotification("Compressing image...", "info");
          const compressedBase64 = await compressImageBase64(rawBase64, 300, 300, 0.8);
          setEditAvatar(compressedBase64);
          if (onUpdateProfile) {
            onUpdateProfile({ avatar: compressedBase64 });
            onShowNotification("Profile picture updated successfully!", "success");
          }
        } catch (err) {
          onShowNotification("Failed to compress avatar", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInlineSave = () => {
    if (!editName.trim()) {
      onShowNotification("Name cannot be empty!", "error");
      return;
    }
    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim().slice(0, 30),
        bio: editBio.trim().slice(0, 120),
        avatar: editAvatar,
      });
    }
    setIsEditing(false);
    onShowNotification("Profile updated successfully!", "success");
  };

  const handleCancel = () => {
    setEditName(author.name);
    setEditBio(author.bio || "");
    setEditAvatar(author.avatar);
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-full overflow-x-hidden min-h-screen bg-[var(--bg)] flex flex-col pb-10"
    >
      {/* Header Bar - Fully edge to edge */}
      <div className="sticky top-0 z-[100] bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] px-4 sm:px-6 md:px-8 py-3 flex items-center gap-4 w-full">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-[var(--surface2)] transition-colors cursor-pointer text-[var(--text)]">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="font-display font-medium text-sm tracking-tight text-[var(--text)]">{author.name}</h2>
          <p className="text-[10px] text-[var(--text-dim)] font-normal">{userPosts.length} posts</p>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col">
        {/* Banner - Fully edge to edge with slightly taller height for beautiful look on desktop */}
        <div className="relative h-40 md:h-52 bg-[var(--bg2)] w-full overflow-hidden border-b border-[var(--border)]">
          {author.banner && (
            <img 
              src={author.banner} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
              alt="Banner"
            />
          )}
          {isMyProfile && (
            <>
              <button 
                onClick={() => bannerFileInputRef.current?.click()}
                className="absolute bottom-3 right-4 text-white hover:text-slate-200 transition-colors cursor-pointer p-1 focus:outline-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10"
                title="Change Banner"
              >
                <Pencil size={18} />
              </button>
              <input 
                type="file" 
                ref={bannerFileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleBannerChange} 
              />
            </>
          )}
        </div>

        {/* Content below banner is nicely centered at max-w-lg to keep spacing and fields elegant */}
        <div className="w-full max-w-lg mx-auto flex flex-col">
          {/* Profile Details Container */}
          <div className="w-full bg-[var(--bg)] px-5 relative pb-6 text-center flex flex-col items-center">
            
            {/* Avatar & Overlapping Edit Button */}
            <div className="relative -mt-14 mb-4 flex flex-col items-center">
               <button 
                 onClick={handleAvatarClick} 
                 className={`block outline-none rounded-full relative z-0 ${isEditing ? "cursor-pointer group overflow-hidden" : "cursor-zoom-in"}`}
               >
                 <motion.img 
                   whileTap={{ scale: 0.95 }}
                   src={isEditing ? editAvatar : author.avatar} 
                   className="w-28 h-28 rounded-full border-4 border-[var(--bg)] shadow-md hover:brightness-95 transition-all object-cover" 
                   referrerPolicy="no-referrer" 
                   alt={author.name}
                 />
                 {isEditing && (
                   <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                     <span className="text-[9px] font-bold uppercase tracking-wider text-white">Change Photo</span>
                   </div>
                 )}
               </button>

               {isEditing && (
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handleAvatarChange} 
                 />
               )}

               {/* Overlapping Edit Profile Button or Actions (Stacks halfway on the bottom of avatar) */}
               {isMyProfile && (
                 <div className="relative -mt-5 z-10">
                   {!isEditing ? (
                     <button 
                       onClick={() => {
                         setIsEditing(true);
                         setEditName(author.name);
                         setEditBio(author.bio || "");
                       }}
                       className="px-3 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-medium text-blue-600 hover:bg-slate-50 shadow-sm cursor-pointer opacity-100 hover:opacity-100 transition-none duration-0"
                     >
                       Edit Profile
                     </button>
                   ) : (
                     <div className="flex gap-2.5">
                       <button 
                         type="button"
                         onClick={handleCancel}
                         className="px-3 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-medium text-slate-500 hover:bg-slate-50 shadow-sm cursor-pointer opacity-100 hover:opacity-100 transition-none duration-0"
                       >
                         Cancel
                       </button>
                       <button 
                         type="button"
                         onClick={handleInlineSave}
                         className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-medium shadow-sm cursor-pointer opacity-100 hover:opacity-100 transition-none duration-0"
                       >
                         Save
                       </button>
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Editable/Static Name & Bio fields */}
            <div className="w-full max-w-xs flex flex-col items-center">
              {isEditing ? (
                <div className="w-full mb-3">
                  <label className="block text-[8px] font-semibold text-[var(--text-dim)] uppercase tracking-wider text-center mb-0.5">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 30))}
                    placeholder="Full Name"
                    className="w-full bg-[var(--surface2)] border border-[var(--purple)] rounded-xl py-1.5 px-3 text-xs text-[var(--text)] text-center focus:outline-none transition-all font-medium"
                    maxLength={30}
                    required
                  />
                </div>
              ) : (
                <h1 className="text-xl font-display font-medium tracking-tight text-[var(--text)]">{author.name}</h1>
              )}

              {/* Username underneath, NOT editable */}
              <p className="text-[var(--text-dim)] text-[11px] font-normal">@{author.id}</p>
              
              {isEditing ? (
                <div className="w-full mt-2">
                  <label className="block text-[8px] font-semibold text-[var(--text-dim)] uppercase tracking-wider text-center mb-0.5">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 120))}
                    placeholder="Write a short bio..."
                    className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] text-center focus:outline-none focus:border-[var(--purple)] transition-all resize-none h-16 font-normal"
                    maxLength={120}
                  />
                </div>
              ) : (
                author.bio && (
                  <p className="mt-2.5 text-xs text-[var(--text-muted)] font-normal leading-relaxed text-center">
                    {author.bio}
                  </p>
                )
              )}
            </div>
            
            {/* Metadata: Location, Gender, Joined */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 text-[var(--text-dim)] text-[10px] font-normal">
               {author.location && (
                 <div className="flex items-center gap-1.5">
                   <Info size={11} className="opacity-70" /> {author.location}
                 </div>
               )}
               {author.gender && (
                 <div className="flex items-center gap-1.5">
                   <User size={11} className="opacity-70" /> {author.gender}
                 </div>
               )}
               <div className="flex items-center gap-1.5">
                 <Globe size={11} className="opacity-70" /> Joined {author.joinedDate}
               </div>
            </div>
          </div>

          {/* Divider with Posts header */}
          <div className="w-full border-t border-[var(--border)] py-3 px-4">
             <h2 className="text-xs font-semibold tracking-tight text-[var(--text)] text-left uppercase text-[var(--text-dim)]">Posts</h2>
          </div>

          {/* Posts list inside container just like Feed */}
          <div className="w-full divide-y divide-[var(--border)] bg-[var(--bg)] min-h-screen px-4 sm:px-0">
            {userPosts.length > 0 ? (
              userPosts.map(p => (
                <PostCard 
                  key={p.id} 
                  post={p} 
                  onOpenComments={onOpenComments} 
                  onOpenProfile={onOpenProfile} 
                  isAuthenticated={true} 
                  onRequireAuth={() => {}}
                  onShowNotification={onShowNotification}
                  currentUser={currentUser}
                />
              ))
            ) : (
              <div className="py-20 text-center text-[var(--text-dim)] font-normal text-xs opacity-50">
                Belum ada kiriman
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Circular Avatar Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[6000] cursor-zoom-out"
            />
            {/* Centered Circular image container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 m-auto w-72 h-72 sm:w-85 sm:h-85 z-[6001] flex items-center justify-center pointer-events-none"
            >
              <img
                src={author.avatar}
                alt={author.name}
                className="w-full h-full rounded-full border-4 border-white shadow-2xl object-cover pointer-events-auto aspect-square"
                onClick={(e) => e.stopPropagation()}
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
