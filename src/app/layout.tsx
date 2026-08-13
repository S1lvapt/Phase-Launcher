"use client";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <main className="fixed top-8 left-0 right-0 bottom-0 overflow-auto">
      {children}
    </main>
  );
}
