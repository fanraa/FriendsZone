import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { Comment, Author } from "../../types";

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onOpenProfile: (author: Author) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const CommentItem = ({
  comment,
  isReply = false,
  onOpenProfile,
  isAuthenticated,
  onRequireAuth
}: CommentItemProps) => {
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const handleLike = () => {
    if (!isAuthenticated) return onRequireAuth();
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
  };

  const originalText = comment.text;
  const translatedText = "Indonesian: Momen sungguh luar biasa!";

  return (
    <div className={`flex gap-3 ${isReply ? "mt-3 ml-11" : "mt-5"}`}>
      <button onClick={() => onOpenProfile(comment.author)} className="shrink-0">
        <img src={comment.author.avatar} alt={comment.author.name} className={`${isReply ? "w-6 h-6" : "w-8 h-8"} rounded-full`} referrerPolicy="no-referrer" />
      </button>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs leading-relaxed">
            <span className="font-bold mr-2 text-sm hover:underline cursor-pointer" onClick={() => onOpenProfile(comment.author)}>{comment.author.name}</span>
            <span className="text-[var(--text)]">{isTranslated ? translatedText : originalText}</span>
          </div>
          <div className="flex flex-col items-center">
            <button onClick={handleLike} className={`${isLiked ? "text-red-500" : "text-[var(--text-dim)]"} p-1 scale-90`}>
              <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <span className="text-[8px] text-[var(--text-dim)] font-bold">{likeCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-[10px] text-[var(--text-dim)]">{comment.date}</span>
          <button className="text-[10px] font-bold text-[var(--text-dim)]">Reply</button>
          <button
            onClick={() => setIsTranslated(!isTranslated)}
            className="text-[10px] font-bold text-[var(--text-dim)]"
          >
            {isTranslated ? "Original" : "Translate"}
          </button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2 text-[var(--text-dim)] text-[10px] font-bold"
            >
              <div className="w-6 h-[1px] bg-[var(--border)]"></div>
              {showReplies ? "Hide replies" : `View ${comment.replies.length} more replies`}
            </button>
            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {comment.replies.map(r => (
                    <CommentItem
                      key={r.id}
                      comment={r}
                      isReply
                      onOpenProfile={onOpenProfile}
                      isAuthenticated={isAuthenticated}
                      onRequireAuth={onRequireAuth}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
