import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-5xl font-semibold tracking-tight text-primary">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sorry, we couldn’t find the page you were looking for.
        </p>
        <div className="mt-8">
          <Button render={<Link href="/" />}>Back to home</Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
