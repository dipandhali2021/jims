import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BillTabsProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function BillTabs({
  children,
  value,
  defaultValue = "gst",
  onValueChange
}: BillTabsProps) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue}
      className="w-full"
      onValueChange={onValueChange}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="gst">GST Bill</TabsTrigger>
        <TabsTrigger value="non-gst">Non-GST Bill</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
