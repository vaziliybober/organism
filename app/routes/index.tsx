import { json, Link, LoaderFunction, redirect } from "remix";
import RibsSvg from "~/icons/ribs";
import { getCurrentUser } from "~/utils.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser(request);
  if (user) {
    return redirect("/tasks");
  }
  return json({});
};

export default function Index() {
  return (
    <main className="flex h-screen flex-col items-center p-4">
      <h1 className="mt-14 mb-10 text-5xl font-bold text-gray-700">Organism</h1>
      <RibsSvg width={150} height={150} className="fill-gray-700" />
      <p className="mt-7 text-center">
        A lightweight organiser app that runs anywhere there's a browser
      </p>
      <div className="mt-auto mb-5 w-full space-y-4">
        <Link
          to="login"
          className="block mx-auto max-w-sm w-full rounded bg-blue-500 py-2 px-4  text-center font-medium text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Sign in
        </Link>
        <Link
          to="join"
          className="block mx-auto max-w-sm w-full rounded bg-green-500 py-2 px-4  text-center font-medium text-white hover:bg-green-600 focus:bg-green-400"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
