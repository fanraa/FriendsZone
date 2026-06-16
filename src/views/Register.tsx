import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Eye, EyeOff, ChevronDown, MessageSquare, ExternalLink } from "lucide-react";
import { VideoBackground } from "../components/common/VideoBackground";
import { COUNTRIES, isUsernameTaken } from "../types";
import { db } from "../lib/firebase";
import { doc } from "firebase/firestore";
import { cachedGetDoc } from "../lib/firebaseCache";

interface RegisterViewProps {
  onBack: () => void;
  onSuccess: () => void;
  onLogin: () => void;
  onGoToPlatforms?: () => void;
  step: number;
  setStep: (step: number) => void;
  formData: any;
  setFormData: (data: any) => void;
  theme: "light" | "dark";
}

export const RegisterView = ({ 
  onBack, 
  onSuccess, 
  onLogin, 
  onGoToPlatforms,
  step,
  setStep,
  formData,
  setFormData,
  theme
}: RegisterViewProps) => {
  const totalSteps = 7;
  const [openPicker, setOpenPicker] = useState<"day" | "month" | "country" | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const validatePassword = (pass: string) => {
    return pass.length >= 8 && pass.length <= 50;
  };

  const handleNext = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Current Step:", step);
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const usernameToCheck = formData.username?.trim().toLowerCase();
      if (!formData.username) {
        newErrors.username = "Username is required";
      } else if (isUsernameTaken(formData.username)) {
        newErrors.username = "This username is already taken";
      } else if (formData.username.length < 5) {
        newErrors.username = "Minimum 5 characters";
      } else if (!/^(?=.*[a-z])[a-z0-9_]{5,16}$/.test(formData.username)) {
        newErrors.username = "Only lowercase letters, numbers, and underscores are allowed";
      } else {
        // Real-time Firestore document uniqueness check
        setIsCheckingUsername(true);
        try {
          const userCheckRef = doc(db, "users", usernameToCheck);
          const userCheckSnap = await cachedGetDoc(userCheckRef);
          if (userCheckSnap.exists()) {
            newErrors.username = "This username is already taken by another user";
          }
        } catch (err) {
          console.error("Firestore unique username check failed:", err);
        } finally {
          setIsCheckingUsername(false);
        }
      }
    }

    if (step === 2) {
      const { day, month, year } = formData.birthDate;
      if (!day || !month || !year) newErrors.birthDate = "Please complete all birth date fields";
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1980 || yearNum > 2016) {
        newErrors.birthDate = "Age Limit • Must be born between 1980 and 2016";
      }
    }

    if (step === 3) {
      if (!formData.country) {
        newErrors.country = "Please select your region";
      }
    }

    if (step === 4) {
      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else if (formData.phone.length < 8 || formData.phone.length > 14) {
        newErrors.phone = "Phone number must be between 8 and 14 digits";
      }
    }

    if (step === 5) {
      if (!formData.gender) {
        newErrors.gender = "Please select your gender";
      }
    }

    if (step === 6) {
       if (!formData.password) {
         newErrors.password = "Password is required";
       } else if (!validatePassword(formData.password)) {
         newErrors.password = "Password must be between 8 and 50 characters";
       } else if (formData.password !== formData.confirmPassword) {
         newErrors.confirmPassword = "Passwords do not match";
       }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (step < totalSteps) setStep(step + 1);
    else onSuccess();
  };  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <input 
              autoFocus 
              type="text" 
              placeholder="Username"
              maxLength={16}
              className={`w-full px-4 py-2 rounded-lg border transition-all font-normal text-xs text-center outline-none ${
                errors.username 
                ? "border-rose-300 bg-rose-50/50 text-slate-800 placeholder:text-rose-350 focus:border-rose-400 focus:ring-1 focus:ring-rose-100" 
                : "border-slate-200 bg-slate-50/70 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400"
              }`}
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") });
                if (errors.username) setErrors({ ...errors, username: "" });
              }}
            />
            <p className="text-slate-600 text-xs text-center leading-relaxed font-normal">
              {isCheckingUsername ? (
                <span className="text-[var(--purple)] font-medium animate-pulse">Checking availability...</span>
              ) : (
                <>
                  Create your profile username <br/> 
                  <span className="text-slate-400 text-[11px] font-normal">(5-16 characters, lowercase letters & numbers only)</span>
                </>
              )}
            </p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 relative z-[300]">
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setOpenPicker(openPicker === "day" ? null : "day")} 
                  className={`w-full py-2 rounded-lg border font-normal text-xs transition-all outline-none ${
                    errors.birthDate && !formData.birthDate.day
                    ? "border-rose-300 bg-rose-50/30 text-rose-600 hover:bg-rose-50/50"
                    : "border-slate-200 bg-slate-50/75 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formData.birthDate.day || "Day"}
                </button>
                {openPicker === "day" && (
                  <div className="absolute top-full left-0 mt-1.5 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg z-[400] p-2 shadow-xl no-scrollbar animate-fade-in">
                    {days.map(d => (
                      <button 
                        key={d} 
                        type="button" 
                        onClick={() => { 
                          setFormData({ ...formData, birthDate: { ...formData.birthDate, day: d } }); 
                          setOpenPicker(null); 
                          if (errors.birthDate) setErrors({ ...errors, birthDate: "" });
                        }} 
                        className="w-full py-1.5 hover:bg-slate-50 text-slate-700 text-xs rounded-lg font-medium cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setOpenPicker(openPicker === "month" ? null : "month")} 
                  className={`w-full py-2 rounded-lg border font-normal text-xs transition-all outline-none ${
                    errors.birthDate && !formData.birthDate.month
                    ? "border-rose-350 bg-rose-50/30 text-rose-600 hover:bg-rose-50/50"
                    : "border-slate-200 bg-slate-50/75 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {formData.birthDate.month ? months[parseInt(formData.birthDate.month)-1] : "Month"}
                </button>
                {openPicker === "month" && (
                  <div className="absolute top-full left-0 mt-1.5 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg z-[400] p-2 shadow-xl no-scrollbar animate-fade-in">
                    {months.map((m, i) => (
                      <button 
                        key={m} 
                        type="button" 
                        onClick={() => { 
                          setFormData({ ...formData, birthDate: { ...formData.birthDate, month: String(i + 1) } }); 
                          setOpenPicker(null); 
                          if (errors.birthDate) setErrors({ ...errors, birthDate: "" });
                        }} 
                        className="w-full py-1.5 hover:bg-slate-50 text-slate-700 text-xs rounded-lg font-medium cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="relative z-10">
              <input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                maxLength={4}
                placeholder="Birth Year"
                className={`w-full px-4 py-2 rounded-lg border transition-all font-normal text-xs text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  errors.birthDate && !formData.birthDate.year
                  ? "border-rose-300 bg-rose-50/50 text-slate-800 focus:border-rose-400 focus:ring-1 focus:ring-rose-100 placeholder:text-rose-300" 
                  : "border-slate-200 bg-slate-50/70 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400"
                }`}
                value={formData.birthDate.year}
                onChange={(e) => {
                  setFormData({ ...formData, birthDate: { ...formData.birthDate, year: e.target.value.replace(/\D/g, "") } });
                  if (errors.birthDate) setErrors({ ...errors, birthDate: "" });
                }}
              />
            </div>
            <p className="text-slate-600 text-xs text-center leading-relaxed font-normal">
              Select your birth date <br/> 
              <span className="text-slate-400 text-[11px] font-normal">(Required for authentication)</span>
            </p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="relative">
              <button 
                type="button" 
                onClick={() => {
                  setOpenPicker(openPicker === "country" ? null : "country");
                  setCountrySearch(""); // Reset search on toggle
                }} 
                className={`w-full p-3 rounded-lg flex items-center justify-between border transition-all relative z-10 cursor-pointer ${
                  errors.country
                  ? "border-rose-300 bg-rose-50/50 text-slate-800"
                  : "border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300 hover:bg-slate-100/50"
                }`}
              >
                 <div className="flex items-center gap-3">
                    <span className="text-2xl">{formData.country.flag}</span>
                    <div className="text-left py-0.5">
                       <div className="text-sm font-semibold text-slate-800">{formData.country.name}</div>
                    </div>
                 </div>
                 <ChevronDown size={16} className={`text-slate-500 transition-transform ${openPicker === "country" ? "rotate-180" : ""}`} />
              </button>
              {openPicker === "country" && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 shadow-2xl rounded-xl z-[4000] p-2 flex flex-col max-h-[260px] animate-fade-in shadow-purple-100/50">
                  {/* Real-time search bar inside picker */}
                  <div className="px-1.5 pb-2 pt-1 border-b border-slate-100 sticky top-0 bg-white z-20">
                    <input 
                      type="text" 
                      placeholder="Search region..."
                      autoFocus
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold focus:border-[var(--purple)] focus:outline-none placeholder:text-slate-400"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing on input click
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>
                  
                  {/* Scrollable listing box */}
                  <div className="overflow-y-auto no-scrollbar flex-1 max-h-48 mt-1.5 space-y-0.5">
                    {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                      <button 
                        key={c.code} 
                        type="button" 
                        onClick={() => { 
                          setFormData({ ...formData, country: c }); 
                          setOpenPicker(null); 
                          setCountrySearch(""); // Reset search
                          if (errors.country) setErrors({ ...errors, country: "" });
                        }} 
                        className={`w-full p-2 flex items-center rounded-lg transition-all cursor-pointer ${
                          formData.country.code === c.code 
                          ? "bg-[var(--purple)] text-white font-semibold" 
                          : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <span className="text-lg">{c.flag}</span>
                           <span className="text-xs font-semibold">{c.name}</span>
                        </div>
                      </button>
                    ))}
                    {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                      <div className="text-xs text-slate-400 text-center py-6 font-semibold select-none">
                        Region not found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="text-slate-600 text-xs text-center leading-relaxed font-normal">
              Country of residence <br/> 
              <span className="text-slate-400 text-[11px] font-normal">(Please select your home country)</span>
            </p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex gap-2 w-full">
              {formData.country.dialCode === 'custom' ? (
                <input 
                  type="text" placeholder="+"
                  maxLength={5}
                  className={`w-16 px-2 py-2 rounded-lg border transition-all font-normal text-center text-xs outline-none ${
                    errors.phone
                    ? "border-rose-300 bg-rose-50/50 text-slate-800"
                    : "border-slate-200 bg-slate-50/70 text-slate-800 focus:bg-white"
                  }`}
                  value={formData.customDialCode}
                  onChange={(e) => setFormData({ ...formData, customDialCode: e.target.value.startsWith('+') ? e.target.value : '+' + e.target.value.replace(/[^0-9]/g, "") })}
                />
              ) : (
                <div className="inline-flex min-w-[60px] px-2 py-2 rounded-lg bg-slate-150 border border-slate-200 items-center justify-center font-normal text-xs text-slate-550 shrink-0 select-none">
                  {formData.country.dialCode}
                </div>
              )}
              <input 
                autoFocus 
                type="tel" 
                placeholder="Phone Number"
                maxLength={14}
                className={`flex-1 w-0 px-4 py-2 rounded-lg border transition-all font-normal text-xs outline-none ${
                  errors.phone
                  ? "border-rose-300 bg-rose-50/50 text-slate-800 placeholder:text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
                  : "border-slate-200 bg-slate-50/70 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400"
                }`}
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
              />
            </div>
            <p className="text-slate-600 text-xs text-center leading-relaxed font-normal">
              Mobile contact number <br/> 
              <span className="text-slate-400 text-[11px] font-normal">(Used for account security)</span>
            </p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-2.5">
              {["Male", "Female", "Other"].map((g) => (
                <button 
                  key={g} 
                  type="button" 
                  onClick={() => { 
                    setFormData({ ...formData, gender: g as any }); 
                    if (errors.gender) setErrors({ ...errors, gender: "" });
                  }}
                  className={`p-3 rounded-lg border transition-all text-center font-semibold text-sm cursor-pointer ${
                    formData.gender === g 
                    ? "bg-[var(--purple)] text-white border-[var(--purple)] shadow-md animate-pulse-subtle" 
                    : errors.gender 
                    ? "bg-rose-50/30 border-rose-300 text-rose-700"
                    : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-slate-600 text-xs text-center leading-relaxed font-normal">
              Gender Identification <br/> 
              <span className="text-slate-400 text-[11px] font-normal">(Please click Continue button after selecting)</span>
            </p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="relative flex items-center">
                <input 
                  autoFocus 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password"
                  className={`w-full px-4 py-2 rounded-lg border transition-all font-normal text-xs text-center outline-none ${
                    errors.password
                    ? "border-rose-300 bg-rose-50/50 text-slate-800 placeholder:text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
                    : "border-slate-250 bg-slate-50/70 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400"
                  }`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Confirm Password"
                className={`w-full px-4 py-2 rounded-lg border transition-all font-normal text-xs text-center outline-none ${
                  errors.confirmPassword
                  ? "border-rose-300 bg-rose-50/50 text-slate-800 placeholder:text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
                  : "border-slate-250 bg-slate-50/70 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400"
                }`}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                }}
              />
            </div>
            <p className="text-slate-600 text-xs text-center leading-relaxed font-normal">
              Create a secure password <br/> 
              <span className="text-slate-400 text-[11px] font-normal">(Password must be at least 8 characters)</span>
            </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex bg-white text-slate-800 font-sans overflow-hidden"
    >
      {/* Split Left Side: Decorative Branding Layout (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] h-screen bg-slate-50 border-r border-slate-100 flex-col justify-between p-10 select-none">
        {/* Upper Side: Branding Title */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" className="w-full h-full object-cover" alt="Logo" />
            </div>
            <span className="font-sans font-semibold text-slate-800">FriendsZone</span>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-medium tracking-tight text-slate-800 mb-1 leading-tight animate-fade-in">
              Connect with people instantly.
            </h2>
            <p className="text-slate-400 text-xs font-normal">Build beautiful friendships across nations and borders.</p>
          </div>
        </div>

        {/* Center: Simplified Horizontal Image Container (No wrapper box, landscape aspect ratio, left-aligned) */}
        <div className="flex-1 flex items-start justify-start my-6 w-full max-w-[380px] text-left">
          <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <img 
              src="https://images.pexels.com/photos/33258942/pexels-photo-33258942.jpeg" 
              alt="Friends connection" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Bottom Side: Footer text */}
        <div className="text-center md:text-left">
          <p className="text-slate-400 text-[11px] font-normal leading-relaxed max-w-[340px]">
            Join our global community with over thousands of active members worldwide and find friends with matching interests.
          </p>
        </div>
      </div>

      {/* Split Right Side: White register card with background white page */}
      <div className="w-full md:w-[55%] lg:w-[50%] min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-white overflow-y-auto relative">
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="w-full max-w-[370px] bg-white border border-slate-150 shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col justify-start relative z-20 my-auto transition-all duration-300"
        >
          
          {step < 7 && (
            <button 
              onClick={onBack}
              type="button"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 transition-colors z-30 cursor-pointer"
              title="Back to Homepage"
            >
              <Home size={18} />
            </button>
          )}

          <div className="mb-6 text-center relative z-20">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-100 shadow-sm mx-auto mb-3 bg-slate-50">
              <img src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex justify-center gap-1.5 mb-4 border-slate-100">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-75 ${i + 1 <= step ? "w-5 bg-[var(--purple)]" : "w-1.5 bg-slate-150"}`} />
              ))}
            </div>
            <h2 className="text-lg md:text-xl font-sans font-medium tracking-tight text-slate-800 mb-0.5 leading-tight">
               {step === 1 && "Create Account"}
               {step === 2 && "Date of Birth"}
               {step === 3 && "Region Selection"}
               {step === 4 && "Phone Verification"}
               {step === 5 && "Account Preference"}
               {step === 6 && "Secure Password"}
               {step === 7 && "Final Step"}
            </h2>
            <span className="text-[11px] text-slate-400 font-normal">step {step} of {totalSteps}</span>
          </div>

          <form id="register-form" onSubmit={handleNext} className="relative z-20 mb-6 min-h-[160px] flex flex-col items-center justify-center overflow-visible">
             <AnimatePresence mode="wait">
               <motion.div
                 key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                 className="w-full overflow-visible"
               >
                 {step === 7 ? (
                   <div className="space-y-6">
                     <div className="flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 relative overflow-hidden">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-10 h-10 object-contain" alt="WhatsApp" />
                       </div>
                       <div className="text-center">
                          <h3 className="text-base font-medium text-slate-800 mb-1.5">Join Our Community</h3>
                          <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mx-auto font-normal">
                            Connect instantly with members from all over the world to make fun new friends.
                          </p>
                       </div>
                       <button 
                         type="button"
                         onClick={() => {
                           window.open("https://chat.whatsapp.com/IkJ1i2lSsiz3tBNAAR9K32", "_blank");
                           onSuccess();
                         }}
                         className="w-full py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5c] text-white font-medium text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
                       >
                         Join WhatsApp Group <ExternalLink size={14} />
                       </button>
                     </div>
                   </div>
                 ) : renderStep()}
               </motion.div>
             </AnimatePresence>

             {step < 7 && (
               <div className="w-full mt-6">
                 <button type="submit" className="w-full py-2 rounded-lg bg-[var(--purple)] text-white font-medium text-xs shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer">
                   {step === 6 ? "Create Account" : "Continue"}
                 </button>
               </div>
             )}
          </form>

          <div className="space-y-2 relative z-10 w-full">
            {errors.birthDate && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.birthDate}</p>}
            {errors.username && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.username}</p>}
            {errors.country && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.country}</p>}
            {errors.gender && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.gender}</p>}
            {errors.phone && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.phone}</p>}
            {errors.password && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.password}</p>}
            {errors.confirmPassword && <p className="text-rose-500 text-[10px] font-normal text-center -mt-3 mb-1">{errors.confirmPassword}</p>}
            
            {step < 7 && (
              <div className="flex justify-between items-center px-1 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => step > 1 ? setStep(step - 1) : onBack()} className="text-[var(--purple)] hover:underline text-xs font-semibold transition-all cursor-pointer">
                  {step === 1 ? "Cancel" : "Back"}
                </button>
                <button type="button" onClick={onLogin} className="text-[var(--purple)] hover:underline text-xs font-semibold transition-all cursor-pointer">
                  Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
