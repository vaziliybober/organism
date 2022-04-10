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
import { v4 as uuidv4 } from "uuid";
import type { LoaderFunction } from "remix";
import { emailTransporter, getCurrentUser } from "~/utils.server";
import { prisma } from "~/db.server";
import invariant from "tiny-invariant";
import classNames from "classnames";

export const meta: MetaFunction = () => ({
  title: "Organism | Sign in",
  description: "Organism signin page",
});

type ActionData = {
  errors?: {
    email?: string;
    submit?: string;
  };
  values?: {
    email: string;
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
  const { email } = formValues;
  invariant(typeof email === "string");
  if (email.length === 0) {
    return json<ActionData>(
      { errors: { email: "Fill out the email" } },
      { status: 400 }
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return json<ActionData>(
      { errors: { email: "Found no users with such email" } },
      { status: 400 }
    );
  }
  if (!user.verified) {
    return json<ActionData>(
      { errors: { email: "This email hasn't yet been verified" } },
      { status: 400 }
    );
  }
  const restorationToken = uuidv4();
  await prisma.user.update({
    where: { email },
    data: { restorationToken },
  });
  const { origin } = new URL(request.url);
  const link = `${origin}/restore?email=${email}&restorationToken=${restorationToken}`;
  try {
    await emailTransporter.sendMail({
      from: `"Organism" <organism-21@mail.ru>`,
      to: email,
      subject: "Restore your password ✔",
      html: `<p>You've received a restoration link for your account at Organism (${email}).</p>
      <p>Follow this link to make a new password: <a href=${link}>${link}</p>`,
    });
  } catch (err) {
    return json<ActionData>(
      { errors: { submit: "Failed to send a restoration email" } },
      { status: 500 }
    );
  }
  return json<ActionData>({ values: { email } });
};

export default function Forgot() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<ActionData>();
  const success = actionData && !actionData.errors;
  const transition = useTransition();
  return (
    <div className="flex h-screen flex-col justify-center p-4">
      <div className="mx-auto w-full max-w-md">
        <Form
          method="post"
          className={classNames("space-y-6", { hidden: success })}
          noValidate
          replace
        >
          <h1 className="text-center text-xl font-bold">
            Send a restoration link
          </h1>
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
                defaultValue={
                  actionData?.values?.email || searchParams.get("email") || ""
                }
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.email && (
                <div className="pt-1 text-red-700" id="email-error">
                  {actionData.errors.email}
                </div>
              )}
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={!!transition.submission}
              className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              {transition.submission ? "Sending..." : "Send"}
            </button>
            {actionData?.errors?.submit && (
              <div className="pt-1 text-red-700" id="submit-error">
                {actionData.errors?.submit}
              </div>
            )}
          </div>
          <div className="text-center text-sm text-gray-500">
            Back to{" "}
            <Link className="text-blue-500 underline" to="/login">
              Log in
            </Link>
          </div>
        </Form>
        <div className={classNames({ hidden: !success })}>
          <p className="mb-4 text-center">
            A restoration link has been sent to your email address:{" "}
            {actionData?.values?.email}
          </p>
          <Link
            to="."
            className="mb-4 block w-full rounded bg-red-500 py-2 px-4  text-center font-medium text-white hover:bg-red-600 focus:bg-red-400"
          >
            Try again
          </Link>
          <div className="text-center text-sm text-gray-500">
            Back to{" "}
            <Link className="text-blue-500 underline" to="/login">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
