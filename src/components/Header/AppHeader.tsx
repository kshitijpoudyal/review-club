import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserCircleIcon, ArrowDownTrayIcon, Cog6ToothIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import { Package } from 'lucide-react'
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
import { springSoft } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
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
                'sticky top-0 z-40 transition-shadow duration-300',
                colors.header.background,
                scrolled && 'shadow-[0_6px_24px_rgb(var(--shadow-color)/0.28)]'
            )}
        >
            <PageContainer>
                <nav aria-label="Global" className="flex h-14 items-center justify-between">
                    {/* Brand + Nav */}
                    <div className="flex items-center gap-x-6">
                        <Link
                            to="/products"
                            className={`${typography.bodyStrong} text-white tracking-tight select-none inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                                <Package className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="font-display text-[1.0625rem] font-semibold">Review Club</span>
                        </Link>
                        <div className="hidden md:flex md:gap-x-1">
                            {NAVIGATION.map((item) => {
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            typography.bodyStrong,
                                            'relative px-3 py-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                                            isActive ? 'text-white' : 'text-white/70 hover:text-white'
                                        )}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-indicator"
                                                transition={springSoft}
                                                className="absolute inset-0 rounded-full bg-white/20"
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
                            className={`${typography.caption} hidden md:inline text-white/70 hover:text-white transition-colors`}
                        >
                            Powered by KshitijStudio
                        </a>
                        <NotificationBell />
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[state=open]:bg-white/10 data-[state=open]:text-white"
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
