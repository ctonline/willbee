import Link from "next/link";
import { SITE } from "@/lib/constants";

const FOOTER_LINKS = [
  { href: "/why-choose-willbee", label: "Why Choose WillBee" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <span className="font-serif text-xl font-medium tracking-tight">
              Will<span className="text-primary">Bee</span>
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              Plain-English, Scotland-specific Wills you can complete in minutes.
              WillBee provides a document-generation service and does not provide
              legal advice.
            </p>
          </div>
          <nav aria-label="Footer" className="grid gap-2 text-sm">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <p>Made in Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿</p>
        </div>
      </div>
    </footer>
  );
}
