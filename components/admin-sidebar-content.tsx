"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { memo } from "react";
import {
  HomeIcon,
  UsersIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  MessagesSquareIcon,
  BoxIcon,
  ShieldCheckIcon,
  UserCogIcon,
  Users2Icon,
  HistoryIcon,
  HeartPulseIcon,
  PhoneCallIcon,
  Sparkles,
  User,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarItemType = {
  label: string;
  href: string;
  icon: React.ReactNode;
};


const AdminSidebarGroups = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: <LayoutDashboardIcon className="w-4 h-4" />,
      },
    ],
  },
  {
    groupName: "Avatars",
    items: [
      {
        label: "Avatar Characters",
        href: "/admin",
        icon: <User className="w-4 h-4" />, 
      },
    ],
  },
  {
    groupName: "Management",
    items: [
      {
        label: "Super Admins",
        href: "/super-admin",
        icon: <ShieldCheckIcon className="w-4 h-4" />,
      },
      {
        label: "Moderators",
        href: "/moderator",
        icon: <UserCogIcon className="w-4 h-4" />,
      },
      {
        label: "Users",
        href: "/users",
        icon: <Users2Icon className="w-4 h-4" />,
      },
      {
        label: "Call Logs",
        href: "/admin/calls",
        icon: <HistoryIcon className="w-4 h-4" />,
      },
    ],
  },
];

const ModeratorSidebarGroups = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: <LayoutDashboardIcon className="w-4 h-4" />,
      },
    ],
  },
  {
    groupName: "Avatars",
    items: [
      {
        label: "Avatar Characters",
        href: "/admin",
        icon: <User className="w-4 h-4" />, 
      },
    ],
  },
  {
    groupName: "Management",
    items: [
      {
        label: "Patients",
        href: "/patient",
        icon: <HeartPulseIcon className="w-4 h-4" />,
      },
      {
        label: "Call History",
        href: "/calls",
        icon: <PhoneCallIcon className="w-4 h-4" />,
      },
    ],
  },
];
const PureSidebarItem = ({
  item,
  isActive,
  setOpenMobile,
}: {
  item: SidebarItemType;
  isActive: boolean;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          href={item.href}
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-3"
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SidebarItem = memo(PureSidebarItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});

export function AdminSidebarContent({
  role = "moderator",
}: {
  role?: "moderator" | "admin" | "user";
}) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const navItems =
    role === "admin" ? AdminSidebarGroups : ModeratorSidebarGroups;

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems?.map((group, groupIndex) => (
              // Use groupIndex as fallback when groupName is undefined
              <div key={group.groupName || `group-${groupIndex}`}>
                {group.groupName && (
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6 first:mt-0">
                    {group.groupName}
                  </div>
                )}
                {group?.items &&
                  group.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      isActive={item.href === (pathname as string)}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
              </div>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
