import * as React from "react";
import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  useTransition,
} from "remix";
import {
  Form,
  Link,
  redirect,
  useSearchParams,
  json,
  useActionData,
} from "remix";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import classnames from "tailwindcss-classnames";
import { emailTransporter, getCurrentUser } from "~/utils.server";
import { prisma } from "~/db.server";
import invariant from "tiny-invariant";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getCurrentUser(request);
  if (user) {
    return redirect("/");
  }
  return json({});
};

type ActionData = {
  errors?: {
    email?: string;
    password?: string;
    submit?: string;
  };
  values?: {
    email: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { email, password } = formValues;
  invariant(typeof email === "string" && typeof password === "string");
  let emailErrorMessage, passwordErrorMessage;
  if (email.length === 0) {
    emailErrorMessage = "Email is required";
  }
  if (!z.string().email().safeParse(email).success) {
    emailErrorMessage = "Email is invalid";
  }
  let user = await prisma.user.findUnique({ where: { email } });
  if (user && user.verified) {
    emailErrorMessage = "A user already exists with this email";
  }
  if (typeof password !== "string" || password.length === 0) {
    passwordErrorMessage = "Password is required";
  }
  if (password.length < 8) {
    passwordErrorMessage = "Password is too short";
  }
  if (password.length > 32) {
    passwordErrorMessage = "Password is too long";
  }
  if (emailErrorMessage || passwordErrorMessage) {
    return json<ActionData>({
      errors: { email: emailErrorMessage, password: passwordErrorMessage },
      values: { email },
    });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = uuidv4();
  if (user) {
    user = await prisma.user.update({
      where: { email },
      data: { verificationToken },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
        verificationToken,
      },
    });
  }
  const { origin } = new URL(request.url);
  const link = `${origin}/verify?email=${email}&verificationToken=${verificationToken}`;
  try {
    await emailTransporter.sendMail({
      from: `"Organism" <organism-21@mail.ru>`,
      to: email,
      subject: "Confirm your email ✔",
      html: `<p>You've received a confirmation link for your new account at Organism.</p>
      <p>To confirm your account, follow this link: <a href=${link}>${link}</p>`,
    });
  } catch (err) {
    return json<ActionData>(
      { errors: { submit: "Failed to send a confirmation email" } },
      { status: 500 }
    );
  }

  return json<ActionData>({ values: { email } });
};

export const meta: MetaFunction = () => {
  return {
    title: "Sign Up",
  };
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<ActionData>();
  const success = actionData && !actionData.errors;
  const transition = useTransition();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (!actionData || actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);
  return (
    <div className="flex h-screen flex-col justify-center p-4">
      <div className="mx-auto w-full max-w-md">
        <Form
          method="post"
          className={classnames("space-y-6", { hidden: success })}
          noValidate
          replace
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                ref={emailRef}
                id="email"
                autoFocus={!actionData || !!actionData?.errors?.email}
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
                defaultValue={actionData?.values?.email}
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                autoFocus={
                  !actionData?.errors?.email && !!actionData?.errors?.password
                }
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.password && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.password}
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
              {transition.submission ? "Creating account..." : "Create Account"}
            </button>
            {actionData?.errors?.submit && (
              <div className="pt-1 text-red-700">
                {actionData.errors.submit}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </Form>
        <div className={classnames({ hidden: !success })}>
          <p className="mb-4 text-center">
            A confirmation link has been sent to your email address:{" "}
            {actionData?.values?.email}
          </p>
          <Link
            to="."
            className="block w-full rounded bg-red-500 py-2 px-4  text-center font-medium text-white hover:bg-red-600 focus:bg-red-400"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
