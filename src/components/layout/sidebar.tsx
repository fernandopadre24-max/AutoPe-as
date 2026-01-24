'use client';

import React from 'react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  BookUser,
  BarChart2,
  Settings,
  Calculator,
  Calendar,
  Truck,
  Shirt,
  Store,
  Receipt,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEM_HEIGHT = 60; // hit-area + respiro
const TILE_SIZE = 48;   // tile 48x48 (exigido)
const ICON_SIZE = 28;   // desenho do ícone dentro do tile

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  grad: [string, string];
};

const menuItems: MenuItem[] = [
  { href: '/', label: 'Início', icon: Home, grad: ['#2563EB', '#1E40AF'] },
  { href: '/pdv', label: 'PDV', icon: Store, grad: ['#7C3AED', '#4C1D95'] },
  { href: '/vendas', label: 'Vendas', icon: Receipt, grad: ['#DB2777', '#831843'] },
  { href: '/produtos', label: 'Produtos', icon: Shirt, grad: ['#F59E0B', '#92400E'] },
  { href: '/categorias', label: 'Categorias', icon: Tags, grad: ['#EA580C', '#7C2D12'] },
  { href: '/clientes', label: 'Clientes', icon: Users, grad: ['#10B981', '#064E3B'] },
  { href: '/funcionarios', label: 'Funcionários', icon: BookUser, grad: ['#06B6D4', '#155E75'] },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck, grad: ['#EF4444', '#7F1D1D'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, grad: ['#8B5CF6', '#312E81'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, grad: ['#64748B', '#0F172A'] },
];

function radialGradient(a: string, b: string) {
  return `radial-gradient(120% 120% at 30% 20%, ${a} 0%, ${b} 55%, rgba(255,255,255,0.10) 100%)`;
}

export function AppSidebar() {
  const pathname = usePathname();
  const isPdvPage = pathname === '/pdv';

  if (isPdvPage) return null;

  return (
    <>
      {/* Sidebar tem 60px — evitar p-2 aqui (48 + 16 = 64). */}
      <SidebarHeader className="p-0">
        <div className="flex items-center justify-center p-1.5">
          <div
            className="flex items-center justify-center rounded-xl shadow-sm"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundImage: radialGradient('#0EA5E9', '#1D4ED8'),
            }}
            aria-label="Logo"
          >
            <Shirt className="text-white" style={{ width: ICON_SIZE, height: ICON_SIZE }} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-1">
        <SidebarMenu className="py-2">
          {menuItems.map(({ href, label, icon: Icon, grad }) => {
            const isActive = pathname.startsWith(href) && (href !== '/' || pathname === '/');

            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: label, side: 'right', align: 'center' }}
                  className="justify-center"
                  style={{ height: `${ITEM_HEIGHT}px`, width: '100%' }}
                >
                  <Link
                    href={href}
                    aria-label={label}
                    className="flex h-full w-full items-center justify-center"
                  >
                    <span
                      className={[
                        'flex items-center justify-center rounded-xl shadow-sm',
                        'transition-all duration-150',
                        'hover:brightness-110 hover:scale-[1.02]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                        isActive ? 'ring-2 ring-white/25' : '',
                      ].join(' ')}
                      style={{
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        backgroundImage: radialGradient(grad[0], grad[1]),
                      }}
                    >
                      <Icon className="text-white" style={{ width: ICON_SIZE, height: ICON_SIZE }} />
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-0" />
    </>
  );
}
