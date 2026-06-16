import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, Award, Users, Smartphone, Layout, Globe, Rocket, Image, ChevronDown, Check, User, LayoutGrid, Star } from "lucide-react";

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView = ({ onNavigate }: AboutViewProps) => {
  // Local state for the dynamic accordion FAQ
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const galleryImages = [
    { id: 1, url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80", title: "Global Gathering 2024", size: "large" },
    { id: 2, url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80", title: "Coffee & Tech", size: "small" },
    { id: 3, url: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=600&q=80", title: "Community Meetup", size: "small" },
    { id: 4, url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80", title: "Expansion Days", size: "medium" },
    { id: 5, url: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80", title: "Digital Connection", size: "medium" },
    { id: 6, url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80", title: "Creators", size: "small" },
    { id: 7, url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80", title: "Adventure", size: "small" },
  ];

  const faqs = [
    { 
      q: "How do I join a real-life meetup?", 
      a: "Every regional meetup is posted in our private chapters. Once your profile is verified, you'll get access to your local community board." 
    },
    { 
      q: "Is there a membership fee?", 
      a: "Friendszone is community-driven. While joining the platform is free, some specific events may have voluntary shared costs." 
    },
    { 
      q: "How do you ensure community safety?", 
      a: "We use a rigorous verification process and human moderators to ensure that every member is real and respects our core values." 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20 bg-[var(--bg)]"
    >
      {/* Hero Section - Scenic Darkened Background with Beautiful Pexels Image */}
      <section 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.82)), url("https://images.pexels.com/photos/25745380/pexels-photo-25745380.jpeg")' 
        }}
        className="relative min-h-[45vh] flex items-center justify-center bg-cover bg-center overflow-hidden px-5 py-20 text-white border-b border-slate-900"
      >
        {/* Subtle top overlay to blend with transparent navigation */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none z-10" />

        <div className="relative z-10 text-center px-5 max-w-2xl">
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-5xl font-sans font-extrabold text-white mb-4 tracking-tight select-none">
              Our Story
            </h1>
            <p className="text-slate-200/90 max-w-md mx-auto text-xs md:text-sm leading-relaxed font-normal">
              Tracing the journey of Friendszone, from a small WhatsApp group to a global digital community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-5 pt-12 space-y-20">
        
        {/* Mission & Vision - Simplified Container without complex background elements */}
        <motion.div 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white border border-[var(--border)] rounded-xl p-6 md:p-10 shadow-sm"
        >
          <div className="space-y-4">
            {/* Simple Label text without Box overlay */}
            <div className="flex items-center gap-1.5 text-[var(--purple)] text-xs font-semibold uppercase tracking-wider">
              <Target size={14} /> Our Mission
            </div>
            
            <h2 className="text-2xl md:text-3xl font-sans font-bold leading-snug tracking-tight text-slate-900">
              Connecting Hearts, Across Borders.
            </h2>
            
            <p className="text-[var(--text-muted)] text-sm leading-relaxed font-normal max-w-3xl">
              Founded by <strong className="text-slate-900 font-semibold">Fanra</strong>, Friendszone was born from a simple yet powerful idea: creating a safe, vibrant space where anyone can introduce themselves and find real human connections in an increasingly digital world.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h4 className="font-bold text-sm text-slate-800 mb-1">Authenticity</h4>
                <p className="text-xs text-[var(--text-dim)] font-normal leading-relaxed">
                  We value real stories and genuine personalities over filtered perfection.
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h4 className="font-bold text-sm text-slate-800 mb-1">Inclusive Space</h4>
                <p className="text-xs text-[var(--text-dim)] font-normal leading-relaxed">
                  From hobbyists to professionals, everyone has a place in the Friendszone.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Timeline - Styled neutrally with clean layouts */}
        <motion.section 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <h3 className="text-xl font-sans font-bold text-slate-900">The Journey</h3>
          
          <div className="space-y-8 relative before:content-[''] before:absolute before:left-5 before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
            
            <div className="relative pl-12">
              <div className="absolute left-3 top-1.5 w-4.5 h-4.5 rounded-full bg-[var(--purple)] border-4 border-white shadow"></div>
              <div className="text-[10px] font-semibold text-[var(--text-dim)] mb-0.5">The Beginning</div>
              <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Smartphone size={15} className="text-slate-500" /> WhatsApp Roots
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-normal max-w-2xl">
                It all started on WhatsApp. Fanra envisioned a group dedicated to Indonesians who wanted to broaden their social circles and share their lives beyond traditional social media.
              </p>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-3 top-1.5 w-4.5 h-4.5 rounded-full bg-cyan-600 border-4 border-white shadow"></div>
              <div className="text-[10px] font-semibold text-[var(--text-dim)] mb-0.5">Growth Phase</div>
              <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Layout size={15} className="text-slate-500" /> Expanding Platforms
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-normal max-w-2xl">
                As the community outgrew WhatsApp's limits, we expanded. What was once a small group became a multi-platform ecosystem where members could connect via various channels and tools.
              </p>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-3 top-1.5 w-4.5 h-4.5 rounded-full bg-slate-700 border-4 border-white shadow"></div>
              <div className="text-[10px] font-semibold text-[var(--text-dim)] mb-0.5">Current Era</div>
              <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Globe size={15} className="text-slate-500" /> Truly International
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-normal max-w-2xl">
                Today, Friendszone is home to people from all over the world. We've bridged the gap between cultures, languages, and timezones, staying true to our goal of making the world feel a little smaller and a lot friendlier.
              </p>

              <div className="mt-5 p-5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60 shadow-sm flex items-center gap-4 max-w-xl">
                <Rocket size={28} className="shrink-0 text-[var(--purple)]" />
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Next Stop: Your Experience.</h5>
                  <p className="text-xs text-slate-600 font-normal mt-0.5">Join our growing ecosystem and find your place in the global community.</p>
                </div>
              </div>
            </div>

          </div>
        </motion.section>

        {/* Gallery Section - Perfectly Static without Zoom and hover scale/caption */}
        <motion.section 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-sans font-bold flex items-center gap-2 text-slate-900">
              <Image size={18} className="text-[var(--purple)]" /> Community Gallery
            </h3>
            <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">Moments Captured</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[220px]">
            {galleryImages.map((img) => (
              <div 
                key={img.id}
                className={`relative rounded-xl overflow-hidden border border-[var(--border)] shadow-sm ${
                  img.size === "large" ? "col-span-2 row-span-2" : 
                  img.size === "medium" ? "row-span-2" : ""
                }`}
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-full object-cover animate-none" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Core Values Section - Flat and clean layout, strictly NO background boxes or circles on icons */}
        <motion.section 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-900 tracking-tight">
              What We Believe In
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { 
                title: "Inclusion", 
                desc: "Everyone has a seat at the table. We celebrate diversity and welcome all walks of life.", 
                icon: <User size={22} className="text-blue-500" /> 
              },
              { 
                title: "Authenticity", 
                desc: "No filters, no fake personas. We encourage being your true self in every interaction.", 
                icon: <Check size={22} className="text-green-500" /> 
              },
              { 
                title: "Deep Connection", 
                desc: "Moving beyond surface-level small talk to foster meaningful, lasting friendships.", 
                icon: <LayoutGrid size={22} className="text-purple-500" /> 
              }
            ].map((value, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white border border-[var(--border)] shadow-sm"
              >
                {/* No background box wrapper for icons */}
                <div className="mb-3 text-slate-700">
                  {value.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{value.title}</h3>
                <p className="text-xs text-[var(--text-dim)] font-normal leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Modest Timeline - Styled neutrally */}
        <motion.section 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-900 tracking-tight">
              Our Journey
            </h2>
            <p className="text-xs text-[var(--text-dim)] mt-1 font-normal">From a small chat group to a growing digital sanctuary.</p>
          </div>

          <div className="relative">
            {/* Center column line for large devices */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 hidden md:block"></div>
            
            <div className="space-y-6">
              {[
                { date: "January 2026", title: "The Spark", desc: "Started as a small WhatsApp group for tech enthusiasts looking for real human connection.", icon: <Users size={16} /> },
                { date: "March 2026", title: "First Meetup", desc: "Our first regional gathering in Bali with 50+ members joining from across the island.", icon: <Globe size={16} /> },
                { date: "June 2026", title: "1K Milestone", desc: "Reached 1,000 verified members across Southeast Asia, fostering true peer-to-peer relationships.", icon: <Star size={16} /> },
                { date: "September 2026", title: "Digital Evolution", desc: "Launched Version 2.0 of the Friendszone platform to provide a better, safer social experience.", icon: <Rocket size={16} /> }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`relative flex items-center justify-between w-full ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="hidden md:block w-[45%]"></div>
                  
                  {/* Small round dynamic timeline badge */}
                  <div className="absolute left-0 md:left-1/2 md:-ml-4.5 w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center z-10 border border-slate-200">
                    {item.icon}
                  </div>
                  
                  <div className="w-full md:w-[45%] pl-12 md:pl-0">
                    <div className="p-5 rounded-xl bg-white border border-[var(--border)] shadow-sm">
                      <span className="text-[var(--purple)] font-semibold text-[10px] uppercase tracking-wider">{item.date}</span>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5 mb-1">{item.title}</h3>
                      <p className="text-xs text-[var(--text-dim)] font-normal leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ Section - Clean Accordion structure integrated perfectly with Landing styles */}
        <motion.section 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-[var(--text-dim)] mt-1 font-normal">Common inquiries from our community members.</p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-[var(--border2)] rounded-lg overflow-hidden transition-all duration-300 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs md:text-sm font-medium text-slate-800">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: activeFaq === idx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} className="text-slate-500" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-4 py-3.5 bg-white border-t border-[var(--border)] text-xs leading-relaxed text-slate-600 font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section - Scaled down elegant card layout */}
        <motion.section 
          initial={{ y: 35, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="overflow-hidden rounded-xl border border-[var(--border)] bg-slate-50 p-8 md:p-12 relative text-center"
        >
          <div className="relative z-10 max-w-xl mx-auto space-y-2">
            <h2 className="text-xl md:text-2.5xl font-sans font-bold text-slate-900 tracking-tight">
              Ready to Join the Inner Circle?
            </h2>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal italic">
              "A stranger is just a friend you haven't met yet." — Let's start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 max-w-xs mx-auto">
              <a 
                href="https://chat.whatsapp.com/IkJ1i2lSsiz3tBNAAR9K32"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center block px-5 py-2.5 bg-[var(--purple)] text-white font-semibold rounded-lg shadow-sm hover:scale-[1.01] active:scale-95 transition-all text-xs cursor-pointer"
              >
                Join Community
              </a>
            </div>
          </div>
        </motion.section>

      </div>
    </motion.div>
  );
};
