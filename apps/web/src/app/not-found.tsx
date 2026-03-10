import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
        <Button>
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
