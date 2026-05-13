import type { Metadata } from "next";
import { MenuPageShell } from "@/components/menu-page-shell";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Il menu di Be Pork: antipasti, taglieri, burger firmati, pizze classiche e speciali Be Pork, cucina pugliese, birre tedesche. A Bari, in Via Quintino Sella.",
};

export default function MenuPage() {
  return <MenuPageShell />;
}
