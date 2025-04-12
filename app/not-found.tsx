"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4 max-w-3xl min-h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <XCircle className="mr-2 h-6 w-6 text-destructive" />
            404 - Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
            Go to Home Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}