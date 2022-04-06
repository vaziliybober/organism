import { User } from "@prisma/client";
import { json, LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { PageLayout } from "~/utils";
import { requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = () => ({
  title: "Organism | Account",
  description: "Your account",
});

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  return json<LoaderData>({ user });
};

export default function Account() {
  const data = useLoaderData<LoaderData>();
  return <PageLayout title="Account">Email: {data.user.email}</PageLayout>;
}
