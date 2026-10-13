import { Link } from "@tanstack/react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="sniper-card p-8 max-w-md w-full text-center">
        <p className="text-4xl font-semibold text-muted-foreground/40 mb-2">404</p>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="sniper-btn sniper-btn-primary">
            Go to dashboard
          </Link>
          <Link to="/login" className="sniper-btn">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
