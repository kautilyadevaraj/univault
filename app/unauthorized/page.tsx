import { AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl text-red-400 font-semibold mb-2 flex items-center justify-center space-x-2">
          <AlertTriangle />
          <span>Unauthorized</span>
        </h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page. Login to access this page.
        </p>
      </div>
    </div>
  );
}
