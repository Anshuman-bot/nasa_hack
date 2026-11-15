import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [trailing, setTrailing] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Only enable custom cursor for non-touch pointers
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('.interactive-hover'))
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth trailing physics
    let animId: number;
    const animateTrailing = () => {
      setTrailing((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.22,
          y: prev.y + dy * 0.22,
        };
      });
      animId = requestAnimationFrame(animateTrailing);
    };
    animId = requestAnimationFrame(animateTrailing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, [position.x, position.y, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="hidden lg:block pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {/* Precision Core Dot (Bright Yellow) */}
      <div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-yellow -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out shadow-[0_0_8px_#FFE500]"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${isHovered ? 2.5 : 1})`,
        }}
      />

      {/* Trailing Radar Reticle Ring (Royal Blue / Yellow border) */}
      <div
        className={`fixed top-0 left-0 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out border ${
          isHovered
            ? 'w-14 h-14 border-yellow bg-yellow/10 scale-110'
            : 'w-8 h-8 border-royal-400/80 bg-royal-600/10 scale-100'
        }`}
        style={{
          transform: `translate3d(${trailing.x}px, ${trailing.y}px, 0)`,
        }}
      />
    </div>
  );
};