import { User } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  MetaFunction,
  useActionData,
  useLoaderData,
} from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { PageLayout } from "~/utils";
import bcrypt from "bcryptjs";
import { requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = () => ({
  title: "Organism | Account",
  description: "Your account",
});

type LoaderData = {
  user: User;
};

type ActionData = {
  errors?: {
    oldPassword?: string;
    newPassword?: string;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  return json<LoaderData>({ user });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { oldPassword, newPassword } = formValues;
  invariant(typeof oldPassword === "string" && typeof newPassword === "string");
  const user = await requireCurrentUser(request);
  const password = await prisma.password.findUnique({
    where: { userId: user.id },
  });
  invariant(password !== null);
  if (!(await bcrypt.compare(oldPassword, password.hash))) {
    return json<ActionData>(
      { errors: { oldPassword: "Invalid old password" } },
      { status: 400 }
    );
  }
  if (newPassword.length === 0) {
    return json<ActionData>(
      { errors: { newPassword: "Password is required" } },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return json<ActionData>(
      { errors: { newPassword: "Password is too short" } },
      { status: 400 }
    );
  }
  if (newPassword.length > 32) {
    return json<ActionData>(
      { errors: { newPassword: "Password is too long" } },
      { status: 400 }
    );
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.password.update({
    where: { userId: user.id },
    data: { hash: hashedPassword },
  });
  return null;
};

export default function Account() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  return (
    <PageLayout title="Account">
      <div className="p-4">Email: {data.user.email}</div>
      <Form
        reloadDocument
        method="post"
        className="space-y-6 border-t border-b p-4"
      >
        <h2 className="text-lg font-bold">Change password</h2>
        <div>
          <label
            htmlFor="oldPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Old password
          </label>
          <div className="mt-1">
            <input
              id="oldPassword"
              name="oldPassword"
              type="password"
              autoComplete="current-password"
              className="w-full max-w-xs rounded border border-gray-500 px-2 py-1 text-lg"
            />
            {actionData?.errors?.oldPassword && (
              <div className="pt-1 text-red-700" id="oldPassword-error">
                {actionData.errors.oldPassword}
              </div>
            )}
          </div>
        </div>
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
              className="w-full max-w-xs rounded border border-gray-500 px-2 py-1 text-lg"
            />
            {actionData?.errors?.newPassword && (
              <div className="pt-1 text-red-700" id="newPassword-error">
                {actionData.errors.newPassword}
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="w-full max-w-xs rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Change
        </button>
      </Form>
    </PageLayout>
  );
}
