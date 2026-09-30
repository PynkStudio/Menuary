import type { Metadata } from "next";
import { PynkPatrimoniale } from "@/components/admin-pynkstudio/pynk-patrimoniale";

export const metadata: Metadata = {
  title: "Patrimoniale · PynkStudio Admin",
};

export default function PynkAdminPatrimonialePage() {
  return <PynkPatrimoniale />;
}
