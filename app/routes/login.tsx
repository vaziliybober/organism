import {
  ActionFunction,
  Form,
  json,
  Link,
  MetaFunction,
  redirect,
  useActionData,
  useSearchParams,
  useTransition,
} from "remix";
import type { LoaderFunction } from "remix";
import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";

type ActionData = {
  error?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");
  const remember = formData.get("remember");
  const errorResponse = json<ActionData>(
    { error: "Invalid email or password" },
    { status: 400 }
  );
  if (typeof email !== "string" || typeof password !== "string") {
    return errorResponse;
  }
  const user = await verifyLogin(email, password);
  if (!user) {
    return errorResponse;
  }
  return createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo: typeof redirectTo === "string" ? redirectTo : "/",
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Sign in",
  };
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate replace>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                required
                autoFocus={true}
                name="email"
                type="email"
                autoComplete="email"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
            </div>
          </div>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <button
              type="submit"
              disabled={!!transition.submission}
              className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              {transition.submission ? "Logging in..." : "Log in"}
            </button>
            {actionData?.error && (
              <div className="pt-1 text-red-700" id="submit-error">
                {actionData.error}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/join",
                  search: searchParams.toString(),
                }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
