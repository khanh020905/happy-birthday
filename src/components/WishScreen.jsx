import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const FLOATERS = ['💕', '💖', '✨', '🌸', '💗', '⭐', '💫', '🌟', '💝', '🎀', '🌺', '💞'];

function SplitChars({ text }) {
  return (
    <>
      {Array.from(text).map((char, i) => (
        <span
          key={i}
          className="char"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {char}
        </span>
      ))}
    </>
  );
}

function SplitWords({ text }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="word" style={{ display: 'inline-block' }}>{word}</span>
          {i < words.length - 1 && <span style={{ display: 'inline-block', width: '0.5ch' }}>&nbsp;</span>}
        </React.Fragment>
      ))}
    </>
  );
}

export default function WishScreen({ onBack }) {
  const containerRef = useRef(null);
  const cardRef     = useRef(null);
  const line1Ref    = useRef(null);
  const line2Ref    = useRef(null);
  const line3Ref    = useRef(null);
  const dividerRef  = useRef(null);
  const cursorRef   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });

      // ── Card slides up ──
      gsap.set(cardRef.current, { y: 70, opacity: 0 });
      tl.to(cardRef.current, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' });

      // ── Line 1: characters scatter from center then snap back ──
      const chars1 = line1Ref.current.querySelectorAll('.char');
      gsap.set(chars1, {
        x: () => gsap.utils.random(-200, 200),
        y: () => gsap.utils.random(-130, 130),
        rotation: () => gsap.utils.random(-100, 100),
        scale: () => gsap.utils.random(0.1, 1.8),
        opacity: 0,
      });
      tl.to(chars1, {
        x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
        duration: 1.1,
        stagger: { each: 0.035, from: 'center' },
        ease: 'back.out(1.6)',
      }, '-=0.25');

      // ── Divider draws from center outward ──
      gsap.set(dividerRef.current, { scaleX: 0, transformOrigin: 'center' });
      tl.to(dividerRef.current, { scaleX: 1, duration: 0.55, ease: 'power2.out' }, '-=0.15');

      // ── Line 2: each word elastic-bounces in ──
      const words2 = line2Ref.current.querySelectorAll('.word');
      gsap.set(words2, { scale: 0, opacity: 0, y: 25 });
      tl.to(words2, {
        scale: 1, opacity: 1, y: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'elastic.out(1.1, 0.45)',
      }, '-=0.15');

      // ── Line 3: fade in word by word ──
      const words3 = line3Ref.current.querySelectorAll('.word');
      gsap.set(words3, { opacity: 0, y: 10 });
      tl.to(words3, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.15,
      }, '+=0.25');

      // Show blinking cursor after typewriter ends
      tl.set(cursorRef.current, { opacity: 1 }, `+=${words3.length * 0.15 + 0.1}`);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleBack = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.97,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: onBack,
    });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 55%, #1e0040 0%, #0a0010 100%)' }}
    >
      {/* Floating emoji particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {FLOATERS.map((emoji, i) => (
          <span
            key={i}
            className="absolute select-none"
            style={{
              left: `${(i * 8.3) % 100}%`,
              bottom: '-2.5rem',
              fontSize: `${1.1 + (i % 3) * 0.45}rem`,
              '--duration': `${4 + (i % 5)}s`,
              '--delay': `${i * 0.65}s`,
              animation: `floatUp var(--duration) ease-in var(--delay) infinite`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Glass card */}
      <div
        ref={cardRef}
        className="relative max-w-2xl w-full mx-4 sm:mx-8 text-center px-6 sm:px-14 py-14 sm:py-18 rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,107,157,0.22)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 0 50px rgba(255,107,157,0.1), 0 0 100px rgba(201,177,255,0.06), 0 30px 70px rgba(0,0,0,0.55)',
        }}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-5 text-white/35 hover:text-white/75 text-sm transition-colors duration-200 pointer-events-auto"
        >
          ← Back
        </button>

        {/* Line 1 — scatter reveal */}
        <div
          ref={line1Ref}
          className="font-cursive mb-3 leading-tight"
          style={{
            fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
            background: 'linear-gradient(135deg, #ffda63 0%, #ff9f68 45%, #ff6b9d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          <SplitChars text="Happy Birthday! 🎂" />
        </div>

        {/* Divider */}
        <div
          ref={dividerRef}
          style={{
            width: '150px',
            height: '1px',
            margin: '0 auto 1.4rem',
            background: 'linear-gradient(to right, transparent, #ff6b9d 30%, #c9b1ff 70%, transparent)',
          }}
        />

        {/* Line 2 — word elastic bounce */}
        <div
          ref={line2Ref}
          className="font-cursive text-pink-300 mb-6 leading-snug"
          style={{ fontSize: 'clamp(1.5rem, 3.8vw, 2.4rem)' }}
        >
          <SplitWords text="Chúc mừng sinh nhật Thanh Nhàn 🌸" />
        </div>

        {/* Line 3 — word by word fade */}
        <div
          ref={line3Ref}
          className="text-purple-300 font-light tracking-wide leading-relaxed mt-4"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontFamily: 'var(--font-handwriting)' }}
        >
          <SplitWords text="Chúc Nhàn tuổi mới luôn xinh tươi, rạng rỡ và ngập tràn hạnh phúc. Mong mọi điều tốt đẹp nhất sẽ đến với Nhàn nhé! ✨" />
          <span
            ref={cursorRef}
            className="animate-pulse"
            style={{ opacity: 0, marginLeft: '4px', borderRight: '2px solid #c9b1ff', display: 'inline-block', height: '1.2em', verticalAlign: 'middle' }}
          >
            &nbsp;
          </span>
        </div>
      </div>
    </div>
  );
}
