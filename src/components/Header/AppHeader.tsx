import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserCircleIcon, ArrowDownTrayIcon, Cog6ToothIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import { User } from 'firebase/auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageContainer } from '@/components/common/PageContainer'
import { BrandMark } from '@/components/common/BrandMark'
import { springSnappy } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { typography } from '../../utils/typography';
import { APP_VERSION } from '../../utils/version';
import { NotificationBell } from '../Notifications/NotificationBell';

interface AppHeaderProps {
    user: User;
    onLogout: () => void;
}

type InstallPromptEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

const NAVIGATION = [
    { name: 'Products', href: '/products' },
    { name: 'Transactions', href: '/transactions' },
]

export default function AppHeader({ user, onLogout }: AppHeaderProps) {
    const location = useLocation();
    const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as InstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Lift the bar off the page once content scrolls beneath it
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') setInstallPrompt(null);
    };

    // Safety check - should never be null due to ProtectedRoute, but defensive programming
    if (!user) {
        return null;
    }

    const displayName = user.displayName || user.email || 'User';

    return (
        <header
            className={cn(
                // Translucent bar: the page scrolls underneath it. The hairline
                // only appears once content actually sits beneath the bar.
                'material-chrome sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] transition-colors duration-200',
                scrolled ? 'border-border/80' : 'border-transparent'
            )}
        >
            <PageContainer>
                <nav aria-label="Global" className="flex h-[3.25rem] items-center justify-between">
                    {/* Brand + Nav */}
                    <div className="flex items-center gap-x-6">
                        <Link
                            to="/products"
                            className="pressable select-none inline-flex items-center gap-2 rounded-lg text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <BrandMark />
                            <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em]">Review Club</span>
                        </Link>
                        {/* Segmented control: a track with a sliding thumb under the active page */}
                        <div className="hidden md:flex md:gap-x-0.5 rounded-full bg-secondary/80 p-0.5">
                            {NAVIGATION.map((item) => {
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            'relative px-3.5 py-1 rounded-full text-label font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                            isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-indicator"
                                                transition={springSnappy}
                                                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_rgb(var(--shadow-color)/0.12),0_0_0_0.5px_rgb(var(--shadow-color)/0.06)]"
                                            />
                                        )}
                                        <span className="relative">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <a
                            href="https://www.kshitijstudio.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${typography.caption} hidden lg:inline hover:text-foreground transition-colors`}
                        >
                            Powered by KshitijStudio
                        </a>
                        <NotificationBell />
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="pressable flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-secondary data-[state=open]:text-foreground"
                                aria-label="User menu"
                            >
                                <UserCircleIcon className="w-7 h-7" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel className="font-normal">
                                    <p className={`${typography.bodyStrong} truncate`}>{displayName}</p>
                                    <p className={`${typography.caption} truncate`}>{user.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {installPrompt && (
                                    <DropdownMenuItem onSelect={handleInstall}>
                                        <ArrowDownTrayIcon className="text-brand" />
                                        Install App
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link to="/settings">
                                        <Cog6ToothIcon />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={onLogout}>
                                    <ArrowRightStartOnRectangleIcon />
                                    Log out
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <p className={`${typography.caption} px-3 py-1.5 text-muted-foreground/70`}>
                                    v{APP_VERSION}
                                    <span className="md:hidden"> · Powered by KshitijStudio</span>
                                </p>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </nav>
            </PageContainer>
        </header>
    )
}
