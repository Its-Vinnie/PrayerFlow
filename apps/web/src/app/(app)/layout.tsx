'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Radio,
  LayoutTemplate,
  ScrollText,
} from 'lucide-react';

const navItems = [
  { href: '/sessions', label: 'Sessions', icon: BookOpen },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/logs', label: 'Logs', icon: ScrollText },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide bottom nav on live dashboard for distraction-free experience
  const isLivePage = pathname?.includes('/live');

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Main content area */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      {!isLivePage && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
          {/* Safe area padding for mobile */}
          <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2
                    transition-all duration-200
                    ${
                      isActive
                        ? 'text-accent'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -top-1 h-0.5 w-5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--gold),0.5)]" />
                  )}

                  <Icon
                    className={`size-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : ''
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Home indicator safe area */}
          <div className="h-safe-area-inset-bottom bg-background/70" />
        </nav>
      )}
    </div>
  );
}
