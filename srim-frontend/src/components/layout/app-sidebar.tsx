
import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Settings,
  Users,
  Search,
  PieChart,
  LogOut,
  ChevronDown,
  UserCircle
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link, useLocation } from "react-router-dom"
import { useCurrentUser } from "@/hooks/use-current-user"
import { MOCK_USERS } from "@/lib/mock-data"

export function AppSidebar() {
  const { pathname } = useLocation();
  const { user, switchUser, role } = useCurrentUser();

  return (
    <Sidebar className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-white">DQ Guardian</h1>
            <p className="text-xs text-sidebar-foreground/70">Data Governance System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link to="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/scenarios")}>
                  <Link to="/scenarios">
                    <FileText className="h-4 w-4" />
                    <span>Escenarios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {role !== 'User' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/rules")}>
                    <Link to="/rules">
                      <Settings className="h-4 w-4" />
                      <span>Reglas de Calidad</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role !== 'User' && (
          <SidebarGroup>
            <SidebarGroupLabel>Análisis & Reportes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Search className="h-4 w-4" />
                    <span>Auditoría</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <PieChart className="h-4 w-4" />
                    <span>KPIs Mensuales</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {role === 'Coordinator' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    <span>Gestión de Roles</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full gap-3 p-2 hover:bg-sidebar-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
                <AvatarFallback>{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-sm">
                <span className="font-semibold text-white">{user.name}</span>
                <span className="text-xs text-sidebar-foreground/70">{user.role}</span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-sidebar-foreground/70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" side="right">
            <DropdownMenuLabel>Cambiar Perfil (Demo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOCK_USERS.map((u) => (
              <DropdownMenuItem 
                key={u.id} 
                className="cursor-pointer flex items-center justify-between"
                onClick={() => switchUser(u.id)}
              >
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span>{u.name}</span>
                </div>
                <span className="text-[10px] bg-muted px-1 rounded">{u.role}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
