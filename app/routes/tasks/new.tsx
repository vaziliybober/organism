import {
  ActionFunction,
  Form,
  json,
  redirect,
  useActionData,
  useTransition,
} from "remix";
import { prisma } from "~/db.server";
import { requireCurrentUser } from "~/utils.server";

type ActionData = {
  errors?: {
    title?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  const formData = await request.formData();
  const title = formData.get("title");
  let description = formData.get("description");
  if (typeof title !== "string" || title.length === 0) {
    return json<ActionData>(
      {
        errors: { title: "Please, fill out the title" },
      },
      { status: 400 }
    );
  }
  if (typeof description !== "string") {
    description = "";
  }
  await prisma.task.create({ data: { title, description, userId: user.id } });
  return redirect("/tasks");
};

export default function New() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  return (
    <Form
      method="post"
      className="max-w-3xl space-y-6 py-7 px-10"
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
            className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
          />
          {actionData?.errors?.title && (
            <div className="pt-1 text-red-700">{actionData.errors.title}</div>
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
          {transition.submission ? "Creating task..." : "Create task"}
        </button>
      </div>
    </Form>
  );
}
