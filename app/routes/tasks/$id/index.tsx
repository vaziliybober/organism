import { Task } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  MetaFunction,
  redirect,
  useCatch,
  useLoaderData,
} from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import PencilSvg from "~/icons/pencil";
import TrashSvg from "~/icons/trash";
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
  const user = await requireCurrentUser(request);
  const { id } = params;
  invariant(typeof id === "string");
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) {
    throw new Response("Not found", { status: 404 });
  }
  return json<LoaderData>({ task });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { taskId } = formValues;
  invariant(typeof taskId === "string");
  const user = await requireCurrentUser(request);
  await prisma.task.deleteMany({ where: { id: taskId, userId: user.id } });
  return redirect("/tasks");
};

export default function TaskRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <header className="p-4">
        <h2 className="text-center font-bold">{data.task.title}</h2>
      </header>
      <main className="p-4">
        <div>Description: {data.task.description}</div>
        <div className="fixed right-5 bottom-5 flex gap-2">
          <Link to="edit">
            <div className="rounded-full border-2 border-gray-700 p-[6px]">
              <PencilSvg width={20} height={20} className="fill-gray-700" />
            </div>
            <input type="hidden" name="taskId" value={data.task.id} />
          </Link>
          <Form method="post" replace>
            <button type="submit">
              <div className="rounded-full border-2 border-red-700 p-1">
                <TrashSvg className="fill-red-700" />
              </div>
              <input type="hidden" name="taskId" value={data.task.id} />
            </button>
          </Form>
        </div>
      </main>
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Task not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
