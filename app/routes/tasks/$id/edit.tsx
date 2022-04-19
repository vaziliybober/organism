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
import { NestedPageLayout } from "~/utils";
import { dateToIso, requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = ({ data }) => {
  return {
    title: `Organism | Edit ${data?.task?.title || "?"}`,
    description: `Edit your task ${data?.task?.title || "?"}`,
  };
};

type LoaderData = {
  task: Omit<Omit<Task, "from">, "to"> & {
    from: string | null;
    to: string | null;
  };
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireCurrentUser(request);
  const { id } = params;
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) {
    throw new Response("Not found", { status: 404 });
  }
  return json<LoaderData>({
    task: {
      ...task,
      from: dateToIso(task.from),
      to: dateToIso(task.to),
    },
  });
};

type ActionData = {
  errors?: {
    title?: string;
    to?: string;
  };
  values?: {
    title: string;
    description: string;
    from: string;
    to: string;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { title, description, from, to } = formValues;
  invariant(
    typeof title === "string" &&
      typeof description === "string" &&
      typeof from === "string" &&
      typeof to === "string" &&
      (from === "" || Date.parse(from)) &&
      (to === "" || Date.parse(to))
  );
  if (title.length === 0) {
    return json<ActionData>(
      {
        errors: { title: "Please, fill out the title" },
        values: { title, description, from, to },
      },
      { status: 400 }
    );
  }
  if (new Date(to) < new Date(from)) {
    return json<ActionData>(
      {
        errors: { to: "Can't be earlier than 'from'" },
        values: { title, description, from, to },
      },
      { status: 400 }
    );
  }
  const user = await requireCurrentUser(request);
  await prisma.task.updateMany({
    where: { id, userId: user.id },
    data: {
      title,
      description: description || null,
      from: from ? new Date(from + "+03:00") : null,
      to: to ? new Date(to + "+03:00") : null,
    },
  });
  return redirect(`/tasks/${id}`);
};

export default function New() {
  const { id } = useParams();
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  return (
    <NestedPageLayout title="Edit task" backTo={`../${id}`}>
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
              <div className="pt-1 text-red-700">{actionData.errors.title}</div>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="from"
            className="block text-sm font-medium text-gray-700"
          >
            From
          </label>
          <div className="mt-1">
            <input
              id="from"
              name="from"
              type="datetime-local"
              defaultValue={actionData?.values?.from || data.task.from || ""}
              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="to"
            className="block text-sm font-medium text-gray-700"
          >
            To
          </label>
          <div className="mt-1">
            <input
              id="to"
              name="to"
              type="datetime-local"
              defaultValue={actionData?.values?.to || data.task.to || ""}
              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
            />
            {actionData?.errors?.to && (
              <div className="pt-1 text-red-700">{actionData.errors?.to}</div>
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
    </NestedPageLayout>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Task not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
