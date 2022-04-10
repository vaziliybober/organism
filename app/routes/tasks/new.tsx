import {
  ActionFunction,
  Form,
  json,
  MetaFunction,
  redirect,
  useActionData,
  useSearchParams,
  useTransition,
} from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { NestedPageLayout, validateHowSoon } from "~/utils";
import { requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = () => ({
  title: "Organism | New task",
  description: "Create a new task",
});

type ActionData = {
  errors?: {
    title?: string;
  };
  values?: {
    title: string;
    howSoon: string;
    description: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { title, howSoon } = formValues;
  invariant(
    typeof title === "string" &&
      typeof formValues.description === "string" &&
      validateHowSoon(howSoon)
  );
  const description = formValues.description || null;
  if (title.length === 0) {
    return json<ActionData>(
      {
        errors: { title: "Please, fill out the title" },
        values: { title, howSoon, description: formValues.description },
      },
      { status: 400 }
    );
  }
  const user = await requireCurrentUser(request);
  await prisma.task.create({
    data: { title, howSoon, description, userId: user.id },
  });
  return redirect(`/tasks/${howSoon}`);
};

export default function New() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "inbox";
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  const howSoon = actionData?.values?.howSoon || from;
  return (
    <NestedPageLayout title="New task" backTo={`/tasks/${from}`}>
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
              defaultValue={actionData?.values?.title}
              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
            />
            {actionData?.errors?.title && (
              <div className="pt-1 text-red-700">{actionData.errors.title}</div>
            )}
          </div>
        </div>
        <div>
          <p className="block text-sm font-medium text-gray-700">How soon</p>
          <div className="flex flex-wrap gap-3">
            <div className="mt-1">
              <input
                id="inbox"
                name="howSoon"
                value="inbox"
                type="radio"
                defaultChecked={howSoon === "inbox"}
                className="peer hidden"
              />
              <label
                htmlFor="inbox"
                className="block rounded border-2 border-gray-500 px-2 py-1 peer-checked:border-blue-500"
              >
                Inbox
              </label>
            </div>
            <div className="mt-1">
              <input
                id="today"
                name="howSoon"
                value="today"
                type="radio"
                defaultChecked={howSoon === "today"}
                className="peer hidden"
              />
              <label
                htmlFor="today"
                className="block rounded border-2 border-gray-500 px-2 py-1 peer-checked:border-blue-500"
              >
                Today
              </label>
            </div>
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
              defaultValue={actionData?.values?.description}
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
    </NestedPageLayout>
  );
}
