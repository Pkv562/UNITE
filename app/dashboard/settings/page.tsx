"use client";

import { useRouter } from "next/navigation";
import SettingsModal from "@/components/modals/settings-modal";

export default function SettingsPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/dashboard/campaign");
  };

  return (
    <div className="relative h-screen w-full bg-white">
      <SettingsModal isOpen={true} onClose={handleClose} />
    </div>
  );
}
