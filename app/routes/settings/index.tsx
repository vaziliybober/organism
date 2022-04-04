import { Link } from "remix";

export default function Settings() {
  return (
    <>
      <header className="border-b bg-gray-100 py-4">
        <h1 className="text-center text-2xl font-bold">Settings</h1>
      </header>
      <main className="h-screen">
        <ul className="">
          <li className="border-b hover:bg-gray-100">
            <Link to="account" className="block p-4">
              Account
            </Link>
          </li>
          <li className="border-b hover:bg-gray-100">
            <form action="/logout" method="post">
              <button type="submit" className="w-full p-4 text-left">
                Log out
              </button>
            </form>
          </li>
        </ul>
      </main>
    </>
  );
}
