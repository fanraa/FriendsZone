import React, { useState, useEffect, useRef } from "react";
import { 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  useNavigate,
  Navigate,
  useParams
} from "react-router-dom";
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  User,
  LayoutGrid,
  Info,
  Home,
  MessageSquare,
  Mail,
  Check,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types & Data
import { Author, Post, MOCK_AUTHORS, MOCK_POSTS, COUNTRIES } from "./types";
import { db, seedInitialDataIfNeeded } from "./lib/firebase";
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { syncUsersCache, syncPostsCache, cachedGetDoc } from "./lib/firebaseCache";
import { formatPostDate } from "./utils/time";

// Components
import { VideoBackground } from "./components/common/VideoBackground";
import { PostCard } from "./components/feed/PostCard";
import { CommentItem } from "./components/feed/CommentItem";

// Views
import { LandingView } from "./views/Landing";
import { AboutView } from "./views/About";
import { FeedView } from "./views/Feed";
import { LoginView } from "./views/Login";
import { RegisterView } from "./views/Register";
import { ProfileView } from "./views/Profile";
import { SettingsView } from "./views/Settings";

interface ProfileRouteWrapperProps {
  isLoadingProfile: boolean;
  users: Record<string, Author>;
  activeProfile: Author | null;
  openComments: (post: Post) => void;
  openProfile: (author: Author) => void;
  isAuthenticated: boolean;
  currentUser: Author | null;
  setPreviewAuthor: (author: Author) => void;
  showNotification: (m: string, t?: any) => void;
  enrichedPosts: Post[];
  handleUpdateCurrentUser: (updatedData: Partial<Author>) => void;
}

