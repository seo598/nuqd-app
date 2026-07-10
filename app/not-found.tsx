import { ButtonLink } from "@/components/ui/button";
import { NuqdLogo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <NuqdLogo size={34} variant="mark" />
      <div>
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <p className="mt-1 text-muted">This screen doesn&apos;t exist.</p>
      </div>
      <ButtonLink href="/home">Back to home</ButtonLink>
    </div>
  );
}
