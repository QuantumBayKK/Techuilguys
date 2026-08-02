import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import TopNav from "@/components/ui/TopNav";
import ScrollProgress from "@/components/ui/ScrollProgress";
import TimeOfDay from "@/components/ui/TimeOfDay";
import IdleTell from "@/components/ui/IdleTell";
import ConsoleEgg from "@/components/ui/ConsoleEgg";
import SvgFilters from "@/components/ui/SvgFilters";

/**
 * The marketing site's chrome — everything cinematic. Lives one level below the
 * root so `/workspace` can opt out of the custom cursor, Lenis smooth scroll,
 * film grain and letterbox grade entirely.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="film-grain vignette grade">
      <SvgFilters />
      <TimeOfDay />
      <Cursor />
      <IdleTell />
      <ConsoleEgg />
      <ScrollProgress />
      <TopNav />
      <SmoothScroll>{children}</SmoothScroll>
    </div>
  );
}
