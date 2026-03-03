'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export function ScrollToTop({ scrollContainerRef }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => setVisible(el.scrollTop > 200);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`
        fixed bottom-6 right-6 z-50
        w-11 h-11 rounded-full
        bg-primary text-white shadow-lg
        flex items-center justify-center
        transition-all duration-300 ease-in-out
        hover:bg-primary/90 hover:scale-110 hover:shadow-xl
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
}
