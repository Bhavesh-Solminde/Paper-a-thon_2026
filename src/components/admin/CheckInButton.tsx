"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCheckIn } from "@/app/actions/admin";

export function CheckInButton({ teamId, checkedIn }: { teamId: string; checkedIn: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      className={`btn mt-6 w-full ${checkedIn ? "btn-ghost" : "btn-primary"}`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleCheckIn(teamId, !checkedIn);
          router.refresh();
        })
      }
    >
      {pending ? "Saving…" : checkedIn ? "Undo check-in" : "Check in team"}
    </button>
  );
}
