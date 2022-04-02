import { Link } from "remix";
import logo from "~/logo.png";
import { useMaybeUser } from "~/utils";

export default function Index() {
  const user = useMaybeUser();

  return (
    <main className="flex h-full flex-col items-center p-8">
      <h1 className="mt-14 mb-10 text-5xl">Organism</h1>
      <img src={logo} alt="logo" className="w-[256px] sm:w-[350px]" />
      <div className="mt-auto">
        {user ? (
          <div className="flex flex-wrap justify-center gap-4">
            <form action="/logout" method="post">
              <button className="rounded-lg bg-red-500 px-9 py-3 font-medium text-white hover:bg-red-600">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="rounded-lg bg-green-500 px-16 py-3 font-medium text-white hover:bg-green-600"
            >
              Sign in
            </Link>
            <Link
              to="/join"
              className="rounded-lg bg-yellow-500 px-16 py-3 font-medium text-white hover:bg-yellow-600"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
