import { User } from "@prisma/client";
import { json, Link, LoaderFunction, useLoaderData } from "remix";
import RibsSvg from "~/icons/ribs";
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
    <main className="flex h-screen flex-col items-center p-8">
      <h1 className="mt-14 mb-10 text-5xl font-bold text-gray-700">Organism</h1>
      <RibsSvg width={150} height={150} className="fill-gray-700" />
      <p className="mt-7 text-center">
        A lightweight organiser app that runs anywhere there's a browser
      </p>
      {user ? (
        <div className="mt-auto mb-5 w-full space-y-4">
          <Link
            to="tasks"
            className="block w-full rounded bg-blue-500 py-2 px-4  text-center font-medium text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Tasks
          </Link>
          <form action="/logout" method="post">
            <button className="block w-full rounded bg-red-500 py-2 px-4  text-center font-medium text-white hover:bg-red-600 focus:bg-blue-400">
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-auto mb-5 w-full space-y-4">
          <Link
            to="login"
            className="block w-full rounded bg-blue-500 py-2 px-4  text-center font-medium text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Sign in
          </Link>
          <Link
            to="join"
            className="block w-full rounded bg-green-500 py-2 px-4  text-center font-medium text-white hover:bg-green-600 focus:bg-green-400"
          >
            Sign up
          </Link>
        </div>
      )}
    </main>
  );
}
