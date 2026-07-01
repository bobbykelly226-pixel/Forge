'use client';

import Header from '../components/Header';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        choice: selectedOption,
        comment: comment || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToPoll = () => {
    document.getElementById('feedback-poll')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getFollowUpPrompt = () => {
    if (selectedOption === "I'd definitely join") return "What excites you most about Forge?";
    if (selectedOption === "I'd consider it") return "What's keeping you from saying yes today?";
    return "What would make Forge more valuable to you?";
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#222222]">
      <Header />

      {/* Mobile Hero */}
      <div className="md:hidden">
        <div className="relative h-[360px] bg-cover bg-center" style={{ backgroundImage: "url('/hero-mobile.JPG')" }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
        </div>

        <div className="px-6 -mt-8 relative z-10 bg-[#F8F6F2] rounded-t-3xl pt-10 pb-12">
          <h1 className="text-5xl font-bold tracking-tight text-[#0B2D5C] leading-none mb-6">
            Strong Values.<br />
            <span className="text-[#D62828]">Strong Connections.</span>
          </h1>
          <p className="text-[19px] text-[#444444] leading-relaxed mb-8">
            Forge was built for people who believe the strongest relationships begin with shared values. 
            If you're looking for something rooted in faith, family, commitment, and purpose, you're in the right place.
          </p>
          
          <button 
            onClick={scrollToPoll}
            className="w-full bg-[#D62828] hover:bg-[#A61F1F] text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-200 mb-4"
          >
            Take Our Poll →
          </button>
          
          <p className="text-[15px] text-[#666666] text-center">
            Help us build Forge before launch. Your feedback takes less than 30 seconds.
          </p>
        </div>
      </div>

      {/* Desktop Hero */}
      <div className="hidden md:block relative w-full h-[410px] flex items-center bg-cover bg-[center_28%]" style={{ backgroundImage: "url('/hero-couple.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F6F2] via-[#F8F6F2]/96 to-transparent" style={{ width: '78%' }}></div>
        <div className="relative z-10 max-w-4xl px-6 md:pl-20 text-left pt-8 md:pt-12">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.02em] leading-none text-[#0B2D5C] mb-6">
            Strong Values.<br />
            <span className="text-[#D62828]">Strong Connections.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#444444] max-w-lg mb-8">
            Forge was built for people who believe the strongest relationships begin with shared values. 
            If you're looking for something rooted in faith, family, commitment, and purpose, you're in the right place.
          </p>
          <button 
            onClick={scrollToPoll}
            className="bg-[#D62828] hover:bg-[#A61F1F] hover:-translate-y-0.5 hover:shadow-lg text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 inline-block mb-3"
          >
            Take Our Poll →
          </button>
          <p className="text-[15px] text-[#666666] max-w-xs">
            Help us build Forge before launch. Your feedback takes less than 30 seconds.
          </p>
        </div>
      </div>

      {/* Horizontal Values Section */}
      <div className="bg-[#F4F4F4] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold tracking-tight text-[#0B2D5C] text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-6">
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-faith.png" alt="Faith" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">FAITH</h3>
              <p className="text-sm text-[#444444] text-center">Build a relationship with a foundation that matters.</p>
            </div>
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-family.png" alt="Family" className="w-24 h-24 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">FAMILY</h3>
              <p className="text-sm text-[#444444] text-center">Find someone who values family as much as you do.</p>
            </div>
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-service.png" alt="Service" className="w-24 h-24 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">SERVICE</h3>
              <p className="text-sm text-[#444444] text-center">Connect with people who lead with purpose and give with heart.</p>
            </div>
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-commitment.png" alt="Commitment" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">COMMITMENT</h3>
              <p className="text-sm text-[#444444] text-center">Look for relationships built on loyalty, trust, and lasting commitment.</p>
            </div>
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-integrity.png" alt="Integrity" className="w-20 h-20 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">INTEGRITY</h3>
              <p className="text-sm text-[#444444] text-center">Find someone whose actions match their values and words.</p>
            </div>
            <div className="text-center px-4 flex flex-col items-center">
              <div className="h-28 flex items-center justify-center mb-4">
                <img src="/icon-responsibility.png" alt="Responsibility" className="w-24 h-24 object-contain" />
              </div>
              <h3 className="font-semibold text-[#0B2D5C] mb-2">RESPONSIBILITY</h3>
              <p className="text-sm text-[#444444] text-center">Connect with people who take ownership of their lives and future.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Forge Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#D62828] uppercase tracking-widest text-sm font-medium mb-3">ABOUT FORGE</p>
            <h2 className="text-4xl sm:text-5xl leading-tight font-bold tracking-tight text-[#0B2D5C] mb-8">
              Meaningful relationships don’t happen by chance.<br />
              <span className="text-[#D62828]">They’re forged by design.</span>
            </h2>
            <p className="text-lg text-[#444444] leading-relaxed mb-8">
              Forge is a values-first dating platform for people who are tired of surface-level connections and ready for something real. 
              We believe the strongest relationships are built on shared values, mutual respect, and a commitment to something greater than ourselves.
            </p>
            <a href="/about" className="inline-flex items-center gap-3 bg-[#0B2D5C] hover:bg-[#0A2540] text-white px-8 py-4 rounded-xl font-semibold transition">
              Learn More About Forge →
            </a>
          </div>
          <div className="flex justify-center md:justify-end">
            <img src="/Logos/forgedinlife-full-dark.png" alt="Forge" className="max-w-[380px] w-full" />
          </div>
        </div>
      </div>

      {/* Feedback Poll Section */}
      <div id="feedback-poll" className="bg-white py-20 border-t">
        <div className="max-w-[850px] mx-auto px-6">
          <div className="bg-white border border-[#0B2D5C]/10 rounded-3xl p-12 shadow-sm">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold text-[#0F2D52] leading-tight mb-4">
                Forge is being built for people who believe meaningful relationships start with shared values.
              </h2>
              <p className="text-lg text-[#444444]">
                You're one of the first people to see Forge. Help us build it right.
              </p>
            </div>

            <p className="text-xl font-medium text-[#0F2D52] text-center mb-10">
              If Forge launched today, would you join?
            </p>

            {!submitted ? (
              <div className="space-y-3 max-w-md mx-auto">
                {[
                  "I'd definitely join",
                  "I'd consider it",
                  "I probably wouldn't"
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full py-4 px-8 rounded-2xl border text-lg font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                      selectedOption === option 
                        ? "bg-[#0F2D52] text-white border-[#0F2D52]" 
                        : "bg-white hover:bg-[#F8F6F2] border-[#0B2D5C]/30 hover:border-[#0B2D5C]"
                    }`}
                  >
                    {option}
                  </button>
                ))}

                {selectedOption && (
                  <div className="mt-10">
                    <label className="block text-sm font-medium text-[#444444] mb-3 text-center">
                      {getFollowUpPrompt()}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full p-5 border border-[#0B2D5C]/20 rounded-2xl focus:outline-none focus:border-[#0F2D52] min-h-[110px] text-base"
                    />
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={isSubmitting}
                      className="mt-6 w-full bg-[#D62828] hover:bg-[#A61F1F] text-white py-5 rounded-2xl font-semibold transition disabled:opacity-70"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-2xl text-[#0F2D52] font-medium mb-4">
                  Thank you — that really helps.
                </p>
                
                {(selectedOption === "I'd definitely join" || selectedOption === "I'd consider it") ? (
                  <div>
                    <p className="text-[#444444] mb-8 max-w-sm mx-auto">
                      Welcome to the beginning of Forge.<br />
                      Your feedback is helping shape a dating platform built on faith, family, commitment, and shared values.
                    </p>
                    <a href="/waitlist" className="inline-block bg-[#D62828] hover:bg-[#A61F1F] text-white px-10 py-4 rounded-2xl font-semibold transition">
                      Support the Launch
                    </a>
                  </div>
                ) : (
                  <p className="text-[#444444]">
                    Thank you for your honest feedback.<br />
                    Every response helps us improve Forge.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0B2D5C] text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <img src="/Logos/forgedinlife-header-light.png" alt="Forge" className="h-12 w-auto" />
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm">
              <Link href="/about" className="hover:text-white transition">About</Link>
              <Link href="/values" className="hover:text-white transition">Values</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white transition">Contact</Link>
            </div>

            <div className="flex gap-8 text-2xl">
              <a
    href="https://www.facebook.com/profile.php?id=61591000607513"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Facebook"
    className="hover:text-white transition"
  >
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.9h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z" />
    </svg>
  </a>
              <a
    href="https://www.instagram.com/forgedconnections/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    className="hover:text-white transition"
  >
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2zm0 2A3.76 3.76 0 0 0 4 7.75v8.5A3.76 3.76 0 0 0 7.75 20h8.5A3.76 3.76 0 0 0 20 16.25v-8.5A3.76 3.76 0 0 0 16.25 4h-8.5zM12 7.35A4.65 4.65 0 1 1 12 16.65 4.65 4.65 0 0 1 12 7.35zm0 2A2.65 2.65 0 1 0 12 14.65 2.65 2.65 0 0 0 12 9.35zm5.1-2.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
    </svg>
  </a>
            </div>
          </div>

          <div className="text-center text-xs text-white/60 mt-6">
            © 2026 Forged In Life. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}