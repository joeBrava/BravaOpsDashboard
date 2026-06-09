import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/**
 * Not-found UI for `/deals/[id]`, rendered when the page calls `notFound()`
 * (i.e. `getProject(id)` returned null). Kept inside the segment so it shares
 * the app shell (sidebar + cream canvas) rather than a bare 404.
 */
export default function DealNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />
      <main className="flex flex-1 items-center justify-center bg-cream px-[26px] py-[22px]">
        <div className="rounded-[15px] border border-dashed border-[#ebe6dd] bg-white px-8 py-10 text-center">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Deal not found
          </h2>
          <p className="mt-2 text-[0.85rem] font-medium text-gray-mid">
            We couldn&apos;t find a deal with that id.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-[10px] bg-purple px-4 py-[9px] font-display text-[0.8rem] font-semibold text-white"
          >
            Back to pipeline
          </Link>
        </div>
      </main>
    </div>
  );
}
