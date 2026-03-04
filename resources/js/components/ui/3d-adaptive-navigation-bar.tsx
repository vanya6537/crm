import React, { useState, useRef, useEffect } from 'react'
import { motion, useSpring, AnimatePresence } from 'framer-motion'
import { Link, router } from '@inertiajs/react'
import { 
    Home, 
    Users, 
    Briefcase, 
    LogOut, 
    Menu, 
    Settings,
    UserCircle,
    Building2,
    LayoutDashboard,
    Zap,
  GitBranch,
  Blocks
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/routes'

interface NavItem {
  label: string
  id: string
  href?: string
  icon?: any
  action?: () => void
}

/**
 * 3D Adaptive Navigation Pill for CRM Mobile
 * Floating burger-menu style at bottom right for easy thumb access
 */
export const CRMAdaptivePill: React.FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', id: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Agents', id: 'agents', href: '/agents', icon: Users },
    { label: 'Buyers', id: 'buyers', href: '/buyers', icon: UserCircle },
    { label: 'Transactions', id: 'transactions', href: '/transactions', icon: Briefcase },
    { label: 'Модели', id: 'models', href: '/model-manager', icon: Blocks },
    { label: 'Processes', id: 'processes', href: '/process-modeler', icon: GitBranch },
    { label: 'Settings', id: 'settings', href: '/settings', icon: Settings },
    { label: 'Log out', id: 'logout', action: () => router.post(logout()), icon: LogOut },
  ]

  // Spring animations for smooth motion
  // We use a smaller base width for the "Burger" state
  const pillWidth = useSpring(56, { stiffness: 220, damping: 25, mass: 1 })

  useEffect(() => {
    const updateWidth = () => {
      if (expanded) {
        // Use larger width for grid layout with small icons
        const targetWidth = Math.min(window.innerWidth * 0.92, 340);
        pillWidth.set(targetWidth);
      } else {
        pillWidth.set(56);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    // Close menu on click/touch outside
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setExpanded(false);
        }
    };

    if (expanded) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
        window.removeEventListener('resize', updateWidth);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expanded, pillWidth])

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  const handleNavigateTo = (href: string) => {
    setExpanded(false);
    // Wait for menu close animation (300-400ms)
    setTimeout(() => {
      router.visit(href);
    }, 350);
  }

  const handleItemClick = (item: NavItem) => {
    setIsTransitioning(true)
    
    if (item.action) {
      item.action()
    }
    
    setExpanded(false)
    
    setTimeout(() => {
      setIsTransitioning(false)
    }, 400)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden" ref={containerRef}>
        <motion.nav
        onPointerDown={(e) => {
          if (!expanded) {
            e.preventDefault();
            toggleExpand();
          }
        }}
        className="relative rounded-full flex items-center justify-center cursor-pointer touch-none"
        style={{
            width: pillWidth,
            height: '56px',
            minHeight: '56px',
            background: `
            linear-gradient(135deg, 
                #fcfcfd 0%, 
                #f8f8fa 15%, 
                #f3f4f6 30%, 
                #eeeff2 45%, 
                #e9eaed 60%, 
                #e4e5e8 75%, 
                #dee0e3 90%, 
                #e2e3e6 100%
            )
            `,
            boxShadow: expanded
            ? `
                0 2px 4px rgba(0, 0, 0, 0.08),
                0 6px 12px rgba(0, 0, 0, 0.12),
                0 12px 24px rgba(0, 0, 0, 0.14),
                inset 0 2px 2px rgba(255, 255, 255, 0.8),
                inset 0 -3px 8px rgba(0, 0, 0, 0.12)
            `
            : `
                0 4px 12px rgba(0, 0, 0, 0.2),
                0 8px 24px rgba(0, 0, 0, 0.15),
                inset 0 2px 1px rgba(255, 255, 255, 0.7),
                inset 0 -2px 6px rgba(0, 0, 0, 0.10)
            `,
            overflow: 'hidden',
        }}
        >
        {/* Glossy Overlay UI */}
        <div 
          className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none h-0.5"
            style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0) 100%)',
            }}
        />

        {/* Content */}
        <div className="relative z-10 w-full h-full flex items-center px-4 overflow-hidden">
            {!expanded ? (
                <div className="w-full h-full flex items-center justify-center">
                    <Menu className="h-6 w-6 text-slate-700" />
                </div>
            ) : (
                <div className="flex items-center justify-center w-full gap-1 px-2">
                    {navItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ 
                                delay: index * 0.05,
                                duration: 0.2
                            }}
                        >
                            {item.href ? (
                                <button
                                    onClick={() => handleNavigateTo(item.href!)}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                                    title={item.label}
                                >
                                    {item.icon && <item.icon className="h-4 w-4 text-slate-600" />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleItemClick(item)}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-black/5 transition-colors"
                                    title={item.label}
                                >
                                    {item.icon && <item.icon className="h-4 w-4 text-red-500" />}
                                </button>
                            )}
                        </motion.div>
                    ))}
                    {/* Close button inside expanded view */}
                    <motion.button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="p-2 rounded-lg bg-slate-200/50"
                        title="Close"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ 
                            delay: navItems.length * 0.05,
                            duration: 0.2
                        }}
                    >
                        <Menu className="h-3 w-3 rotate-90 text-slate-500" />
                    </motion.button>
                </div>
            )}
        </div>
        </motion.nav>
    </div>
  )
}
