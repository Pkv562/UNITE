import Sidebar from "@/components/sidebar";
import { cookies } from "next/headers";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default async function SysAdminDashboardLayout({ children }: DashboardLayoutProps) {
    // Attempt to read a server-set cookie named 'unite_user' (if your
    // authentication sets this cookie). This lets the Sidebar receive
    // server-derived userInfo during SSR so system-admins see admin links
    // without waiting for client-side localStorage.
    let userInfoProp: any = null;
    try {
        const cookieStore = await cookies();
        const c = cookieStore.get('unite_user')?.value || null;
        if (process.env.NODE_ENV !== 'production') {
            try { console.log('[layout] raw unite_user cookie ->', c); } catch (e) {}
        }
        const parsed = c ? JSON.parse(c) : null;
        if (parsed) {
            userInfoProp = {
                raw: parsed,
                role: parsed.role || parsed.StaffType || parsed.staff_type || parsed.staffType || null,
                isAdmin: !!parsed.isAdmin,
                displayName: parsed.displayName || parsed.First_Name || parsed.name || null,
                email: parsed.email || parsed.Email || null,
            };
            if (process.env.NODE_ENV !== 'production') {
                try { console.log('[layout] parsed userInfoProp ->', userInfoProp); } catch (e) {}
            }
        }
    } catch (e) {
        // ignore cookie parse errors
    }

    return (
        <div className="h-screen flex">
            <Sidebar role={userInfoProp?.role} userInfo={userInfoProp} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}