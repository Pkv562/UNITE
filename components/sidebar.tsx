"use client";

import { Button } from "@heroui/button";
import {
    Calendar,
    Settings,
    UsersRound,
    Ticket,
    Bell,
    ContactRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { getUserInfo } from "../utils/getUserInfo"
    
interface SidebarProps {
    role?: string;
    userInfo?: {
        name?: string;
        email?: string;
    };
}

export default function Sidebar({ role, userInfo }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    
    // Prefer the `userInfo` prop when provided (it may be passed from the layout/server)
    // so both server and client render the same initial HTML and avoid hydration mismatches.
    // Fall back to `getUserInfo()` only when no `userInfo` prop is present.
    const info = userInfo && Object.keys(userInfo).length ? (userInfo as any) : getUserInfo()
    // debug logs removed

    let resolvedRole = role || (info && info.role) || null

    // Extra logging to help debug why Coordinator link may be hidden
    try {
        // isSystemAdmin: role string contains system indicator + admin (e.g. 'sysadmin')
        const isSystemAdmin = !!(info && info.isAdmin) || (resolvedRole && String(resolvedRole).toLowerCase().includes('sys') && String(resolvedRole).toLowerCase().includes('admin'))

        // extract explicit StaffType from the parsed raw user object (prefer explicit StaffType fields)
        const raw = info?.raw || null
        const staffType = raw?.StaffType || raw?.Staff_Type || raw?.staff_type || raw?.staffType || (raw?.user && (raw.user.StaffType || raw.user.staff_type || raw.user.staffType)) || null
        const isStaffAdmin = !!staffType && String(staffType).toLowerCase() === 'admin'

    // debug logs removed
    } catch (e) { /* ignore logging errors */ }

    const links = [
        { href: "/dashboard/campaign", icon: Ticket },
        { href: "/dashboard/calendar", icon: Calendar },
    ];

    // Show coordinator management link only when the user is a system admin
    // (explicit system admin flag or role that includes system+admin), OR when
    // the user's StaffType is explicitly 'Admin'. This keeps coordinator access
    // limited to true admins while allowing system-level admins to see it.
    const raw = (info && (info.raw || info)) || null
    const staffType = raw?.StaffType || raw?.Staff_Type || raw?.staff_type || raw?.staffType || (raw?.user && (raw.user.StaffType || raw.user.staff_type || raw.user.staffType)) || null
    const roleFromResolved = resolvedRole ? String(resolvedRole).toLowerCase() : ''
    const isSystemAdmin = !!(info && info.isAdmin) || (roleFromResolved.includes('sys') && roleFromResolved.includes('admin'))
    const isStaffTypeAdmin = !!staffType && String(staffType).toLowerCase() === 'admin'
    const showCoordinatorLink = isSystemAdmin || isStaffTypeAdmin
    if (showCoordinatorLink) {
        links.push({ href: "/dashboard/coordinator-management", icon: UsersRound })
    }

    links.push({ href: "/dashboard/stakeholder-management", icon: ContactRound })
    
    const bottomLinks = [{ href: "/notifications", icon: Bell }];
    
    const renderButton = (href: string, Icon: any, key: string) => {
        const isActive = pathname === href;
    
        return (
        <Link href={href} key={key}>
            <Button
            isIconOnly
            variant="light"
            className={`w-10 h-10 !p-0 flex items-center justify-center rounded-full transition-colors duration-200 ${
                isActive
                ? "bg-danger text-white"
                : "text-black border border-gray-300 hover:bg-gray-100"
            }`}
            >
            <Icon size={16} strokeWidth={2} className="-translate-y-[0.5px]" />
            </Button>
        </Link>
        );
    };
    
    const handleLogout = () => {
        try {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("hospitalId");
        } catch {}
        router.push("/auth/login");
    };
    
    return (
        <div className="w-16 h-screen bg-white flex flex-col items-center justify-between py-6 border-r border-default-300">
        {/* Top section */}
        <div className="flex flex-col items-center space-y-4">
            {links.map(({ href, icon }) => renderButton(href, icon, `link-${href}`))}
        </div>
    
        {/* Bottom section */}
        <div className="flex flex-col items-center space-y-4">
            {bottomLinks.map(({ href, icon }) =>
            renderButton(href, icon, `bottom-${href}`)
            )}
            <Popover placement="right">
            <PopoverTrigger>
                <Button
                isIconOnly
                variant="light"
                className="w-10 h-10 !p-0 flex items-center justify-center rounded-full text-black border border-default-300 hover:bg-gray-100"
                >
                <Settings size={16} strokeWidth={2} className="-translate-y-[0.5px]" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2">
                <div className="flex flex-col gap-1 min-w-[140px]">
                <Button variant="light" className="justify-start" onClick={handleLogout}>
                    Log out
                </Button>
                </div>
            </PopoverContent>
            </Popover>
        </div>
        </div>
    );
}
