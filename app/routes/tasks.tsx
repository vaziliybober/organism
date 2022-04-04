import { Link, Outlet } from "remix";
import SettingsSvg from "~/icons/settings";

export default function Tasks() {
  return (
    <>
      <header className="fixed left-0 right-0 top-0 flex h-16 items-center border-b bg-gray-100 p-4">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link to="/settings" className="ml-auto">
          <SettingsSvg width={32} height={32} className="fill-blue-600" />
        </Link>
      </header>
      <main className="mt-16">
        <Outlet />
      </main>
    </>
  );
}
