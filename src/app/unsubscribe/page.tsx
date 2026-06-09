import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Unsubscribed", robots: { index: false } };

export default function UnsubscribePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          You&rsquo;ve been unsubscribed
        </h1>
        <p className="mt-3 text-muted-foreground">
          You won&rsquo;t receive any more follow-up emails from us. You can still write
          your Scottish Will whenever you&rsquo;re ready, no account needed.
        </p>
        <div className="mt-8">
          <Button render={<Link href="/" />}>Write my Will</Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
