"use client";

import { useRouter } from "next/navigation";
import NotificationModal from "@/components/modals/notification-modal";

export default function NotificationPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/dashboard/campaign");
  };

  return (
    <div className="relative h-screen w-full bg-white">
      <NotificationModal isOpen={true} onClose={handleClose} />
    </div>
  );
}
