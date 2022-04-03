import { Link, Outlet } from "remix";
import SettingsSvg from "~/icons/settings";

export default function Tasks() {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 flex h-16 items-center border-b p-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link to="/settings" className="ml-auto">
          <SettingsSvg width={32} height={32} className="fill-blue-600" />
        </Link>
      </header>
      <div className="mt-16">
        <nav className="fixed top-16 bottom-0 w-72 border-r p-4"></nav>
        <main className="ml-72 flex-grow">
          <Outlet />
        </main>
      </div>
    </>
  );
}
