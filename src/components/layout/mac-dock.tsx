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
  const mouseX = useMotionValue(Infinity);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds for edge fade hints
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  // Auto-scroll active item into view on page change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [pathname]);

  return (
    <div className="fixed bottom-3 sm:bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-2 sm:px-4">
      {/* Dock Container */}
      <div
        className="pointer-events-auto relative max-w-full rounded-2xl sm:rounded-3xl border border-white/20 bg-[#101827]/85 p-2 sm:p-2.5 shadow-[0_12px_44px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all"
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {/* Scroll Left Indicator Glow */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 rounded-l-2xl sm:rounded-l-3xl bg-gradient-to-r from-[#101827] to-transparent z-10" />
        )}

        {/* Scroll Right Indicator Glow */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 rounded-r-2xl sm:rounded-r-3xl bg-gradient-to-l from-[#101827] to-transparent z-10" />
        )}

        {/* Horizontal scrollable track with hidden scrollbars */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-end gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 sm:px-2 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {items.map((item) => (
            <DockIcon
              key={item.href}
              item={item}
              mouseX={mouseX}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DockIconProps {
  item: DockItemData;
  mouseX: any;
  isActive: boolean;
}

function DockIcon({ item, mouseX, isActive }: DockIconProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  // Distance from pointer to center of icon
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // macOS Magnification curve: size expands from 44px to 64px on hover
  const widthSync = useTransform(distance, [-120, 0, 120], [44, 62, 44]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 14 });

  // Upward pop translation when magnified
  const ySync = useTransform(distance, [-120, 0, 120], [0, -10, 0]);
  const y = useSpring(ySync, { mass: 0.1, stiffness: 180, damping: 14 });

  const Icon = item.icon;

  return (
    <motion.div
      style={{ width, height: width, y }}
      className="relative flex items-center justify-center shrink-0"
    >
      <Link
        ref={ref}
        href={item.href}
        data-active={isActive ? 'true' : 'false'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        className={`group relative flex h-full w-full items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-br from-[#8ea9e8]/30 via-white/10 to-[#8ea9e8]/20 border border-[#8ea9e8]/60 shadow-[0_0_20px_rgba(142,169,232,0.4)] text-white'
            : 'border border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.12] hover:text-foreground hover:border-white/20'
        }`}
      >
        <Icon className={`transition-transform duration-200 ${isActive ? 'scale-110 text-[#8ea9e8]' : 'group-hover:scale-105'}`} size={20} />

        {/* macOS Active Dot Indicator */}
        {isActive && (
          <span className="absolute -bottom-1 h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#8ea9e8] shadow-[0_0_6px_#8ea9e8]" />
        )}

        {/* Hover / Active Tooltip */}
        {(hovered || isActive) && (
          <div className="pointer-events-none absolute -top-8 sm:-top-9 left-1/2 -translate-x-1/2 rounded-lg border border-white/15 bg-[#101827]/95 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-white shadow-xl backdrop-blur-md whitespace-nowrap z-50">
            {item.title}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
