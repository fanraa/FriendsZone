import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users as UsersIcon, LayoutGrid, ChevronDown, Send } from "lucide-react";

interface LandingViewProps {
  onNavigate: (path: string) => void;
  platformRef: React.RefObject<HTMLElement>;
  scrollToPlatforms: () => void;
}

export const LandingView = ({ onNavigate, platformRef, scrollToPlatforms }: LandingViewProps) => {
  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Contact form state
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const sanitizeInput = (text: string) => {
    return text.replace(/[<>]/g, "").trim();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = sanitizeInput(email);
    const cleanMessage = sanitizeInput(message);

    if (!cleanEmail) {
      setStatusMsg({ text: "Please enter a valid email address.", type: "error" });
      return;
    }

    // Email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setStatusMsg({ text: "Invalid email format. Please use a proper format (e.g., name@domain.com).", type: "error" });
      return;
    }

    if (!cleanMessage || cleanMessage.length < 5) {
      setStatusMsg({ text: "Message must be at least 5 characters long.", type: "error" });
      return;
    }

    setIsSending(true);

    // Secure integration with Web3Forms using safe environment variables or default fallback
    const accessKey = (import.meta as any).env.VITE_WEB3FORMS_ACCESS_KEY || "fb3f1e9c-c9d3-469b-98b6-5cb39a82ca7c";

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          email: cleanEmail,
          message: cleanMessage,
          subject: "New Message from your FriendsZone Web Portal",
          from_name: "FriendsZone Portal Guest",
          replyto: cleanEmail
        }),
      });

      const result = await response.json();
      setIsSending(false);

      if (result.success) {
        setStatusMsg({ text: "Your message has been sent successfully to Irfan's email! Thank you for contacting us.", type: "success" });
        setEmail("");
        setMessage("");
      } else {
        setStatusMsg({ text: result.message || "Failed to submit message to Web3Forms. Please try again later.", type: "error" });
      }
    } catch (err) {
      setIsSending(false);
      setStatusMsg({ text: "A connection error occurred. Please try again later.", type: "error" });
    }
  };

  const faqs = [
    {
      q: "What is FriendsZone?",
      a: "FriendsZone is a premium global community ecosystem designed as a safe, friendly space for everyone to gather, discuss, share interests, and find new high-integrity friends online."
    },
    {
      q: "How do I join the WhatsApp group?",
      a: "It's extremely simple! Just click the 'Join Now' button on the WhatsApp platform card in the section below to join our official communication spaces instantly."
    },
    {
      q: "Is there any cost to join FriendsZone?",
      a: "Absolutely not. The FriendsZone community is 100% free of charge and collaboratively nurtured by our global members for the safe environment of all."
    },
    {
      q: "How is safety and integrity maintained in the community?",
      a: "We have active administrators and moderators who monitor our groups to filter out spam, scams, and offensive behavior. We advise members to never share sensitive personal details publicly."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[var(--bg)]"
    >
      {/* Hero Section with Custom Background Image & Smooth Bottom Gradient Blends */}
      <section 
        className="relative min-h-[75vh] flex items-center justify-center overflow-hidden px-5 py-20 bg-cover bg-center"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.80)), url("https://images.pexels.com/photos/36729918/pexels-photo-36729918.jpeg")' 
        }}
      >
        {/* Subtle top overlay to blend with transparent navigation */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/40 to-transparent pointer-events-none z-10" />

        {/* Ambient Bottom Gradient Overlay that seamlessly merges with page color #f8fafc */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none z-10" />

        <div className="relative z-10 max-w-2xl w-full text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center mb-6"
          >
            {/* Clean logo style, strictly NO blue glowing edges */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-white/15 shadow-sm shrink-0 hover:scale-105 transition-transform duration-700">
              <img 
                src="https://res.cloudinary.com/dew39kqhy/image/upload/v1776967780/1774023663426_cv3c6b.png" 
                alt="logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Corrected Hierarchy: Welcome to is small & FriendsZone is massive, glorious, and bold */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="leading-tight tracking-tight mb-5 text-white flex flex-col items-center gap-1.5"
          >
            <span className="text-sm md:text-base font-sans font-medium uppercase tracking-[0.25em] text-slate-300">
              Welcome to
            </span>
            <span className="font-sans font-extrabold text-4xl md:text-6xl tracking-tight select-none">
              FriendsZone
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-slate-200/90 max-w-md mx-auto mb-8 leading-relaxed font-normal"
          >
            A premium direct space to meet new friends, share bright ideas, and foster warm connections around the globe.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-3.5 max-w-sm mx-auto"
          >
            <button 
              onClick={scrollToPlatforms}
              className="flex-1 px-5 py-3 rounded-lg btn-primary text-white font-semibold text-xs shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <UsersIcon size={16} /> Join the Community
            </button>
            <button 
              onClick={() => onNavigate("/friendszone/feed")}
              className="flex-1 px-5 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <LayoutGrid size={16} /> Feed
            </button>
          </motion.div>
        </div>
      </section>

      {/* Concept Card Section */}
      <div className="max-w-5xl mx-auto px-5 -mt-12 relative z-20 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border border-[var(--border)] rounded-xl p-6 md:p-10 shadow-lg flex flex-col md:flex-row items-center gap-8"
        >
          <div className="flex-1 space-y-4">
            <span className="text-[var(--purple)] font-bold text-xs uppercase tracking-wider">The Concept</span>
            <h2 className="text-2xl md:text-3.5xl font-sans font-bold leading-tight tracking-tight text-slate-900">
              What is <span className="text-[var(--purple)]">FriendsZone?</span>
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed font-normal text-sm">
              FriendsZone is a premium global ecosystem built for genuine human connection. We break traditional social media barriers by fostering an echo-free zone where great conversations are valued far above algorithms.
            </p>
            <p className="text-[var(--text-dim)] leading-relaxed text-xs font-normal">
              Born from a simple WhatsApp group, we have grown into an immersive, cross-platform sanctuary for creators, explorers, and thinkers from all walks of life. Here, you are not just a user; you are part of a global family.
            </p>
            
            <div className="flex gap-8 pt-2">
              <div>
                <div className="text-2xl font-bold text-[var(--purple)]">1k+</div>
                <div className="text-xs font-semibold text-[var(--text-dim)]">Active members</div>
              </div>
              {/* Stat simplified as requested: "All" value on top, and "Countries" label underneath */}
              <div>
                <div className="text-2xl font-bold text-cyan-600">All</div>
                <div className="text-xs font-semibold text-[var(--text-dim)] font-medium">Countries</div>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <div className="space-y-3 pt-6">
              <div className="h-32 rounded-lg overflow-hidden shadow-sm"><img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Community sample" /></div>
              <div className="h-28 rounded-lg overflow-hidden shadow-sm"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Community sample" /></div>
            </div>
            <div className="space-y-3">
              <div className="h-28 rounded-lg overflow-hidden shadow-sm"><img src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Community sample" /></div>
              <div className="h-32 rounded-lg overflow-hidden shadow-sm"><img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Community sample" /></div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[var(--border)] rounded-lg bg-white shadow-md overflow-hidden mt-8"
        >
          {[
            { label: "Members", value: "1k+" },
            { label: "Platform", value: "1" },
            { label: "Daily messages", value: "1k+" },
            { label: "Events", value: "24/7" }
          ].map((stat, i) => (
            <div key={i} className="p-6 text-center border-r border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-[var(--text-dim)] font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Platform Section - Clean, single-column WhatsApp with NO thick green border line */}
      <section className="py-16 bg-gradient-to-b from-[var(--bg)] to-white/40" id="community" ref={platformRef}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3.5xl font-sans font-bold mb-3 text-slate-900">Connect Anywhere</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">Get into our main interaction spaces and start conversing with incredible minds.</p>
          </div>

          <div className="max-w-md mx-auto">
            <motion.div 
              whileHover={{ y: -2 }}
              className="p-6 rounded-xl bg-white border border-[var(--border)] relative overflow-hidden group shadow-md"
            >
              <div className="mb-4">
                <svg viewBox="0 0 24 24" className="w-12 h-12 fill-[#25d366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">WhatsApp Group</h3>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-4">
                Enjoy quick conversations, live interactions, daily updates, and casual, genuine chats with other members.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                1k+ active members
              </div>
              <a 
                href="https://chat.whatsapp.com/IkJ1i2lSsiz3tBNAAR9K32" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full py-2.5 rounded-lg border border-[var(--border2)] text-xs font-semibold text-center hover:bg-slate-50 text-slate-800 transition-all cursor-pointer"
              >
                Join Now
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Restored, Sleek design with exact seamless page background blending */}
      <section className="py-20 bg-gradient-to-b from-white/40 via-[var(--bg)] to-[var(--bg)] border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3.5xl font-sans font-bold mb-3 text-slate-900">Frequently Asked Questions</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">We've compiled some common queries to help you learn more about the FriendsZone community.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-[var(--border2)] rounded-lg overflow-hidden transition-all duration-300 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-slate-800">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: activeFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} className="text-slate-500" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 py-4 bg-white border-t border-[var(--border)] text-xs leading-relaxed text-slate-600 font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secure Contact Form Section with Beautiful Side-by-Side Widescreen Desktop Image */}
      <section className="py-24 bg-gradient-to-b from-[var(--bg)] via-white/50 to-[var(--bg)] border-t border-[var(--border)] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            
            {/* Left Column Image (Widescreen Desktop Only) */}
            <div className="hidden md:block relative min-h-[400px]">
              <img 
                src="https://images.pexels.com/photos/8457809/pexels-photo-8457809.jpeg" 
                alt="Community banner" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-slate-950/20" />
              <div className="absolute bottom-10 left-10 right-10 text-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Nurtured Ecosystem</span>
                <h4 className="text-2xl font-bold font-sans">Human Connections Above Everything Else.</h4>
                <p className="text-xs text-slate-200">Our support channels are safe, highly secure, and encrypted dynamically to keep spam or malicious actions away.</p>
              </div>
            </div>

            {/* Right Column Form (Flexible grid) */}
            <form onSubmit={handleSendMessage} className="p-6 md:p-10 space-y-4 flex flex-col justify-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Send a Message</h3>
                <p className="text-[var(--text-muted)] text-xs mt-1">Have dynamic feedback, questions, or ideas? Drop your message securely below.</p>
              </div>
              
              <div className="border-b border-slate-100 pb-2 mb-2" />

              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input 
                  id="contact-email"
                  type="email"
                  required
                  maxLength={80}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border2)] text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-normal bg-slate-50/50"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-600 mb-1.5">Your Message</label>
                <textarea 
                  id="contact-message"
                  required
                  rows={4}
                  maxLength={600}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your beautiful feedback or message here..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border2)] text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400 text-slate-800 font-normal bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 rounded-lg btn-primary text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              {statusMsg && (
                <div 
                  className={`p-3 rounded-lg text-xs text-center font-semibold mt-3 ${
                    statusMsg.type === "success" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}
            </form>

          </div>
        </div>
      </section>
    </motion.div>
  );
};
