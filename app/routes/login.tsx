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
import { getCurrentUser, login } from "~/utils.server";
import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";

export const meta: MetaFunction = () => ({
  title: "Organism | Sign in",
  description: "Organism signin page",
});

type ActionData = {
  error?: string;
  values?: {
    email: string;
    remember: boolean;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser(request);
  if (user) {
    return redirect("/");
  }
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { email, password } = formValues;
  invariant(typeof email === "string" && typeof password === "string");
  const remember = formValues.remember === "on";
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });
  if (
    !user ||
    !user.password ||
    !user.verified ||
    !(await bcrypt.compare(password, user.password.hash))
  ) {
    return json<ActionData>(
      {
        error: "Invalid email or password",
        values: { email, remember },
      },
      { status: 400 }
    );
  }
  return await login(request, user.id, remember);
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message");
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  return (
    <>
      <div className="absolute left-0 right-0 bottom-0 mb-3 text-center text-green-600">
        {message}
      </div>
      <div className="flex h-screen flex-col justify-center p-4">
        <div className="mx-auto w-full max-w-md">
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
                  autoFocus
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={actionData?.values?.email}
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
                  autoComplete="current-password"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                />
              </div>
            </div>
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
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    defaultChecked={actionData?.values?.remember}
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
                  <Link className="text-blue-500 underline" to="/join">
                    Sign up
                  </Link>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                Forgot password?{" "}
                <Link
                  className="text-blue-500 underline"
                  to={{
                    pathname: "/forgot",
                    search: actionData?.values?.email
                      ? `?email=${actionData?.values?.email}`
                      : "",
                  }}
                >
                  Restore
                </Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
