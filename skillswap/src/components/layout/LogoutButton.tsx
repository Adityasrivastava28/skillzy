"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await api("/api/auth/logout", "POST");
        router.push("/");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
