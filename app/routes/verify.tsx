import { LoaderFunction, MetaFunction, redirect } from "remix";
import { prisma } from "~/db.server";

export const meta: MetaFunction = () => ({
  title: "Organism | Verify",
  description: "Organism email verification page",
});

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const verificationToken = url.searchParams.get("verificationToken");
  if (typeof email !== "string" || typeof verificationToken !== "string") {
    return "Could not verify email";
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return "Could not verify email";
  }
  if (user.verified) {
    return redirect(`/login?message=Email+verified`);
  }
  if (user.verificationToken !== verificationToken) {
    return "Could not verify email";
  }
  await prisma.user.update({
    where: { email },
    data: { verified: true, verificationToken: null },
  });
  return redirect(`/login?message=Email+verified`);
};
