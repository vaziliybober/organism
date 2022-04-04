import { User } from "@prisma/client";
import { json, LoaderFunction, useLoaderData } from "remix";
import { requireCurrentUser } from "~/utils.server";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  return json<LoaderData>({ user });
};

export default function Account() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <header className="border-b bg-gray-100 py-4">
        <h1 className="text-center text-2xl font-bold">Account</h1>
      </header>
      <main className="h-screen">Email: {data.user.email}</main>
    </>
  );
}
