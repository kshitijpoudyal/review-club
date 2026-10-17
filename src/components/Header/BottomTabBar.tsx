import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeftRight, Package, Settings } from 'lucide-react';
import { springSnappy } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TABS = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/** Phone navigation: a fixed tab bar in place of the old hamburger drawer. */
export default function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="material-chrome fixed inset-x-0 bottom-0 z-40 border-t border-border/80 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid h-[3.5rem] grid-cols-3">
        {TABS.map(({ name, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            className="group flex flex-col items-center justify-center gap-1 pt-1 focus:outline-none"
          >
            {({ isActive }) => (
              <>
                <span className="relative flex h-7 w-14 items-center justify-center">
                  {isActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      transition={springSnappy}
                      className="absolute inset-0 rounded-full bg-primary/10"
                    />
                  )}
                  {/* Shrinks on touch-down, before the tap commits */}
                  <Icon
                    className={cn(
                      'relative h-[1.375rem] w-[1.375rem] transition-[color,transform] duration-150 group-active:scale-[0.88] group-active:duration-75 group-focus-visible:text-primary',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                </span>
                <span
                  className={cn(
                    'text-[0.6875rem] leading-none tracking-[0.01em] transition-colors',
                    isActive ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
                  )}
                >
                  {name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
