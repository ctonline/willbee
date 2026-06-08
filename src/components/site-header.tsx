import Link from "next/link";
import Image from "next/image";

/**
 * Static site header used on the standalone pages (static content, checkout,
 * download). The landing page uses its own header with a flow-start CTA.
 */
export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/willbee-full.png"
            alt="WillBee"
            width={1698}
            height={608}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>
        <div className="flex items-center gap-5 sm:gap-6">
          <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <Link href="/why-choose-willbee" className="hover:text-foreground">
              Why WillBee
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
          </nav>
          <Link
            href="/auth"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
