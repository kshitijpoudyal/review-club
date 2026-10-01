import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { User } from 'firebase/auth';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { APP_VERSION } from '../../utils/version';

interface AppHeaderProps {
    user: User;
    onLogout: () => void;
}

export default function AppHeader({ user, onLogout }: AppHeaderProps) {
    const location = useLocation();
    const navigation = [
        { name: 'Products', href: '/products' },
        { name: 'PayPal', href: '/paypal' },
    ]

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [installPrompt, setInstallPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
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
        <header className={`${colors.header.background}`}>
            <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
                {/* Brand + Nav */}
                <div className="flex items-center gap-x-6">
                    <span className={`${typography.bodyStrong} text-white tracking-tight select-none`}>
                        📦 Review Tracker
                    </span>
                    <div className="hidden md:flex md:gap-x-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href ||
                                location.pathname.startsWith(item.href);
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className={`${typography.bodyStrong} px-3 py-1.5 rounded-full transition-all ${
                                        isActive 
                                            ? 'text-white bg-white/20' 
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.name}
                                </a>
                            );
                        })}
                    </div>
                </div>
                <div className="flex md:hidden items-center gap-3">
                    <a
                        href="https://www.kshitijstudio.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${typography.caption} text-white hover:text-white/80 transition-colors`}
                    >
                        Powered by KshitijStudio
                    </a>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 ${colors.header.mobile.menuButton}`}
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <a
                    href="https://www.kshitijstudio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${typography.caption} text-white hover:text-white/80 transition-colors`}
                  >
                    Powered by KshitijStudio
                  </a>
                  {/* User icon with dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(v => !v)}
                      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all text-white/70 hover:text-white"
                      aria-label="User menu"
                    >
                      <UserCircleIcon className="w-7 h-7" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          <p className="text-xs text-gray-300 mt-0.5">v{APP_VERSION}</p>
                        </div>
                        {installPrompt && (
                          <button
                            onClick={() => { setUserMenuOpen(false); handleInstall(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-100"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 text-[#006a68]" />
                            Install App
                          </button>
                        )}
                        <a
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          Settings
                        </a>
                        <button
                          onClick={() => { setUserMenuOpen(false); onLogout(); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Log out →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="md:hidden">
                <div className="fixed inset-0 z-50" />
                <DialogPanel className={`fixed inset-y-0 right-0 z-50 w-full overflow-y-auto ${colors.header.background} p-4 sm:max-w-sm sm:ring-1 ${colors.header.mobile.ring}`}>
                    <div className="flex items-center justify-between">
                        <p className={`text-sm/6 font-semibold ${colors.header.navigation.link} py-2`}>Welcome {displayName}!</p>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`-m-2.5 rounded-md p-2.5 ${colors.header.mobile.closeButton}`}
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className={`-my-6 divide-y ${colors.header.mobile.divider}`}>
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => {
                                    const isActive = location.pathname === item.href ||
                                location.pathname.startsWith(item.href);
                                    return (
                                        <a
                                            key={item.name}
                                            href={item.href}
                                            className={`-mx-3 block rounded-xl px-3 py-2 text-base/7 font-semibold ${
                                                isActive
                                                    ? 'text-white bg-white/20'
                                                    : `${colors.header.mobile.menuLink}`
                                            }`}
                                        >
                                            {item.name}
                                        </a>
                                    );
                                })}
                            </div>
                            <div className="py-6 space-y-1">
                                {installPrompt && (
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); handleInstall(); }}
                                        className={`-mx-3 w-full text-left rounded-lg px-3 py-2.5 text-base/7 font-semibold flex items-center gap-2 ${colors.header.mobile.menuLink}`}
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                        Install App
                                    </button>
                                )}
                                <a
                                    href="/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold ${colors.header.mobile.menuLink}`}
                                >
                                    Settings
                                </a>
                                <a
                                    href="#"
                                    onClick={onLogout}
                                    className={`-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold ${colors.header.mobile.menuLink}`}
                                >
                                    Log out
                                </a>
                            </div>
                        </div>
                        <div className="pt-4 text-center space-y-1">
                            <a
                                href="https://www.kshitijstudio.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${typography.caption} text-white hover:text-white/80 transition-colors`}
                            >
                                Powered by KshitijStudio
                            </a>
                            <p className={`${typography.caption} text-white/50`}>v{APP_VERSION}</p>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}
