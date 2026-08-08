/* Responsive landing from Pencil MCP exports + motion enhancement */
import { useExportMotion } from "@/hooks/useExportMotion";
import { useRef } from "react";
import { LandingDesktop } from "./LandingDesktop";
import { LandingMobile } from "./LandingMobile";
import { LandingTablet } from "./LandingTablet";

export function LandingFromExport() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const tabletRef = useRef<HTMLDivElement>(null);

  useExportMotion(desktopRef);
  useExportMotion(tabletRef);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#EDEFF3]">
      <div ref={desktopRef} className="hidden lg:block">
        <LandingDesktop />
      </div>
      <div ref={tabletRef} className="hidden md:block lg:hidden">
        <LandingTablet />
      </div>
      <div className="block md:hidden">
        <LandingMobile />
      </div>
    </div>
  );
}
