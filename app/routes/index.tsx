import { User } from "@prisma/client";
import { json, Link, LoaderFunction, useLoaderData } from "remix";
import logo from "~/logo.png";
import { getCurrentUser } from "~/utils.server";

type LoaderData = {
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser(request);
  return json<LoaderData>({ user });
};

export default function Index() {
  const { user } = useLoaderData<LoaderData>();

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
