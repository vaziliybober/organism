import { ActionFunction, json, redirect } from "remix";
import type { LoaderFunction } from "remix";
import { createUserSession, getUserId } from "~/session.server";
import { z } from "zod";
import { verifyLogin } from "~/models/user.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const { email, password } = z
    .object({
      email: z.string().email(),
      password: z.string().min(8).max(32),
    })
    .parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

  const user = await verifyLogin(email, password);

  if (!user) {
    return json("Invalid email or password", { status: 400 });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo: "/",
  });
};

export default function Signin() {
  return (
    <main className="flex h-full items-center justify-center">
      <form method="post">
        <div>
          <label htmlFor="email" className="hidden" />
          <input
            id="email"
            type="email"
            name="email"
            required
            autoFocus
            placeholder="you@example.com"
            className="px-4 py-2"
          />
        </div>
        <div className="mt-5">
          <label htmlFor="password" className="hidden" />
          <input
            id="password"
            type="password"
            name="password"
            minLength={8}
            required
            placeholder="password"
            className="px-4 py-2"
          />
        </div>
        <button
          type="submit"
          className="mt-5 rounded-lg bg-green-500 px-16 py-3 font-medium text-white hover:bg-green-600"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
