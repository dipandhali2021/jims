"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button variant="ghost" onClick={handleClick} className="mb-4">
      <ChevronLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
