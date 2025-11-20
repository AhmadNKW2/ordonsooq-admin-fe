'use client';

import { Fragment } from 'react';
import type { ReactNode } from 'react';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarLink,
  SidebarDivider,
} from './sidebar';

interface SidebarLinkItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
}

interface SidebarGroupItem {
  label: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  links: SidebarLinkItem[];
}

interface AppSidebarProps {
  groups: SidebarGroupItem[];
  header?: {
    title: string;
    subtitle: string;
    logo: ReactNode;
  };
  footer?: {
    userName: string;
    userEmail: string;
    userAvatar?: string;
  };
}

export function AppSidebar({ groups, header, footer }: AppSidebarProps) {
  const handleLogout = () => {
    console.log('Logout clicked');
    // Add your logout logic here
    // Example: router.push('/login');
  };

  return (
    <Sidebar>
      {header && (
        <SidebarHeader>
          <div className="flex items-center gap-5">
            {header.logo}
            <div>
              <h1 className="text-lg font-bold text-third">{header.title}</h1>
              <p className="text-xs text-gray-500">{header.subtitle}</p>
            </div>
          </div>
        </SidebarHeader>
      )}

      <SidebarContent>
        {groups.map((group, groupIndex) => {
          const groupKey = `${group.label}-${groupIndex}`;
          const showDivider = groupIndex === groups.length - 2;

          return (
            <Fragment key={`group-${groupKey}`}>
              <SidebarGroup
                label={group.label}
                icon={group.icon}
                defaultOpen={group.defaultOpen ?? true}
              >
                {group.links.map((link, linkIndex) => (
                  <SidebarLink
                    key={`link-${groupKey}-${link.href}-${linkIndex}`}
                    href={link.href}
                    icon={link.icon}
                    label={link.label}
                    badge={link.badge}
                  />
                ))}
              </SidebarGroup>
              {showDivider && <SidebarDivider />}
            </Fragment>
          );
        })}
      </SidebarContent>

      {footer && (
        <SidebarFooter>
          <div className="flex items-center gap-5">
            {footer.userAvatar ? (
              <img
                src={footer.userAvatar}
                alt={footer.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sixth flex items-center justify-center text-secondary font-bold">
                {footer.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-third truncate">
                {footer.userName}
              </p>
              <p className="text-xs text-gray-500 truncate">{footer.userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title="Logout"
            >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
            </button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
