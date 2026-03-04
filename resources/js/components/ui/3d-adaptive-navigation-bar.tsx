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
    LayoutDashboard
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
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', id: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Agents', id: 'agents', href: '/agents', icon: Users },
    { label: 'Buyers', id: 'buyers', href: '/buyers', icon: UserCircle },
    { label: 'Transactions', id: 'transactions', href: '/transactions', icon: Briefcase },
    { label: 'Log out', id: 'logout', action: () => router.post(logout()), icon: LogOut },
  ]

  // Spring animations for smooth motion
  // We use a smaller base width for the "Burger" state
  const pillWidth = useSpring(56, { stiffness: 220, damping: 25, mass: 1 })

  useEffect(() => {
    if (expanded) {
      pillWidth.set(340) // Expand to show items
    } else {
      pillWidth.set(56) // Contract to burger icon
    }
  }, [expanded, pillWidth])

  const toggleExpand = () => {
    setExpanded(!expanded)
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
    <div className="fixed bottom-6 right-6 z-[100] md:hidden">
        <motion.nav
        onClick={expanded ? undefined : toggleExpand}
        className="relative rounded-full flex items-center justify-center cursor-pointer"
        style={{
            width: pillWidth,
            height: '56px',
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
            className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none h-[2px]"
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
                <div className="flex items-center justify-around w-full gap-2 overflow-x-auto no-scrollbar">
                    {navItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-black/5 transition-colors"
                                    onClick={() => setExpanded(false)}
                                >
                                    {item.icon && <item.icon className="h-5 w-5 mb-1 text-slate-600" />}
                                    <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-tighter">{item.label}</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={() => handleItemClick(item)}
                                    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-black/5 transition-colors"
                                >
                                    {item.icon && <item.icon className="h-5 w-5 mb-1 text-red-500" />}
                                    <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-tighter">{item.label}</span>
                                </button>
                            )}
                        </motion.div>
                    ))}
                    {/* Close button inside expanded view */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="p-2 ml-2 rounded-full bg-slate-200/50"
                    >
                        <Menu className="h-4 w-4 rotate-90 text-slate-500" />
                    </button>
                </div>
            )}
        </div>
        </motion.nav>
    </div>
  )
}
