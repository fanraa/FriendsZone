import React, { useState } from "react";
import { motion } from "motion/react";
import { Home, Eye, EyeOff } from "lucide-react";
import { VideoBackground } from "../components/common/VideoBackground";

interface LoginViewProps {
  onBack: () => void;
  onSuccess: (identifier: string, password?: string) => void;
  onRegister: () => void;
  theme: "light" | "dark";
}

export const LoginView = ({ onBack, onSuccess, onRegister, theme }: LoginViewProps) => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.identifier && formData.password.length >= 8) {
      onSuccess(formData.identifier, formData.password);
    } else {
      setError("Invalid username or password");
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

      {/* Split Right Side: White login card with background white page */}
      <div className="w-full md:w-[55%] lg:w-[50%] min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-white overflow-y-auto relative">
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="w-full max-w-[370px] bg-white border border-slate-150 shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col justify-start relative z-20 my-auto transition-all duration-300"
        >
          
          <button 
            onClick={onBack}
            type="button"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 transition-colors z-30 cursor-pointer"
            title="Back to Homepage"
          >
            <Home size={18} />
          </button>
          
          <div className="text-center mb-6 relative z-20">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-100 shadow-sm mx-auto mb-3 bg-slate-50">
              <img src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-lg md:text-xl font-sans font-medium tracking-tight text-slate-800 mb-0.5 leading-tight">Welcome Back</h1>
            <p className="text-slate-400 text-[11px] font-normal">Please sign in to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative z-20 flex flex-col">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1 ml-0.5">
                Username or Phone
              </label>
              <input 
                type="text" 
                placeholder="Username / Phone Number"
                maxLength={16}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 transition-all font-normal text-xs outline-none bg-slate-50/55 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400/80"
                value={formData.identifier}
                onChange={(e) => {
                  setFormData({ ...formData, identifier: e.target.value });
                  if (error) setError("");
                }}
              />
            </div>
            <div>
               <label className="block text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1 ml-0.5">
                 Password
               </label>
               <div className="relative flex items-center">
                 <input 
                   type={showPassword ? "text" : "password"} 
                   placeholder="••••••••"
                   maxLength={32}
                   className="w-full px-4 py-2 rounded-lg border border-slate-200 transition-all font-normal text-xs outline-none bg-slate-50/55 text-slate-800 focus:bg-white focus:border-[var(--purple)] focus:ring-1 focus:ring-purple-100/30 placeholder:text-slate-400/80"
                   value={formData.password}
                   onChange={(e) => {
                     setFormData({ ...formData, password: e.target.value });
                     if (error) setError("");
                   }}
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer">
                   {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
               </div>
            </div>

            {error && <p className="text-rose-500 text-[10px] font-normal text-center pt-1.5">{error}</p>}

            <button type="submit" className="w-full py-2 rounded-lg bg-[var(--purple)] text-white font-medium text-xs shadow-sm hover:scale-[1.01] active:scale-95 transition-all mt-4 cursor-pointer">
              Sign In to Account
            </button>
          </form>

          <div className="mt-5 pt-3.5 border-t border-slate-100 text-center space-y-2.5 relative z-20 font-sans">
            <p className="text-[11px] text-slate-400 font-normal tracking-tight">
              Don't have an account yet? <button onClick={onRegister} className="text-[var(--purple)] font-medium hover:underline cursor-pointer transition-colors ml-1">Create Account</button>
            </p>
            <div className="flex justify-center">
              <button onClick={onBack} className="text-slate-400 hover:text-slate-500 text-[11px] font-normal transition-colors cursor-pointer">Back to Homepage</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
