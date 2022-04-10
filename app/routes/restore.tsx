import {
  ActionFunction,
  Form,
  json,
  MetaFunction,
  redirect,
  useActionData,
  useSearchParams,
  useTransition,
} from "remix";
import type { LoaderFunction } from "remix";
import { getCurrentUser } from "~/utils.server";
import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";
import invariant from "tiny-invariant";

export const meta: MetaFunction = () => ({
  title: "Organism | Sign in",
  description: "Organism signin page",
});

type ActionData = {
  errors?: {
    newPassword?: string;
    submit?: string;
  };
  values?: {
    email: string;
    restorationToken: string;
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
  const { email, newPassword, restorationToken } = formValues;
  invariant(
    typeof email === "string" &&
      typeof newPassword === "string" &&
      typeof restorationToken === "string"
  );
  if (newPassword.length === 0) {
    return json<ActionData>(
      {
        errors: { newPassword: "Password is required" },
        values: { email, restorationToken },
      },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return json<ActionData>(
      {
        errors: { newPassword: "Password is too short" },
        values: { email, restorationToken },
      },
      { status: 400 }
    );
  }
  if (newPassword.length > 32) {
    return json<ActionData>(
      {
        errors: { newPassword: "Password is too long" },
        values: { email, restorationToken },
      },
      { status: 400 }
    );
  }
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });
  if (!user || !user.verified) {
    return json<ActionData>(
      {
        errors: { submit: "Could not restore password" },
        values: { email, restorationToken },
      },
      { status: 400 }
    );
  }
  if (restorationToken !== user.restorationToken) {
    return json<ActionData>(
      {
        errors: { submit: "Could not restore password" },
        values: { email, restorationToken },
      },
      { status: 400 }
    );
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: {
      restorationToken: null,
      password: { update: { hash: hashedPassword } },
    },
  });
  return redirect("/login?message=Password+restored");
};

export default function Restore() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  return (
    <div className="flex h-screen flex-col justify-center p-4">
      <div className="mx-auto w-full max-w-md">
        <Form method="post" className="space-y-6" noValidate replace>
          <h1 className="text-center text-xl font-bold">
            Make up a new password
          </h1>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New password
            </label>
            <div className="mt-1">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.newPassword && (
                <div className="pt-1 text-red-700" id="newPassword-error">
                  {actionData.errors.newPassword}
                </div>
              )}
            </div>
          </div>
          <input
            type="hidden"
            name="email"
            value={actionData?.values?.email || searchParams.get("email") || ""}
          />
          <input
            type="hidden"
            name="restorationToken"
            value={
              actionData?.values?.restorationToken ||
              searchParams.get("restorationToken") ||
              ""
            }
          />
          <div>
            <button
              type="submit"
              disabled={!!transition.submission}
              className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              {transition.submission ? "Confirming..." : "Confirm"}
            </button>
            {actionData?.errors?.submit && (
              <div className="pt-1 text-red-700" id="submit-error">
                {actionData.errors?.submit}
              </div>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}
