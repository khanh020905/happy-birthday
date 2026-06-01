import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { Howl } from 'howler';
import BirthdayScene from './components/BirthdayScene';
import WishScreen from './components/WishScreen';

function App() {
  const [started, setStarted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const [showWishScreen, setShowWishScreen] = useState(false);

  const titleRef    = useRef(null);
  const subtitleRef = useRef(null);
  const glowRef     = useRef(null);
  const wishRef     = useRef(null);
  const flashRef    = useRef(null);
  const buttonRef   = useRef(null);
  const crowdAudioRef = useRef(null);
  const songAudioRef  = useRef(null);

  useEffect(() => {
    crowdAudioRef.current = new Howl({
      src: ['/assets/crowd.mp3'],
      volume: 1.0,
      onend: () => {
        if (songAudioRef.current) {
          songAudioRef.current.play();
          songAudioRef.current.fade(0, 0.7, 2000);
        }
      }
    });

    songAudioRef.current = new Howl({
      src: ['/assets/birthday-song.mp3'],
      loop: true,
      volume: 0,
    });
  }, []);

  // Animate button in when it becomes visible
  useEffect(() => {
    if (showButton && buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.5)' }
      );
    }
  }, [showButton]);

  const handleStart = () => {
    if (started) return;
    setStarted(true);
    setShowOverlay(false);

    if (crowdAudioRef.current) {
      crowdAudioRef.current.play();
    }

    const tl = gsap.timeline();

    tl.to(glowRef.current, { opacity: 0.3, duration: 1.2, ease: 'power2.inOut' }, 0.8);
    tl.to(titleRef.current, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.5)' }, 3.0);
    tl.to(subtitleRef.current, { opacity: 1, duration: 1, ease: 'power2.out' }, 3.5);
    tl.to(titleRef.current, { scale: 1.05, yoyo: true, repeat: 2, duration: 0.4, ease: 'power1.inOut' }, 4.5);

    // Show the message button after cake reveal completes (~5.5s)
    setTimeout(() => setShowButton(true), 5500);
  };

  const handleFinale = useCallback(() => {
    gsap.timeline()
      .to(flashRef.current, { opacity: 0.6, duration: 0.1 })
      .to(flashRef.current, { opacity: 0, duration: 0.3 });

    gsap.timeline()
      .to(wishRef.current, { opacity: 1, duration: 1 })
      .to(wishRef.current, { opacity: 0, duration: 1, delay: 4 });
  }, []);

  const handleOpenWish = () => {
    // Fade button out, then show screen
    gsap.to(buttonRef.current, {
      y: 20, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => setShowWishScreen(true),
    });
  };

  const handleCloseWish = () => {
    setShowWishScreen(false);
    // Re-animate the button back in
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.5)', delay: 0.1 }
      );
    }
  };

  return (
    <>
      {/* Click to begin overlay */}
      <div
        className={`absolute inset-0 bg-black z-50 flex items-center justify-center cursor-pointer transition-opacity duration-500 ${!showOverlay ? 'opacity-0 pointer-events-none' : ''}`}
        onClick={handleStart}
      >
        <div className="text-3xl sm:text-4xl text-white text-shadow-white animate-pulse-custom font-cursive">
          🎂 Click anywhere to celebrate!
        </div>
      </div>

      {/* Intro Glow */}
      <div
        ref={glowRef}
        className="absolute top-1/2 left-1/2 w-[50vw] h-[50vw] -translate-x-1/2 -translate-y-1/2 z-0 opacity-0 pointer-events-none rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.5) 0%, rgba(255,107,157,0) 70%)' }}
      />

      {/* Flash Overlay */}
      <div ref={flashRef} className="absolute inset-0 bg-white z-20 opacity-0 pointer-events-none" />

      {/* UI Layer — titles */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-start pt-[10vh]">
        <h1 ref={titleRef} className="text-5xl sm:text-6xl text-gradient text-shadow-pink opacity-0 scale-50 mb-2 font-cursive relative z-30">
          Happy Birthday!
        </h1>
        <h2 ref={subtitleRef} className="text-2xl sm:text-3xl text-brand-light-pink opacity-0 font-cursive relative z-30 text-center px-4">
          Chúc mừng sinh nhật Thanh Nhàn!
        </h2>
      </div>

      {/* Finale wish text */}
      <div 
        ref={wishRef} 
        className="absolute bottom-[15vh] left-1/2 -translate-x-1/2 text-4xl text-white text-shadow-wish opacity-0 pointer-events-none font-handwriting z-20 whitespace-nowrap"
      >
        Make a wish! ✨
      </div>

      {/* Open message button — appears after cake reveal */}
      {started && showButton && !showWishScreen && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <button
            ref={buttonRef}
            onClick={handleOpenWish}
            className="pointer-events-auto px-8 py-4 rounded-full font-cursive text-lg sm:text-xl text-white
                       border border-pink-400/40 backdrop-blur-sm
                       hover:scale-105 active:scale-95 transition-transform duration-150
                       animate-pulse-glow"
            style={{
              opacity: 0,
              background: 'linear-gradient(135deg, rgba(255,107,157,0.22), rgba(201,177,255,0.22))',
            }}
          >
            💌 Open your message
          </button>
        </div>
      )}

      {/* Wish Screen */}
      {showWishScreen && <WishScreen onBack={handleCloseWish} />}

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <BirthdayScene started={started} onFinale={handleFinale} />
      </div>
    </>
  );
}

export default App;
