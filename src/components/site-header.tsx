import Link from "next/link";

/**
 * Static site header used on the standalone pages (static content, checkout,
 * download). The landing page uses its own header with a flow-start CTA.
 */
export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="font-serif text-xl font-medium tracking-tight">
          Will<span className="text-primary">Bee</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/why-choose-willbee" className="hover:text-foreground">
            Why WillBee
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
