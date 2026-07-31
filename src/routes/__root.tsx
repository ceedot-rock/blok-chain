import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "bLOK CHaiN — $bLOkz puzzle",
      },
      {
        name: "description",
        content:
          "Compile random crypto blocks into one solid chain. Timed ranked play, top 50 leaderboards, stake $bLOkz, validator chat.",
      },
      { name: "theme-color", content: "#e8eae8" },
      { name: "color-scheme", content: "light" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo-blok-mark.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/logo-blok-32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/logo-blok-192.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] antialiased">
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
