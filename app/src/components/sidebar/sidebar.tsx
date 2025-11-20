'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
  // Context for future sidebar features
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <SidebarContext.Provider value={{}}>
      <aside
        className="
          relative h-screen bg-secondary border-r border-gray-200 
          flex flex-col w-64
        "
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  );
}

interface SidebarHeaderProps {
  children: React.ReactNode;
}

export function SidebarHeader({ children }: SidebarHeaderProps) {
  return (
    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
      {children}
    </div>
  );
}

interface SidebarContentProps {
  children: React.ReactNode;
}

export function SidebarContent({ children }: SidebarContentProps) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
      {children}
    </nav>
  );
}

interface SidebarFooterProps {
  children: React.ReactNode;
}

export function SidebarFooter({ children }: SidebarFooterProps) {
  return (
    <div className="border-t border-gray-200 p-4">
      {children}
    </div>
  );
}



interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function SidebarGroup({
  label,
  children,
  defaultOpen = true,
  icon,
}: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between px-3 py-2 mb-1
          text-sm font-semibold text-gray-500 hover:text-third
          transition-colors duration-200 group
        "
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="w-5 h-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
          )}
          <span className="uppercase tracking-wide">{label}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  onClick?: () => void;
}

export function SidebarLink({
  href,
  icon,
  label,
  badge,
  onClick,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group relative flex items-center gap-5 px-3 py-2.5 mb-1 rounded-lg
        transition-all duration-200 ease-in-out
        ${
          isActive
            ? 'bg-sixth text-secondary shadow-md'
            : 'text-gray-600 hover:bg-gray-50 hover:text-third'
        }
      `}
    >
      <span
        className={`
          flex items-center justify-center w-5 h-5
          transition-transform duration-200 group-hover:scale-110
          ${isActive ? 'text-secondary' : ''}
        `}
      >
        {icon}
      </span>

      <span
        className={`
          flex-1 font-medium text-sm transition-all duration-200
          ${isActive ? 'text-secondary' : ''}
        `}
      >
        {label}
      </span>

      {badge && (
        <span
          className={`
            px-2 py-0.5 text-xs font-semibold rounded-full
            transition-all duration-200
            ${
              isActive
                ? 'bg-secondary text-sixth'
                : 'bg-sixth2 text-sixth'
            }
          `}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarDividerProps {
  className?: string;
}

export function SidebarDivider({ className = '' }: SidebarDividerProps) {
  return <div className={`my-4 border-t border-gray-200 ${className}`} />;
}
