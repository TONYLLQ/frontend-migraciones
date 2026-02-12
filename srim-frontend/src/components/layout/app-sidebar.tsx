
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Settings,
  Users,
  Search,
  PieChart,
  LogOut,
  ChevronDown
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
  SidebarRail,
  SidebarTrigger,
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

export function AppSidebar() {
  const { pathname } = useLocation();
  const { user, role, logout } = useCurrentUser();

  if (!user) return null; // Or a skeleton loader? Sidebar usually renders instantly.

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-lg">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 flex flex-row justify-between items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-white shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold leading-none text-white">SRIM</h1>
            <p className="text-xs text-sidebar-foreground/70">Sistema de Gestión de Calidad</p>
          </div>
        </div>
        <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
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
              {role !== 'VIEWER' && (
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

        {role !== 'VIEWER' && (
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

        {role === 'COORDINATOR' && (
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
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 text-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full gap-3 p-2 hover:bg-sidebar-accent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={`https://picsum.photos/seed/${user.id}/40/40`} />
                <AvatarFallback>{user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-sm group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-white">{user.username}</span>
                <span className="text-xs text-sidebar-foreground/70">{role}</span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" side="right">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
