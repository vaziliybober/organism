import { Task } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  MetaFunction,
  redirect,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
  useTransition,
} from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { BackLink } from "~/utils";
import { requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = ({ data }) => {
  return {
    title: `Organism | Edit ${data?.task?.title || "?"}`,
    description: `Edit your task ${data?.task?.title || "?"}`,
  };
};

type LoaderData = {
  task: Task;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireCurrentUser(request);
  const { id } = params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) {
    throw new Response("Not found", { status: 404 });
  }
  return json<LoaderData>({ task });
};

type ActionData = {
  errors?: {
    title?: string;
  };
  values?: {
    title: string;
    description: string;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { title } = formValues;
  invariant(
    typeof title === "string" && typeof formValues.description === "string"
  );
  const description = formValues.description || null;
  if (title.length === 0) {
    return json<ActionData>(
      {
        errors: { title: "Please, fill out the title" },
        values: { title, description: formValues.description },
      },
      { status: 400 }
    );
  }
  const user = await requireCurrentUser(request);
  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: { title, description, userId: user.id },
  });
  return redirect(`/tasks/${id}`);
};

export default function New() {
  const { id } = useParams();
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  return (
    <>
      <BackLink to={`../${id}`} />
      <header className="p-4">
        <h1 className="text-center text-xl font-bold">Edit task</h1>
      </header>
      <main>
        <Form
          method="post"
          className="mx-auto max-w-3xl space-y-6 py-7 px-4"
          noValidate
          replace
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <div className="mt-1">
              <input
                id="title"
                required
                autoFocus
                name="title"
                type="text"
                defaultValue={data.task.title}
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.title && (
                <div className="pt-1 text-red-700">
                  {actionData.errors.title}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                defaultValue={data.task.description || ""}
                className="min-h-[125px] w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={!!transition.submission}
              className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
            >
              {transition.submission ? "Saving task..." : "Save"}
            </button>
          </div>
        </Form>
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
