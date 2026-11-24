'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

export interface DockItemData {
  title: string;
  icon: LucideIcon;
  href: string;
}

interface DockProps {
  items: DockItemData[];
}

export function MacDock({ items }: DockProps) {
  const pathname = usePathname();
  const pointerX = useMotionValue<number>(Infinity);
  const trackRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef<boolean>(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll active item into view on route change
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [pathname]);

  // Touch handlers: Update pointerX directly WITHOUT triggering React state re-renders (zero jitter!)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    isInteractingRef.current = true;
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    if (e.touches.length > 0) {
      pointerX.set(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      pointerX.set(Infinity);
    }, 350);
  };

  // Horizontal scroll within dock track updates center-focus magnification
  const handleTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    if (isInteractingRef.current) {
      const rect = el.getBoundingClientRect();
      pointerX.set(rect.left + rect.width / 2);
    }
  };

  return (
    <nav
      aria-label="macOS Navigation Dock"
      className="fixed inset-x-0 z-50 flex justify-center pointer-events-none px-2 sm:px-4"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        contain: 'layout style',
      }}
    >
      {/* Sleek Minimal macOS Floating Dock (Fixed height, overflow visible so icons pop up cleanly) */}
      <div
        onMouseLeave={() => pointerX.set(Infinity)}
        className="pointer-events-auto relative max-w-[94vw] sm:max-w-2xl h-[56px] flex items-center rounded-2xl border border-white/[0.12] bg-[#101827]/85 backdrop-blur-2xl shadow-[0_16px_36px_rgba(0,0,0,0.55),0_1px_0_rgba(255,255,255,0.12)_inset] px-2 sm:px-3 overflow-visible"
        style={{
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Horizontal scroll track with hidden scrollbar */}
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          onTouchStart={() => {
            isInteractingRef.current = true;
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth h-full px-1 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {items.map((item) => (
            <DockIcon
              key={item.href}
              item={item}
              pointerX={pointerX}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

interface DockIconProps {
  item: DockItemData;
  pointerX: any;
  isActive: boolean;
}

function DockIcon({ item, pointerX, isActive }: DockIconProps) {
  const iconRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  // Distance calculation based on pointerX
  const distance = useTransform(pointerX, (x: number) => {
    if (x === Infinity || x === null || x === undefined) return Infinity;
    const bounds = iconRef.current?.getBoundingClientRect();
    if (!bounds) return Infinity;
    const iconCenter = bounds.left + bounds.width / 2;
    return x - iconCenter;
  });

  // Smooth scale transform: icons keep rigid fixed footprint (40px) while visual element magnifies and pops up
  // This guarantees zero container reflow or width jitter!
  const iconScaleSync = useTransform(
    distance,
    [-110, -55, 0, 55, 110],
    [1.0, 1.18, 1.42, 1.18, 1.0]
  );
  const iconScale = useSpring(iconScaleSync, { mass: 0.1, stiffness: 240, damping: 20 });

  // Upward elevation pop
  const ySync = useTransform(
    distance,
    [-110, -55, 0, 55, 110],
    [0, -4, -12, -4, 0]
  );
  const y = useSpring(ySync, { mass: 0.1, stiffness: 240, damping: 20 });

  const Icon = item.icon;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none">
      <Link
        ref={iconRef}
        href={item.href}
        data-active={isActive ? 'true' : 'false'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => pointerX.set(e.clientX)}
        className="relative flex h-full w-full items-center justify-center cursor-pointer rounded-xl"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        {/* Animated Icon: Scales & pops upward without changing slot width */}
        <motion.div
          style={{
            scale: iconScale,
            y: y,
          }}
          className={`flex items-center justify-center transition-colors duration-150 ${
            isActive
              ? 'text-white drop-shadow-[0_0_8px_rgba(142,169,232,0.85)]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
        </motion.div>

        {/* macOS Active App Indicator Dot */}
        {isActive && (
          <span className="absolute bottom-0 h-1 w-1 rounded-full bg-[#8ea9e8] shadow-[0_0_5px_#8ea9e8]" />
        )}

        {/* Desktop Tooltip */}
        {hovered && (
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-[#162032]/95 px-2 py-0.5 text-[11px] font-medium text-white shadow-xl backdrop-blur-md whitespace-nowrap z-50">
            {item.title}
          </div>
        )}
      </Link>
    </div>
  );
}
