import { Task } from "@prisma/client";
import { json, LoaderFunction, useLoaderData } from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { requireCurrentUser } from "~/utils.server";

type LoaderData = {
  task: Task;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireCurrentUser(request);
  const { id } = params;
  invariant(typeof id === "string");
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return new Response("Not found", { status: 404 });
  }
  return json<LoaderData>({ task });
};

export default function TaskRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <h2 className="mt-4 text-center font-bold">{data.task.title}</h2>
      <div className="text-center">{data.task.description}</div>
    </>
  );
}
