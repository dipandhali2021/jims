import React from 'react';

interface AdminActionBadgeProps {
  adminAction?: boolean;
}

export function AdminActionBadge({ adminAction }: AdminActionBadgeProps) {
  if (!adminAction) return null;
  
  return (
    <span className="inline-flex items-center text-xs rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 font-medium">
      Admin Action
    </span>
  );
}
