'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Settings,
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Activity
} from 'lucide-react';

const menuItems = [
  {
    title: 'Нүүр хуудас',
    href: '/',
    icon: Home,
  },
  {
    title: 'Бараа',
    href: '/baraa',
    icon: ShoppingCart,
  },
  {
    title: 'Хэрэглэгчид',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Тайлан',
    href: '/report',
    icon: FileText,
  },
  {
    title: 'Захиалга',
    href: '/order',
    icon: FileText,
  },
  {
    title: 'Live',
    href: '/live',
    icon: Activity,
  },
];

const settingsSubItems = [
  {
    title: 'Барааны код',
    href: '/settings/baraanii-kod',
  },
  {
    title: 'Өнгө',
    href: '/settings/colors',
  },
  {
    title: 'Хэмжээ',
    href: '/settings/sizes',
  },
  {
    title: 'Excel импорт багана',
    href: '/settings/import-columns',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    pathname?.startsWith('/settings') || false
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isSettingsActive = pathname?.startsWith('/settings');

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "flex h-16 items-center border-b transition-all duration-300",
        isCollapsed ? "justify-center px-2" : "px-6"
      )}>
        {!isCollapsed && <h2 className="text-lg font-semibold">Khos-shop</h2>}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "ml-auto h-8 w-8",
            isCollapsed && "mx-auto"
          )}
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isCollapsed && 'justify-center',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
        
        {/* Settings Menu */}
        <div className="mt-2">
          {isCollapsed ? (
            <Link
              href={settingsSubItems[0]?.href || '/settings'}
              className={cn(
                'flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isSettingsActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title="Тохиргоо"
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isSettingsActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  <span>Тохиргоо</span>
                </div>
                {isSettingsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isSettingsOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                  {settingsSubItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                          isSubActive
                            ? 'bg-primary/20 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span>{subItem.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </nav>
      <div className="border-t p-4">
        <Button
          variant="outline"
          className={cn(
            "w-full transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleLogout}
          title={isCollapsed ? 'Гарах' : undefined}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span>Гарах</span>}
        </Button>
      </div>
    </div>
  );
}

