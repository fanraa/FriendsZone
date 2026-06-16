import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Lock, Trash2, Shield, User, HelpCircle, Eye, CheckCircle2, ShieldAlert, X, Activity } from "lucide-react";
import { Author, Post } from "../types";
import { db } from "../lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { systemAuditLogs, addAuditLog } from "../lib/firebaseCache";

interface SettingsViewProps {
  currentUser: Author | null;
  onBack: () => void;
  onLogout: () => void;
  onShowNotification: (message: string, type?: "success" | "error" | "info") => void;
  posts?: Post[];
}

export const SettingsView = ({
  currentUser,
  onBack,
  onLogout,
  onShowNotification,
  posts = [],
}: SettingsViewProps) => {
  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin Panel Setup for "irfanrizkiaditri"
  const isAdmin = currentUser && currentUser.id.toLowerCase() === "irfanrizkiaditri";
  const deactivatedPosts = posts.filter(p => (p.reportsCount || 0) >= 3);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <p className="text-sm text-[var(--text-dim)]">Please log in to access settings.</p>
      </div>
    );
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      onShowNotification("Please fill in all password fields", "error");
      return;
    }

    if (newPassword.length < 8) {
      onShowNotification("New password must be at least 8 characters", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      onShowNotification("New passwords do not match!", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const userDocRef = doc(db, "users", currentUser.id);
      const curPassword = (currentUser as any).password;

      if (curPassword && oldPassword !== curPassword) {
        onShowNotification("Current password is incorrect!", "error");
        setIsChangingPassword(false);
        return;
      }

      await updateDoc(userDocRef, {
        password: newPassword,
      });

      (currentUser as any).password = newPassword;

      onShowNotification("Password changed successfully!", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      onShowNotification("Failed to update password in database", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const curPassword = (currentUser as any).password;

    if (curPassword && deletePassword !== curPassword) {
      onShowNotification("Incorrect password. Account deletion failed.", "error");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", currentUser.id));
      onShowNotification("Your account has been deleted permanent.", "info");
      onLogout();
    } catch (err) {
      console.error("Delete account error:", err);
      onShowNotification("Failed to delete account.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestorePost = async (postId: string) => {
    setIsRestoring(postId);
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        reportsCount: 0,
        status: "active",
        isRestoredByAdmin: true
      });
      addAuditLog("admin_restore", `Admin restored post "${postId.substring(0, 8)}..." back to public feed.`);
      onShowNotification("Post restored to public feed successfully!", "success");
      setSelectedPost(null);
    } catch (err) {
      console.error("Failed to restore post:", err);
      onShowNotification("Failed to restore post", "error");
    } finally {
      setIsRestoring(null);
    }
  };

  const handleAdminDeletePost = async (postId: string) => {
    setIsDeletingPost(postId);
    try {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);
      addAuditLog("admin_delete", `Admin permanently deleted flagged post "${postId.substring(0, 8)}...".`);
      onShowNotification("Post deleted permanently!", "success");
      setSelectedPost(null);
    } catch (err) {
      console.error("Failed to delete post:", err);
      onShowNotification("Failed to delete post", "error");
    } finally {
      setIsDeletingPost(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] flex flex-col pb-12 text-[var(--text)]">
      {/* Header Bar */}
      <div className="sticky top-0 z-[100] bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] px-4 sm:px-6 md:px-8 py-3 flex items-center gap-4 w-full">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-[var(--surface2)] transition-colors cursor-pointer text-[var(--text)]">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="font-display font-medium text-sm tracking-tight">Settings</h2>
          <p className="text-[10px] text-[var(--text-dim)] font-normal">Manage your account and preferences</p>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 w-full max-w-lg mx-auto px-5 pt-6 flex flex-col gap-6">
        {/* Account Info Box */}
        <div className="bg-[var(--bg2)] rounded-2xl p-4 border border-[var(--border)] flex items-center gap-3.5">
          <img src={currentUser.avatar} className="w-11 h-11 rounded-full object-cover border border-[var(--border)]" alt="Avatar" />
          <div className="text-left">
            <span className="text-xs font-bold font-sans tracking-tight block">{currentUser.name}</span>
            <span className="text-[10px] text-[var(--text-dim)] font-mono">@{currentUser.id}</span>
          </div>
        </div>

        {/* Admin Moderation Panel - Only shown to irfanrizkiaditri */}
        {isAdmin && (
          <div className="bg-[var(--bg)] rounded-2xl border border-[var(--border)] p-5 text-left flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-amber-500" />
              <h3 className="text-xs font-normal text-[var(--text)] tracking-tight">Reported posts ({deactivatedPosts.length})</h3>
            </div>
            <p className="text-[10px] text-[var(--text-dim)] font-normal -mt-1 leading-relaxed">
              These posts are hidden from the feed. Tap a thumbnail to review details, restore visibility, or delete them permanently.
            </p>

            {deactivatedPosts.length > 0 ? (
              <div className="grid grid-cols-4 gap-2.5 mt-1">
                {deactivatedPosts.map((post) => (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-[var(--border)] cursor-pointer group relative hover:opacity-85 transition-all"
                  >
                    <img 
                      src={post.images[0] || "https://picsum.photos/seed/default/300/300"} 
                      alt="Reported thumbnail" 
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={12} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[var(--text-dim)] text-[10px] bg-[var(--bg2)] rounded-xl border border-[var(--border)] font-normal">
                No reported posts found. Safe and clean!
              </div>
            )}

            {/* Real-time Audit Log Segment */}
            <div className="border-t border-[var(--border)] pt-4 mt-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[var(--purple)]" />
                  <span className="text-xs font-normal text-[var(--text)] tracking-tight">Moderation Audit Logs</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">RAM Session Live</span>
              </div>
              <p className="text-[10px] text-[var(--text-dim)] leading-relaxed font-normal">
                Tracks skin-density image analyses, database bypass rates, community report flags, and action triggers.
              </p>

              <div className="max-h-[140px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg2)] divide-y divide-[var(--border)] flex flex-col scrollbar-thin">
                {systemAuditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 flex flex-col gap-0.5 text-[10px] leading-relaxed">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-semibold tracking-wider ${
                        log.type === "scan" ? "bg-sky-500/10 text-sky-500" :
                        log.type === "user_report" ? "bg-rose-500/10 text-rose-500" :
                        log.type === "admin_restore" ? "bg-emerald-500/10 text-emerald-500" :
                        log.type === "admin_delete" ? "bg-rose-500/10 text-rose-500" :
                        "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-[9.5px] text-[var(--text-dim)] font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[var(--text-muted)] font-normal mt-0.5">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Change Password Card */}
        <div className="bg-[var(--bg)] rounded-2xl border border-[var(--border)] p-5 text-left flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[var(--purple)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Change Password</h3>
          </div>
          
          <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-3.5 mt-2">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-dim)] block mb-1">Current Password</label>
              <input
                type="password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-xs text-[var(--text)] outline-none focus:border-[var(--purple)] transition-all"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[var(--text-dim)] block mb-1">New Password</label>
              <input
                type="password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-xs text-[var(--text)] outline-none focus:border-[var(--purple)] transition-all"
                placeholder="Preferred minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[var(--text-dim)] block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg2)] text-xs text-[var(--text)] outline-none focus:border-[var(--purple)] transition-all"
                placeholder="Retype new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-2 w-full py-2.5 rounded-xl bg-[var(--purple)] hover:bg-[var(--purple-hover)] text-white text-xs font-bold shadow-md hover:scale-[1.01] transition-all cursor-pointer leading-none flex items-center justify-center gap-1.5"
            >
              <Shield size={14} />
              {isChangingPassword ? "Saving..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Delete Account Card */}
        <div className="bg-[var(--bg)] rounded-2xl border border-rose-100/50 dark:border-rose-950/20 p-5 text-left flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">Danger Zone</h3>
          </div>
          
          <div className="mt-1">
            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
              Once you delete your account, all your data, posts, comments, and profile details will be permanently removed from FriendsZone. There is no recovery.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-2 w-full py-2.5 rounded-xl border border-rose-300 hover:bg-rose-550/10 text-rose-600 dark:text-rose-500 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccountSubmit} className="flex flex-col gap-3 mt-2 animate-fade-in">
              <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-950/30">
                <p className="text-[10px] text-rose-700 dark:text-rose-450 font-medium">
                  Confirm your password below to permanently erase your profile.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-rose-600 block mb-1">Enter your password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-[var(--bg2)] text-xs text-[var(--text)] outline-none focus:border-rose-450 transition-all"
                  placeholder="Password confirmation"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                  }}
                  className="py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface2)] text-[var(--text)] text-xs font-semibold cursor-pointer transition-all leading-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 leading-none"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Deleting..." : "Erase Permanent"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Admin Reported Detail Modal Overlay */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl text-left flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
                <span className="text-[10px] text-[var(--text-dim)] font-mono">reported post review</span>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-1 rounded-full text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-900 border border-[var(--border)] relative">
                  <img 
                    src={selectedPost.images[0]} 
                    alt="Review content" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="bg-[var(--bg2)] p-3 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <img 
                      src={selectedPost.author.avatar} 
                      alt={selectedPost.author.name} 
                      className="w-4 h-4 rounded-full border border-[var(--border)]"
                    />
                    <span className="text-[10px] font-medium text-[var(--text)]">@{selectedPost.author.id}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {selectedPost.caption || "no caption provided."}
                  </p>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <span className="text-[9px] text-[var(--text-dim)] font-normal uppercase tracking-wider">Reports:</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-semibold">
                    {selectedPost.reportsCount || 1} report(s)
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isRestoring === selectedPost.id || isDeletingPost === selectedPost.id}
                  onClick={() => handleRestorePost(selectedPost.id)}
                  className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface2)] text-[11px] font-normal text-[var(--text-muted)] cursor-pointer transition-all leading-none flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  {isRestoring === selectedPost.id ? "Restoring..." : "Restore post"}
                </button>
                <button
                  type="button"
                  disabled={isRestoring === selectedPost.id || isDeletingPost === selectedPost.id}
                  onClick={() => handleAdminDeletePost(selectedPost.id)}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-normal cursor-pointer transition-all leading-none flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  {isDeletingPost === selectedPost.id ? "Deleting..." : "Delete permanent"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
