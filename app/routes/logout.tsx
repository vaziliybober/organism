import { ActionFunction, LoaderFunction, redirect } from "remix";
import { logout } from "~/utils.server";

export const loader: LoaderFunction = async () => {
  return redirect("/");
};

export const action: ActionFunction = async ({ request }) => {
  return await logout(request);
};
