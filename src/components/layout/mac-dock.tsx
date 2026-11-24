'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
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
  const scrollOffset = useMotionValue<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Update center focus position during mobile touch swipe / scroll
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const scrollPos = el.scrollLeft;
    scrollOffset.set(scrollPos);

    if (isTouchDevice) {
      setIsScrolling(true);
      // Center position of container on screen
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      pointerX.set(centerX);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        // After scrolling stops, smoothly return all icons to normal resting size
        pointerX.set(Infinity);
      }, 450);
    }
  }, [isTouchDevice, pointerX, scrollOffset]);

  // Touch Move / Drag continuous tracking
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      setIsScrolling(true);
      const touch = e.touches[0];
      pointerX.set(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      pointerX.set(Infinity);
    }, 400);
  };

  // Center active element on route change
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [pathname]);

  return (
    <nav
      aria-label="macOS Navigation Dock"
      className="fixed bottom-3 sm:bottom-5 inset-x-0 z-50 flex justify-center pointer-events-none px-2 sm:px-4"
    >
      {/* Sleek Minimal macOS Floating Dock (No clipping, overflow visible so enlarged icons pop up) */}
      <div
        ref={containerRef}
        onMouseLeave={() => pointerX.set(Infinity)}
        className="pointer-events-auto relative max-w-[94vw] sm:max-w-2xl rounded-2xl border border-white/[0.12] bg-[#101827]/75 backdrop-blur-2xl shadow-[0_16px_36px_rgba(0,0,0,0.55),0_1px_0_rgba(255,255,255,0.12)_inset] px-2 sm:px-3 pt-2 pb-1.5 overflow-visible"
      >
        {/* Horizontal scroll track with hidden scrollbars and generous padding to avoid clipping */}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pt-3 pb-1 px-1 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
          }}
        >
          {items.map((item) => (
            <DockIcon
              key={item.href}
              item={item}
              pointerX={pointerX}
              isActive={pathname === item.href}
              isScrolling={isScrolling}
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
  isScrolling: boolean;
}

function DockIcon({ item, pointerX, isActive, isScrolling }: DockIconProps) {
  const iconRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate distance between icon center and pointer/center focus
  const distance = useTransform(pointerX, (x: number) => {
    if (x === Infinity || x === null || x === undefined) return Infinity;
    const bounds = iconRef.current?.getBoundingClientRect();
    if (!bounds) return Infinity;
    const iconCenter = bounds.left + bounds.width / 2;
    return x - iconCenter;
  });

  // Base icon width: 40px resting, scaling up to 58px on focus/hover
  // Adjacent icons scale smoothly based on Gaussian-like curve
  const sizeSync = useTransform(
    distance,
    [-110, -55, 0, 55, 110],
    [40, 48, 58, 48, 40]
  );
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 220, damping: 18 });

  // Upward elevation pop when magnified (moves outside container naturally)
  const ySync = useTransform(
    distance,
    [-110, -55, 0, 55, 110],
    [0, -4, -12, -4, 0]
  );
  const y = useSpring(ySync, { mass: 0.1, stiffness: 220, damping: 18 });

  // Icon internal scale
  const iconScaleSync = useTransform(
    distance,
    [-110, -55, 0, 55, 110],
    [1.0, 1.15, 1.35, 1.15, 1.0]
  );
  const iconScale = useSpring(iconScaleSync, { mass: 0.1, stiffness: 220, damping: 18 });

  const Icon = item.icon;

  return (
    <motion.div
      style={{
        width: size,
        height: size,
        y: y,
      }}
      className="relative flex flex-col items-center justify-end shrink-0 select-none"
    >
      <Link
        ref={iconRef}
        href={item.href}
        data-active={isActive ? 'true' : 'false'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => pointerX.set(e.clientX)}
        className="relative flex h-full w-full items-center justify-center cursor-pointer transition-colors duration-150 rounded-xl"
        style={{
          /* NO individual card, box, borders, or permanent elevated background */
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        {/* Bare Icon with fluid magnification */}
        <motion.div
          style={{ scale: iconScale }}
          className={`flex items-center justify-center transition-colors duration-200 ${
            isActive
              ? 'text-white drop-shadow-[0_0_8px_rgba(142,169,232,0.85)]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
        </motion.div>

        {/* macOS Active App Indicator Dot (Clean, subtle, non-elevated) */}
        {isActive && (
          <span className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-[#8ea9e8] shadow-[0_0_5px_#8ea9e8]" />
        )}

        {/* macOS Tooltip on Desktop Hover or Active Focus */}
        {hovered && !isScrolling && (
          <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-[#162032]/95 px-2 py-0.5 text-[11px] font-medium text-white shadow-xl backdrop-blur-md whitespace-nowrap z-50">
            {item.title}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
