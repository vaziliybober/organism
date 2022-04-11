import {
  ActionFunction,
  json,
  Link,
  LoaderFunction,
  MetaFunction,
  useFetcher,
  useLoaderData,
} from "remix";
import { prisma } from "~/db.server";
import PlusSvg from "~/icons/plus";
import NotTickedSvg from "~/icons/not-ticked";
import Ticked from "~/icons/ticked";
import { dateToString, requireCurrentUser } from "~/utils.server";
import { PageLayout } from "~/utils";
import invariant from "tiny-invariant";
import classNames from "classnames";

export const meta: MetaFunction = () => ({
  title: "Organism | Tasks",
  description: "Your tasks",
});

type LoaderTask = {
  id: string;
  title: string;
  from: string | null;
  to: string | null;
  completed: boolean;
  description: string;
};

type LoaderData = {
  tasks: LoaderTask[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      from: true,
      to: true,
      completed: true,
      description: true,
    },
  });
  return json<LoaderData>({
    tasks: tasks.map((task) => ({
      ...task,
      from: dateToString(task.from),
      to: dateToString(task.to),
      description: task.description || "",
    })),
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { _action, taskId } = formValues;
  invariant(typeof taskId === "string");
  const user = await requireCurrentUser(request);
  if (_action === "finish") {
    await prisma.task.updateMany({
      where: { id: taskId, userId: user.id },
      data: { completed: true },
    });
    return json({});
  }
  if (_action === "restore") {
    await prisma.task.updateMany({
      where: { id: taskId, userId: user.id },
      data: { completed: false },
    });
    return json({});
  }
  throw new Error(`invalid _action: ${_action}`);
};

export default function Index() {
  const data = useLoaderData<LoaderData>();
  return (
    <PageLayout title="Tasks">
      <ul>
        {data.tasks.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </ul>
      <Link to="/tasks/new" className="fixed bottom-5 right-5">
        <PlusSvg className="fill-green-600" width={48} height={48} />
      </Link>
    </PageLayout>
  );
}

function TaskListItem({ task }: { task: LoaderTask }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.submission?.formData.get("taskId") === task.id;
  return (
    <li
      key={task.id}
      className={classNames("relative border-b hover:bg-gray-100", {
        "bg-gray-200": isSubmitting,
        "hover:bg-gray-200": isSubmitting,
      })}
    >
      <Link
        to={`/tasks/${task.id}`}
        className="px-3 py-1 flex items-center min-h-[38px]"
      >
        <div>
          <h2 className="font-bold text-gray-700">{task.title}</h2>
          <div className="text-xs text-gray-600">
            {task.from && <div className="font-mono">From: {task.from}</div>}
            {task.to && (
              <div className="font-mono">To: &nbsp;&nbsp;{task.to}</div>
            )}
          </div>
        </div>
      </Link>
      <fetcher.Form
        method="post"
        action="?index"
        className="absolute right-2 top-1/2 flex -translate-y-1/2"
        replace
      >
        <button
          type="submit"
          name="_action"
          value={task.completed ? "restore" : "finish"}
          disabled={isSubmitting}
          className="no-tap-highlight my-auto touch-none p-2 focus:bg-none focus:outline-none active:bg-none active:outline-none"
        >
          {task.completed ? (
            <Ticked width={22} height={22} className="fill-green-700" />
          ) : (
            <NotTickedSvg width={22} height={22} className="fill-gray-500" />
          )}
        </button>
        <input type="hidden" name="taskId" value={task.id} />
      </fetcher.Form>
    </li>
  );
}
