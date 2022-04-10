import { ReactNode } from "react";
import { Link, NavLink } from "remix";
import classnames from "classnames";
import HamburgerSvg from "~/icons/hamburger";
import BackSvg from "./icons/back";

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

export function PageLayout({
  children,
  title,
}: {
  children?: ReactNode;
  title?: string;
}) {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-10 h-16 border-b bg-gray-100 p-4 pl-14">
        <h1 className="text-center text-2xl font-bold">{title}</h1>
      </header>
      <label htmlFor="hamburger" className="cursor-pointer select-none">
        <HamburgerSvg
          width={29}
          height={29}
          className="fixed top-4 left-4 z-20 md:hidden"
        />
      </label>
      <input id="hamburger" type="checkbox" className="peer hidden" />
      <nav className="fixed top-0 left-0 mt-16 hidden h-[calc(100vh-4rem)] w-72 border-r bg-white peer-checked:z-10 peer-checked:block md:block">
        <ul>
          <li className="border-b hover:bg-gray-100">
            <NavLink
              to="/tasks/inbox"
              className={({ isActive }) =>
                classnames("block", "p-3", {
                  "text-blue-600": isActive,
                  "font-bold": isActive,
                })
              }
            >
              Inbox
            </NavLink>
          </li>
          <li className="border-b hover:bg-gray-100">
            <NavLink
              to="/tasks/today"
              className={({ isActive }) =>
                classnames("block", "p-3", {
                  "text-blue-600": isActive,
                  "font-bold": isActive,
                })
              }
            >
              Today
            </NavLink>
          </li>
          <li className="border-b hover:bg-gray-100">
            <NavLink
              to="/account"
              className={({ isActive }) =>
                classnames("block", "p-3", {
                  "text-blue-600": isActive,
                  "font-bold": isActive,
                })
              }
            >
              Account
            </NavLink>
          </li>
          <li className="border-b hover:bg-gray-100">
            <form action="/logout" method="post">
              <button type="submit" className="w-full p-3 text-left">
                Log out
              </button>
            </form>
          </li>
        </ul>
      </nav>
      <main className="mt-16 md:ml-72">{children}</main>
    </>
  );
}

export function NestedPageLayout({
  title,
  backTo = "..",
  children,
}: {
  title?: string;
  backTo?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="p-4">
        <h1 className="text-center text-xl font-bold">{title}</h1>
        <Link
          to={backTo}
          replace
          className="fixed top-4 left-4 rounded border-2 border-gray-400 hover:border-blue-500"
        >
          <BackSvg className="fill-gray-700" />
        </Link>
      </header>
      <main>{children}</main>
    </>
  );
}
