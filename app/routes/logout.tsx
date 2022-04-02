import { ActionFunction, LoaderFunction, redirect } from "remix";
import { logout } from "~/session.server";

export const loader: LoaderFunction = async () => {
  return redirect("/");
};

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};
