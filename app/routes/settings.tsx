import { json, LoaderFunction, Outlet } from "remix";
import { requireCurrentUser } from "~/utils.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireCurrentUser(request);
  return json({});
};

export default function Settings() {
  return <Outlet />;
}
