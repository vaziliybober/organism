import {
  json,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "remix";
import type { LinksFunction, MetaFunction, LoaderFunction } from "remix";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "~/session.server";
import { User } from "@prisma/client";

export const links: LinksFunction = () => {
  return [
    { rel: "icon", href: "/favicon.ico" },
    { rel: "apple-touch-icon", href: "/logo128.png" },
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "manifest", href: "/manifest.json" },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Organism",
  description: "An organiser app",
  viewport: "width=device-width,initial-scale=1",
  "theme-color": "#000000",
});

type LoaderData = {
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>({
    user: await getUser(request),
  });
};

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
