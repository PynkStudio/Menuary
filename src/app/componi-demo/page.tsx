import type { Metadata } from "next";
import { DishBuilderDemo } from "./demo";

export const metadata: Metadata = {
  title: "Componi il piatto — demo modulo",
  robots: { index: false, follow: false },
};

export default function ComponiDemoPage() {
  return <DishBuilderDemo />;
}