const ProfileRouteWrapper = ({
  isLoadingProfile,
  users,
  activeProfile,
  openComments,
  openProfile,
  isAuthenticated,
  currentUser,
  setPreviewAuthor,
  showNotification,
  enrichedPosts,
  handleUpdateCurrentUser
}: ProfileRouteWrapperProps) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const matchedUser = React.useMemo(() => {
    if (!userId) return null;
    return users[userId.toLowerCase()] || null;
  }, [userId, users]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full border-t-2 border-[var(--purple)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-dim)] font-normal">Loading profile...</p>
        </div>
      </div>
    );
  }

  const authorToUse = matchedUser || (activeProfile && activeProfile.id.toLowerCase() === userId?.toLowerCase() ? activeProfile : null);

  if (authorToUse) {
    const finalAuthor = {
      ...authorToUse,
      avatar: authorToUse.avatar || "https://cdn-icons-png.flaticon.com/128/847/847969.png",
      banner: authorToUse.banner || "https://images.pexels.com/photos/104673/pexels-photo-104673.jpeg"
    };
    return (
      <ProfileView 
        author={finalAuthor} 
        onBack={() => navigate("/friendszone/feed")} 
        onOpenComments={openComments} 
        onOpenProfile={openProfile} 
        currentUser={isAuthenticated ? currentUser : null}
        onPreviewAvatar={setPreviewAuthor}
        onShowNotification={showNotification}
        posts={enrichedPosts}
        onUpdateProfile={handleUpdateCurrentUser}
      />
    );
  } else {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-t-2 border-[var(--purple)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-dim)] font-normal">Fetching member profile...</p>
        </div>
      </div>
    );
  }
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [activeProfile, setActiveProfile] = useState<Author | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [previewAuthor, setPreviewAuthor] = useState<Author | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("friendszone_isAuthenticated") === "true";
  });
  const [currentUser, setCurrentUser] = useState<Author>(() => {
    const savedUser = localStorage.getItem("friendszone_currentUser");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return MOCK_AUTHORS["andi"];
      }
    }
    return MOCK_AUTHORS["andi"];
  });

  const [users, setUsers] = useState<Record<string, Author>>({});

  // Real-time Firestore users collection listener
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const uMap: Record<string, Author> = {};
      snapshot.forEach((doc) => {
        const u = doc.data() as Author;
        uMap[doc.id.toLowerCase()] = {
          ...u,
          avatar: u.avatar || "https://cdn-icons-png.flaticon.com/128/847/847969.png",
          banner: u.banner || "https://images.pexels.com/photos/104673/pexels-photo-104673.jpeg"
        };
      });
      setUsers(uMap);
      syncUsersCache(uMap);
    });
    return () => unsubUsers();
  }, []);

  // Keep local storage / current user session automatically up to date on Firestore profile edits
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.id) {
      const latestUser = users[currentUser.id.toLowerCase()];
      if (latestUser) {
        if (
          latestUser.name !== currentUser.name ||
          latestUser.avatar !== currentUser.avatar ||
          latestUser.banner !== currentUser.banner ||
          latestUser.bio !== currentUser.bio
        ) {
          setCurrentUser(latestUser);
        }
      }
    }
  }, [users, isAuthenticated, currentUser]);

  const [confirmMobileSignOut, setConfirmMobileSignOut] = useState(false);
  const [confirmDesktopSignOut, setConfirmDesktopSignOut] = useState(false);

  useEffect(() => {
    localStorage.setItem("friendszone_isAuthenticated", String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("friendszone_currentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setConfirmMobileSignOut(false);
    }
  }, [isMobileMenuOpen]);

  const handleUpdateCurrentUser = async (updatedData: Partial<Author>) => {
    const updatedUser = { ...currentUser, ...updatedData };
    setCurrentUser(updatedUser);
    
    // Optimistically update the central users cache map so we render changes instantly
    setUsers((prev) => ({
      ...prev,
      [currentUser.id.toLowerCase()]: {
        ...(prev[currentUser.id.toLowerCase()] || {}),
        ...updatedUser
      }
    }));
    
    // Update active profile if currently looking at it
    if (activeProfile?.id === currentUser.id) {
      setActiveProfile(updatedUser);
    }

    try {
      const userDocRef = doc(db, "users", currentUser.id);
      await setDoc(userDocRef, updatedUser, { merge: true });
    } catch (e) {
      console.error("Firestore user profile save error:", e);
    }
  };

  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isProfileDropdownOpen) {
      setConfirmDesktopSignOut(false);
    }
  }, [isProfileDropdownOpen]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  const handleSendComment = async () => {
    if (!activeCommentPost || !newCommentText.trim() || !isAuthenticated) return;
    
    const newComment = {
      id: "c_" + Date.now(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      text: newCommentText.trim(),
      likes: 0,
      date: "Just now"
    };

    const updatedCommentList = [...(activeCommentPost.commentList || []), newComment];
    
    try {
      const postRef = doc(db, "posts", activeCommentPost.id);
      await updateDoc(postRef, {
        commentList: updatedCommentList,
        comments: updatedCommentList.length
      });
      
      setActiveCommentPost({
        ...activeCommentPost,
        commentList: updatedCommentList,
        comments: updatedCommentList.length
      });
      
      setNewCommentText("");
      showNotification("Comment added!", "success");
    } catch (e) {
      console.error("Firestore comment write failed:", e);
      showNotification("Failed to post comment", "error");
    }
  };

  // Real-time Firestore Posts Sync
  useEffect(() => {
    seedInitialDataIfNeeded();

    const unsub = onSnapshot(collection(db, "posts"), (snapshot) => {
      const fetched: Post[] = [];
      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        fetched.push({
          id: snapDoc.id,
          author: data.author as Author,
          images: data.images || [],
          caption: data.caption || "",
          likes: data.likes || 0,
          comments: data.comments || 0,
          date: data.date || "Just now",
          commentList: data.commentList || [],
          imageTransforms: data.imageTransforms || [],
          createdAt: data.createdAt,
          reportsCount: data.reportsCount || 0,
          reportedBy: data.reportedBy || [],
          status: data.status || "active",
          isRestoredByAdmin: data.isRestoredByAdmin || false
        } as Post);
      });
      
      // Chronological sort: newest first
      fetched.sort((a: any, b: any) => {
        const timeA = a.createdAt || parseInt(a.id) || 0;
        const timeB = b.createdAt || parseInt(b.id) || 0;
        return timeB - timeA;
      });
      setPosts(fetched);
      syncPostsCache(fetched);
    });

    return () => unsub();
  }, []);

  // Dynamic memo to resolve user info (names, avatars, banners) from central synchronized users map
  const enrichedPosts = React.useMemo(() => {
    return posts.map(post => {
      const authorId = post.author?.id?.toLowerCase();
      const dbUser = authorId ? users[authorId] : null;
      const formattedDate = post.createdAt ? formatPostDate(post.createdAt) : (post.date || "Just now");
      if (dbUser) {
         return {
          ...post,
          date: formattedDate,
          author: {
            ...post.author,
            name: dbUser.name || post.author.name,
            avatar: dbUser.avatar || "https://cdn-icons-png.flaticon.com/128/847/847969.png",
            banner: dbUser.banner || "https://images.pexels.com/photos/104673/pexels-photo-104673.jpeg"
          }
        };
      }
      return {
        ...post,
        date: formattedDate,
        author: {
          ...post.author,
          avatar: post.author.avatar || "https://cdn-icons-png.flaticon.com/128/847/847969.png"
        }
      };
    });
  }, [posts, users]);

  // Registration State Persistence
  const [registerStep, setRegisterStep] = useState(1);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(MOCK_AUTHORS["andi"]);
    localStorage.removeItem("friendszone_isAuthenticated");
    localStorage.removeItem("friendszone_currentUser");
    setRegisterStep(1);
    setRegisterFormData({
      username: "",
      name: "",
      country: COUNTRIES[0],
      customDialCode: "+",
      phone: "",
      birthDate: { day: "", month: "", year: "" },
      gender: "Male" as "Male" | "Female" | "Others",
      password: "",
      confirmPassword: ""
    });
    navigate("/friendszone/home");
    showNotification("Logged out successfully", "info");
  };

  const handleLoginSuccess = async (identifier: string, enteredPassword?: string) => {
    const key = identifier.toLowerCase().trim();
    try {
      const userDocRef = doc(db, "users", key);
      const userDoc = await cachedGetDoc(userDocRef);
      if (!userDoc.exists()) {
        showNotification("Account does not exist! Please register.", "error");
        return;
      }

      const userData = userDoc.data() as any;
      if (userData.password && enteredPassword && userData.password !== enteredPassword) {
        showNotification("Incorrect password! Please try again.", "error");
        return;
      }

      let userToUse: Author = userData as Author;
      if (!userToUse.avatar) {
        userToUse.avatar = "https://cdn-icons-png.flaticon.com/128/847/847969.png";
      }
      if (!userToUse.banner) {
        userToUse.banner = "https://images.pexels.com/photos/104673/pexels-photo-104673.jpeg";
      }
      if (!userToUse.name) {
        userToUse.name = "user@" + Math.floor(1000 + Math.random() * 9000);
      }

      setCurrentUser(userToUse);
      setIsAuthenticated(true);
      navigate("/friendszone/feed");
      showNotification("Welcome back!", "success");
    } catch (e) {
      console.error("Firestore loading login credentials failed, fallback:", e);
      // Fallback
      const userToUse: Author = {
        id: key,
        name: "user@" + Math.floor(1000 + Math.random() * 9000),
        avatar: "https://cdn-icons-png.flaticon.com/128/847/847969.png",
        banner: "https://images.pexels.com/photos/104673/pexels-photo-104673.jpeg",
        bio: "Connect with friends, share memories, and search for people around you.",
        joinedDate: "Jun 2026",
        location: "Global",
        gender: "Others"
      };
      setCurrentUser(userToUse);
      setIsAuthenticated(true);
      navigate("/friendszone/feed");
      showNotification("Welcome back!", "success");
    }
  };

  const handleRegisterSuccess = async () => {
    const handle = registerFormData.username.toLowerCase().trim();
    const newUser: Author & { password?: string } = {
      id: handle || "user_" + Date.now(),
      name: registerFormData.name ? registerFormData.name.trim() : "user@" + Math.floor(1000 + Math.random() * 9000),
      avatar: "https://cdn-icons-png.flaticon.com/128/847/847969.png",
      banner: "https://images.pexels.com/photos/104673/pexels-photo-104673.jpeg",
      bio: "New member of the Friendszone community!",
      joinedDate: "Jun 2026",
      location: registerFormData.country?.name || "Global",
      gender: ((registerFormData.gender as string) === "Other" ? "Others" : registerFormData.gender) as "Male" | "Female" | "Others",
      password: registerFormData.password // Save the password field in the user document!
    };
    try {
      await setDoc(doc(db, "users", newUser.id), newUser);
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      navigate("/friendszone/feed");
      showNotification("Welcome to the community!", "success");
    } catch (e) {
      console.error("Error creating user profile in Firestore:", e);
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      navigate("/friendszone/feed");
      showNotification("Welcome to the community!", "success");
    }
  };

  const [registerFormData, setRegisterFormData] = useState({
    username: "",
    name: "",
    country: COUNTRIES[0],
    customDialCode: "+",
    phone: "",
    birthDate: { day: "", month: "", year: "" },
    gender: "Male" as "Male" | "Female" | "Others",
    password: "",
    confirmPassword: ""
  });

  const platformRef = useRef<HTMLElement>(null);

  // Scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Lock body scroll when overlays active
  useEffect(() => {
    if (isMobileMenuOpen || activeCommentPost || previewAuthor || isPageLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileMenuOpen, activeCommentPost, previewAuthor, isPageLoading]);

  // Route change loading simulation
  useEffect(() => {
    if (location.pathname === "/friendszone/login" || location.pathname === "/friendszone/register") {
      setIsPageLoading(false);
      window.scrollTo(0, 0);
      return;
    }

    setIsPageLoading(true);
    
    // Scroll to the top after a small delay (200ms) when the skeleton loader has 
    // already faded in and is fully opaque, so the user doesn't see an unwanted scrolling jump 
    // on the background of the original page.
    const scrollTimer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 200);

    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const showNotification = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openProfile = (author: Author) => {
    if (location.pathname === `/friendszone/profile/${author.id}`) {
      return;
    }
    setIsLoadingProfile(true);
    setActiveProfile(author);
    const isAlreadyOnProfilePage = location.pathname.startsWith("/friendszone/profile/");
    navigate(`/friendszone/profile/${author.id}`, { replace: isAlreadyOnProfilePage });
    setTimeout(() => setIsLoadingProfile(false), 800);
  };

  const openComments = (post: Post) => {
    setIsLoadingComments(true);
    setActiveCommentPost(post);
    setTimeout(() => setIsLoadingComments(false), 800);
  };

  const scrollToPlatforms = () => {
    if (location.pathname !== "/friendszone/home") {
      navigate("/friendszone/home");
      setTimeout(() => {
        platformRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    } else {
      platformRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const SkeletonLoader = () => {
    if (location.pathname === "/friendszone/about") {
      return (
        <div className="absolute inset-0 bg-[var(--bg)] min-h-screen z-[2000] overflow-y-auto no-scrollbar">
          {/* About Header Scenic Skeleton */}
          <div className="relative min-h-[45vh] flex flex-col items-center justify-center px-5 py-20 text-center border-b border-[var(--border)] overflow-hidden bg-slate-900/5">
            {/* Centered Story Title Skeleton */}
            <div className="h-10 w-44 rounded-lg skeleton-shimmer mb-4 shrink-0" />
            {/* Centered Subtitle line Skeleton */}
            <div className="h-3.5 w-5/6 max-w-sm rounded skeleton-shimmer shrink-0" />
          </div>

          <div className="max-w-5xl mx-auto px-5 pt-12 space-y-20 pb-20">
            {/* Mission Section Skeleton */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-6 md:p-10 shadow-sm space-y-4">
              <div className="h-3 w-20 rounded skeleton-shimmer" />
              <div className="h-8 w-60 md:w-80 rounded-lg skeleton-shimmer" />
              <div className="space-y-2 mt-2">
                <div className="h-3.5 w-full rounded skeleton-shimmer" />
                <div className="h-3.5 w-full rounded skeleton-shimmer" />
                <div className="h-3.5 w-5/6 rounded skeleton-shimmer" />
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="h-20 rounded-lg skeleton-shimmer" />
                <div className="h-20 rounded-lg skeleton-shimmer" />
              </div>
            </div>

            {/* Timeline Section Skeleton */}
            <div className="space-y-6">
              <div className="h-6 w-32 rounded skeleton-shimmer" />
              <div className="space-y-8 pl-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4 items-start">
                    <div className="w-4 h-4 rounded-full skeleton-shimmer mt-1 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-16 rounded skeleton-shimmer" />
                      <div className="h-5 w-48 rounded skeleton-shimmer" />
                      <div className="h-3.5 w-full rounded skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Section Skeleton */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="h-6 w-40 rounded skeleton-shimmer" />
                <div className="h-3 w-24 rounded skeleton-shimmer" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[220px]">
                <div className="col-span-2 row-span-2 rounded-xl skeleton-shimmer" />
                <div className="rounded-xl skeleton-shimmer" />
                <div className="rounded-xl skeleton-shimmer" />
                <div className="row-span-2 rounded-xl skeleton-shimmer" />
                <div className="row-span-2 rounded-xl skeleton-shimmer" />
                <div className="rounded-xl skeleton-shimmer" />
                <div className="rounded-xl skeleton-shimmer" />
              </div>
            </div>

            {/* What We Believe In Section Skeleton */}
            <div className="space-y-6">
              <div className="h-6 w-48 mx-auto rounded skeleton-shimmer" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-6 rounded-xl border border-[var(--border)] bg-white space-y-3">
                    <div className="w-8 h-8 rounded skeleton-shimmer" />
                    <div className="h-5 w-24 rounded skeleton-shimmer" />
                    <div className="h-3.5 w-full rounded skeleton-shimmer" />
                    <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* CTA Section Skeleton */}
            <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-8 md:p-12 space-y-4 flex flex-col items-center">
              <div className="h-7 w-64 rounded skeleton-shimmer" />
              <div className="h-4 w-48 rounded skeleton-shimmer" />
              <div className="h-10 w-32 rounded-lg skeleton-shimmer mt-2" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 bg-[var(--bg)] min-h-screen z-[2000] overflow-y-auto no-scrollbar">
        {/* Hero Section Skeleton */}
        <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-5 py-20 text-center border-b border-[var(--border)] overflow-hidden">
          {/* Logo circle */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full skeleton-shimmer mb-6 shrink-0" />
          
          {/* Welcome to */}
          <div className="h-4 w-24 rounded skeleton-shimmer mb-3" />
          
          {/* FriendsZone Title block */}
          <div className="h-10 md:h-14 w-64 md:w-80 rounded-lg skeleton-shimmer mb-5" />
          
          {/* Subtitle desc block */}
          <div className="h-3 w-5/6 max-w-md rounded skeleton-shimmer mb-2" />
          <div className="h-3 w-4/6 max-w-sm rounded skeleton-shimmer mb-8" />
          
          {/* Actions row */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-xs justify-center">
            <div className="h-11 flex-1 rounded-lg skeleton-shimmer" />
            <div className="h-11 flex-1 rounded-lg skeleton-shimmer" />
          </div>
        </div>

        {/* Main Concept Section Skeleton */}
        <div className="max-w-5xl mx-auto px-5 -mt-12 relative z-20 pb-16">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 md:p-10 shadow-lg flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4 w-full">
              <div className="h-3 w-20 rounded skeleton-shimmer" />
              <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
              <div className="space-y-2 mt-2">
                <div className="h-3.5 w-full rounded skeleton-shimmer" />
                <div className="h-3.5 w-full rounded skeleton-shimmer" />
                <div className="h-3.5 w-5/6 rounded skeleton-shimmer" />
              </div>
              <div className="space-y-4 pt-2">
                <div className="h-3.5 w-full rounded skeleton-shimmer" />
                <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
              </div>
              
              <div className="flex gap-8 pt-4">
                <div className="space-y-2">
                  <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
                  <div className="h-3 w-24 rounded skeleton-shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div className="space-y-3 pt-6">
                <div className="h-32 rounded-lg skeleton-shimmer" />
                <div className="h-28 rounded-lg skeleton-shimmer" />
              </div>
              <div className="space-y-3">
                <div className="h-28 rounded-lg skeleton-shimmer" />
                <div className="h-32 rounded-lg skeleton-shimmer" />
              </div>
            </div>
          </div>

          {/* Dynamic bottom stats panel skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[var(--border)] rounded-lg bg-white overflow-hidden mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 flex flex-col items-center gap-2 border-r border-[var(--border)] last:border-0">
                <div className="h-7 w-12 rounded skeleton-shimmer" />
                <div className="h-3.5 w-16 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const CommentSkeleton = () => (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-5 py-3 border-b border-[var(--border)] flex justify-between items-center">
        <div className="w-6 h-6 bg-[var(--surface2)] rounded-full" />
        <div className="w-24 h-4 bg-[var(--surface2)] rounded-lg" />
        <div className="w-6 h-6" />
      </div>
      <div className="px-5 py-8 border-b border-[var(--border)]">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--surface2)] shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 bg-[var(--surface2)] rounded-lg" />
            <div className="h-20 w-full bg-[var(--surface2)] rounded-xl" />
          </div>
        </div>
      </div>
      <div className="p-5 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--surface2)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-[var(--surface2)] rounded-lg" />
              <div className="h-4 w-full bg-[var(--surface2)] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const isNavHidden = ["/login", "/register", "/friendszone/login", "/friendszone/register"].includes(location.pathname) || location.pathname.startsWith("/profile") || location.pathname.startsWith("/friendszone/profile");
  const isLandingOrAbout = ["/", "/friendszone/home", "/friendszone/about"].includes(location.pathname);

  return (
    <div className="min-h-screen font-sans transition-colors duration-300 bg-[var(--bg)] text-[var(--text)]">
      
      {/* Global Page Skeleton Loader Overlay */}
      <AnimatePresence>
        {isPageLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[2000]"
          >
            <SkeletonLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      {!isNavHidden && (
        <nav 
          className={`fixed top-0 left-0 right-0 z-[900] transition-all duration-300 ${
            (isScrolled || !isLandingOrAbout) ? "bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border)] shadow-lg" : "bg-transparent"
          }`}
        >
        <div className="w-full px-4 sm:px-6 md:px-8 flex items-center justify-between h-16">
          <Link to="/friendszone/home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform logo-shimmer-container">
              <img src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" className="w-full h-full object-cover" alt="Logo" />
            </div>
            <div className={`font-sans font-medium text-lg tracking-tight transition-colors ${!isScrolled && isLandingOrAbout ? "text-white" : "text-slate-900"}`}>
              FriendsZone
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link 
                to="/friendszone/home" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/' || location.pathname === '/friendszone/home' 
                    ? (!isScrolled && isLandingOrAbout ? "text-white border-b-2 border-white pb-0.5" : "text-blue-600 border-b-2 border-blue-600 pb-0.5")
                    : (!isScrolled && isLandingOrAbout ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
              >
                Home
              </Link>
              <Link 
                to="/friendszone/feed" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/friendszone/feed" 
                    ? (!isScrolled && isLandingOrAbout ? "text-white border-b-2 border-white pb-0.5" : "text-blue-600 border-b-2 border-blue-600 pb-0.5")
                    : (!isScrolled && isLandingOrAbout ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
              >
                Feed
              </Link>
              <Link 
                to="/friendszone/about" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/friendszone/about" 
                    ? (!isScrolled && isLandingOrAbout ? "text-white border-b-2 border-white pb-0.5" : "text-blue-600 border-b-2 border-blue-600 pb-0.5")
                    : (!isScrolled && isLandingOrAbout ? "text-white/70 hover:text-white" : "text-slate-600 hover:text-slate-900")
                }`}
              >
                About
              </Link>
            </div>

            {!isAuthenticated ? (
              <Link 
                to="/friendszone/register" 
                className="hidden sm:flex px-4 py-2 rounded-lg btn-primary text-xs font-medium text-white shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                Get Started
              </Link>
            ) : (
              <div className="hidden sm:block relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden transition-all duration-200 active:scale-95 shadow-sm hover:ring-2 hover:ring-[var(--purple)]/50 cursor-pointer outline-none relative z-40 block"
                  title="Profile Menu"
                >
                  <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Profile" />
                </button>
                
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      {/* Clickaway overlay background */}
                      <div 
                        className="fixed inset-0 z-[1000] cursor-default bg-transparent" 
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setConfirmDesktopSignOut(false);
                        }} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-48 bg-white border border-slate-150 shadow-2xl rounded-2xl py-2 z-[1001]"
                      >
                        <div className="px-3.5 py-2 border-b border-slate-50 mb-1.5 text-left">
                          <p className="text-xs font-bold text-slate-800 tracking-tight leading-none">{currentUser.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">@{currentUser.id}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            openProfile(currentUser);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[var(--purple)] transition-colors flex items-center gap-2.5 cursor-pointer leading-none"
                        >
                          <User size={14} className="text-slate-400" />
                          View Profile
                        </button>
                        <button 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            navigate("/friendszone/settings");
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[var(--purple)] transition-colors flex items-center gap-2.5 cursor-pointer leading-none border-t border-slate-55"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </button>
                        <button 
                          onClick={() => {
                            if (confirmDesktopSignOut) {
                              setIsProfileDropdownOpen(false);
                              handleLogout();
                              setConfirmDesktopSignOut(false);
                            } else {
                              setConfirmDesktopSignOut(true);
                            }
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold flex items-center gap-2.5 border-t border-slate-100 cursor-pointer mt-1 pt-2 leading-none transition-all duration-150 text-rose-600 hover:text-rose-700 bg-transparent"
                        >
                          <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {confirmDesktopSignOut ? "Confirm Sign Out" : "Sign Out"}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button onClick={() => setIsMobileMenuOpen(true)} className={`md:hidden p-1 transition-colors ${(isScrolled || !isLandingOrAbout) ? "text-[var(--text)]" : "text-white"}`}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            key="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex justify-end overflow-hidden"
          >
            <div onClick={() => { setIsMobileMenuOpen(false); setConfirmMobileSignOut(false); }} className="absolute inset-0 bg-black/60 cursor-pointer" />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 1 }}
              className="relative h-full w-[80%] max-w-[270px] bg-[var(--bg)] border-l border-[var(--border)] flex flex-col px-5 pt-7 pb-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[var(--purple)]/20 shadow-sm">
                    <img src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" className="w-full h-full object-cover" alt="Logo" />
                  </div>
                  <div className="font-sans font-semibold text-base leading-none text-[var(--text)]">Friendszone</div>
                </div>
                <button onClick={() => { setIsMobileMenuOpen(false); setConfirmMobileSignOut(false); }} className="p-1.5 -mr-1 text-[var(--text-dim)] hover:text-[var(--text)] transition-all cursor-pointer rounded-lg hover:bg-[var(--surface2)]">
                  <X size={18} />
                </button>
              </div>
              <div className="mb-2"><p className="text-[11px] font-medium text-[var(--text-dim)] ml-1">Navigation</p></div>
              <div className="flex flex-col gap-1">
                <Link to="/friendszone/home" onClick={() => { setIsMobileMenuOpen(false); setConfirmMobileSignOut(false); }} className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl font-sans font-medium text-xs transition-all ${location.pathname.includes('/home') || (location.pathname === '/' && '/home' === '/home') ? 'bg-[var(--purple)] text-white shadow-sm' : 'hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
                  <Home size={15} /> Home
                </Link>
                <Link to="/friendszone/feed" onClick={() => { setIsMobileMenuOpen(false); setConfirmMobileSignOut(false); }} className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl font-sans font-medium text-xs transition-all ${location.pathname.includes('/feed') ? 'bg-[var(--purple)] text-white shadow-sm' : 'hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
                  <LayoutGrid size={15} /> Social Feed
                </Link>
                <Link to="/friendszone/about" onClick={() => { setIsMobileMenuOpen(false); setConfirmMobileSignOut(false); }} className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl font-sans font-medium text-xs transition-all ${location.pathname.includes('/about') ? 'bg-[var(--purple)] text-white shadow-sm' : 'hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}>
                  <Info size={15} /> About Us
                </Link>
              </div>
              <div className="mt-auto pt-6 border-t border-[var(--border)]">
                 <p className="text-[11px] font-medium text-[var(--text-dim)] mb-2 ml-1">Account</p>
                 <div className="space-y-2">
                   {!isAuthenticated ? (
                     <>
                       <Link to="/friendszone/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2.5 rounded-xl border border-[var(--border)] font-medium text-xs hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-all flex items-center justify-center gap-2 text-[var(--text-dim)] cursor-pointer">
                         <User size={14} /> Login
                       </Link>
                       <Link to="/friendszone/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2.5 rounded-xl btn-primary text-white font-medium text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                          <Check size={14} /> Register
                       </Link>
                     </>
                   ) : (
                     <div className="space-y-2">
                       <button onClick={() => { openProfile(currentUser); setIsMobileMenuOpen(false); setConfirmMobileSignOut(false); }} className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--surface2)] transition-all group text-left cursor-pointer">
                         <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-[var(--border)] object-cover" alt="Avatar" />
                         <div className="text-left">
                           <div className="font-semibold text-xs leading-none text-[var(--text)]">{currentUser.name}</div>
                           <div className="text-[9px] text-[var(--text-dim)] font-normal mt-1">View Profile</div>
                         </div>
                       </button>
                       <button 
                         onClick={() => { 
                           navigate("/friendszone/settings"); 
                           setIsMobileMenuOpen(false); 
                           setConfirmMobileSignOut(false); 
                         }} 
                         className="w-full py-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)] transition-all leading-none"
                       >
                         <svg className="w-3.5 h-3.5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                         &nbsp;Settings
                       </button>
                       <button 
                         onClick={() => { 
                           if (confirmMobileSignOut) {
                             handleLogout(); 
                             setIsMobileMenuOpen(false); 
                             setConfirmMobileSignOut(false);
                           } else {
                             setConfirmMobileSignOut(true);
                           }
                         }} 
                         className={`w-full py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150 ${
                           confirmMobileSignOut 
                             ? "text-rose-600 hover:text-rose-700 bg-transparent border-none"
                             : "text-rose-600 hover:text-rose-700 bg-transparent border-none"
                         }`}
                       >
                         {confirmMobileSignOut ? "Confirm Sign Out" : "Sign Out"}
                       </button>
                     </div>
                   )}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`${isNavHidden ? "" : !isLandingOrAbout ? "pt-24 pb-12" : ""}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route index element={<Navigate to="/friendszone/home" replace />} />
            <Route path="/friendszone/home" element={<LandingView onNavigate={navigate} platformRef={platformRef} scrollToPlatforms={scrollToPlatforms} />} />
            <Route path="/friendszone/about" element={<AboutView onNavigate={navigate} />} />
            <Route 
              path="/friendszone/feed" 
              element={
                <FeedView 
                  isAuthenticated={isAuthenticated} 
                  currentUser={currentUser}
                  onNavigate={navigate}
                  isScrolled={isScrolled}
                  hasNewPosts={hasNewPosts}
                  setHasNewPosts={setHasNewPosts}
                  openComments={openComments}
                  openProfile={openProfile}
                  showNotification={showNotification}
                  posts={enrichedPosts.filter(p => !p.reportsCount || p.reportsCount < 3)}
                  setPosts={setPosts}
                />
              } 
            />
            <Route 
              path="/friendszone/register" 
              element={
                <RegisterView 
                   onBack={() => navigate("/friendszone/home")} 
                   onSuccess={handleRegisterSuccess} 
                   onLogin={() => navigate("/friendszone/login")} 
                   onGoToPlatforms={scrollToPlatforms}
                   step={registerStep}
                   setStep={setRegisterStep}
                   formData={registerFormData}
                   setFormData={setRegisterFormData}
                   theme={theme}
                />
              } 
            />
            <Route 
              path="/friendszone/login" 
              element={
                <LoginView 
                  onBack={() => navigate("/friendszone/home")} 
                  onSuccess={handleLoginSuccess} 
                  onRegister={() => navigate("/friendszone/register")} 
                  theme={theme}
                />
              } 
            />
            <Route 
              path="/friendszone/profile/:userId" 
              element={
                <ProfileRouteWrapper 
                  isLoadingProfile={isLoadingProfile}
                  users={users}
                  activeProfile={activeProfile}
                  openComments={openComments}
                  openProfile={openProfile}
                  isAuthenticated={isAuthenticated}
                  currentUser={currentUser}
                  setPreviewAuthor={setPreviewAuthor}
                  showNotification={showNotification}
                  enrichedPosts={enrichedPosts}
                  handleUpdateCurrentUser={handleUpdateCurrentUser}
                />
              } 
            />
            <Route 
              path="/friendszone/settings" 
              element={
                <SettingsView 
                  currentUser={currentUser}
                  onBack={() => navigate("/friendszone/feed")}
                  onLogout={handleLogout}
                  onShowNotification={showNotification}
                  posts={enrichedPosts}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/friendszone/home" replace />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[5000] px-4 py-2 rounded-full shadow-md flex items-center gap-2 backdrop-blur-md border text-[11px] font-normal tracking-normal whitespace-nowrap ${
              toast.type === "success" ? "bg-emerald-600/90 border-emerald-500 text-white" : 
              toast.type === "error" ? "bg-rose-600/90 border-rose-500 text-white" : 
              "bg-slate-900/90 border-slate-800 text-slate-100"
            }`}
          >
            {toast.type === "success" && <Check size={12} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Drawer */}
      <AnimatePresence>
        {activeCommentPost && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[2000] bg-[var(--bg)] flex flex-col"
          >
            <div className="flex flex-col items-center pt-4">
               <div className="w-10 h-1 rounded-full bg-[var(--border)] mb-1"></div>
            </div>

            {isLoadingComments ? (
              <CommentSkeleton />
            ) : (
               <>
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] sticky top-0 bg-[var(--bg)] z-10">
                  <button onClick={() => { setActiveCommentPost(null); setNewCommentText(""); }} className="p-1"><ChevronLeft size={24} /></button>
                  <h3 className="font-display font-black uppercase text-xs tracking-widest">Discussion</h3>
                  <div className="w-6"></div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-24 touch-pan-y">
                  <div className="flex flex-col md:flex-row gap-6 py-8 border-b border-[var(--border)]">
                    <button onClick={() => { setActiveCommentPost(null); openProfile(activeCommentPost.author); }} className="shrink-0">
                        <img src={activeCommentPost.author.avatar} alt="Author" className="w-12 h-12 rounded-full border border-[var(--border)]" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-base hover:underline cursor-pointer" onClick={() => { setActiveCommentPost(null); openProfile(activeCommentPost.author); }}>{activeCommentPost.author.name}</span>
                          <span className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest">{activeCommentPost.date}</span>
                        </div>
                        <p className="text-lg md:text-xl leading-relaxed font-medium">{activeCommentPost.caption}</p>
                    </div>
                  </div>

                  {activeCommentPost.commentList && activeCommentPost.commentList.map(c => (
                    <CommentItem 
                      key={c.id} 
                      comment={c} 
                      onOpenProfile={(a) => { setActiveCommentPost(null); openProfile(a); }} 
                      isAuthenticated={isAuthenticated} 
                      onRequireAuth={() => navigate("/friendszone/login")} 
                    />
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-[var(--bg)] border-t border-[var(--border)] flex items-center gap-3">
                  <img src={isAuthenticated ? currentUser.avatar : "https://picsum.photos/seed/anon/100/100"} className="w-8 h-8 rounded-full" alt="Me" />
                  <input 
                    type="text" 
                    readOnly={!isAuthenticated}
                    onClick={() => !isAuthenticated && navigate("/friendszone/login")}
                    placeholder={isAuthenticated ? `Reply to ${activeCommentPost.author.name}...` : "Login to join the conversation"} 
                    className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--purple)] transition-colors cursor-pointer text-[var(--text)]"
                    value={isAuthenticated ? newCommentText : ""}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && isAuthenticated && newCommentText.trim()) {
                        e.preventDefault();
                        await handleSendComment();
                      }
                    }}
                  />
                  <button 
                    onClick={handleSendComment}
                    className="text-[var(--purple)] font-black text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer" 
                    disabled={!isAuthenticated || !newCommentText.trim()}
                  >
                    Send
                  </button>
                </div>
               </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Preview Modal */}
      <AnimatePresence>
        {previewAuthor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewAuthor(null)}
            className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-10 cursor-zoom-out"
          >
             <motion.div
               initial={{ scale: 0.82, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.82, opacity: 0 }}
               transition={{ type: "spring", damping: 28, stiffness: 240 }}
               className="relative overflow-hidden w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl"
               onClick={e => e.stopPropagation()}
             >
                <img 
                  src={previewAuthor.avatar} 
                  referrerPolicy="no-referrer"
                  alt="Preview" 
                  className="w-full h-full object-cover select-none pointer-events-none" 
               />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {isLandingOrAbout && (
        <footer className="bg-[var(--bg)] border-t border-[var(--border)] pt-20 pb-10">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid md:grid-cols-3 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border)] logo-shimmer-container">
                  <img src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="font-sans font-bold text-lg text-slate-900">FriendsZone</span>
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">Building real connections through shared interests and quality conversations.</p>
            </div>
            {[
              { title: "Navigation", items: [{name: "Home", path: "/friendszone/home"}, {name: "About Us", path: "/friendszone/about"}, {name: "Feed", path: "/friendszone/feed"}] },
              { title: "Platforms", items: [
                { name: "WhatsApp", url: "https://chat.whatsapp.com/IkJ1i2lSsiz3tBNAAR9K32" }
              ] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-display font-bold uppercase text-xs tracking-widest text-[var(--text-dim)] mb-6">{col.title}</h4>
                <ul className="space-y-4">
                  {col.items.map((item: any, j) => (
                    <li key={j}>
                      {item.path ? (
                        <Link to={item.path} className="text-sm text-[var(--text-muted)] hover:text-[var(--purple)] transition-colors">{item.name}</Link>
                      ) : (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-muted)] hover:text-[var(--purple)] transition-colors">{item.name}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-10 border-t border-[var(--border)] text-center md:text-left">
            <div className="text-xs font-medium text-[var(--text-dim)]">&copy; 2026 FriendsZone Community.</div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
