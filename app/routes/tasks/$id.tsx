import { Task } from "@prisma/client";
import {
  json,
  LoaderFunction,
  MetaFunction,
  useCatch,
  useLoaderData,
} from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = ({ data }) => {
  return {
    title: `Organism | ${data?.task?.title || "?"}`,
    description: `Your task ${data?.task?.title || "?"}`,
  };
};

type LoaderData = {
  task: Task;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireCurrentUser(request);
  const { id } = params;
  invariant(typeof id === "string");
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new Response("Not found", { status: 404 });
  }
  return json<LoaderData>({ task });
};

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Task not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export default function TaskRoute() {
  const data = useLoaderData<LoaderData>();
  console.log(data);
  return (
    <>
      <header className="p-4">
        <h2 className="text-center font-bold">{data.task.title}</h2>
      </header>
      <main className="p-4">
        <div className="">Описание: {data.task.description}</div>
      </main>
    </>
  );
}
