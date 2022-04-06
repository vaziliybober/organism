import { Task } from "@prisma/client";
import {
  ActionFunction,
  json,
  Link,
  LoaderFunction,
  useFetcher,
  useLoaderData,
} from "remix";
import { prisma } from "~/db.server";
import PlusSvg from "~/icons/plus";
import NotTickedSvg from "~/icons/not-ticked";
import Ticked from "~/icons/ticked";
import { requireCurrentUser } from "~/utils.server";
import { useEffect, useState } from "react";
import { PageLayout } from "~/utils";

type LoaderData = {
  tasks: Task[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  const tasks = await prisma.task.findMany({ where: { userId: user.id } });
  return json<LoaderData>({ tasks });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const taskId = formData.get("taskId");
  const completed = formData.get("completed") === "true" ? true : false;
  if (typeof taskId !== "string") {
    return json({}, { status: 400 });
  }
  await prisma.task.update({
    where: { id: taskId },
    data: { completed },
  });
  return json({});
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
      <Link to="new" className="fixed bottom-5 right-5">
        <PlusSvg className="fill-green-600" width={48} height={48} />
      </Link>
    </PageLayout>
  );
}

function TaskListItem({ task }: { task: Task }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.submission?.formData.get("taskId") === task.id;
  const [ticked, setTicked] = useState(task.completed);
  useEffect(() => {
    if (fetcher.state === "idle") {
      setTicked(task.completed);
    }
  }, [task.completed, fetcher.state]);
  return (
    <li key={task.id} className="relative border-b hover:bg-gray-100">
      <Link to={task.id} className="flex items-center justify-between p-4">
        <h2 className="font-bold text-gray-700">{task.title}</h2>
      </Link>
      <fetcher.Form
        method="post"
        action="?index"
        className="absolute right-2 top-1/2 flex -translate-y-1/2"
        replace
      >
        <button
          type="submit"
          className="no-tap-highlight my-auto touch-none p-2 focus:bg-none focus:outline-none active:bg-none active:outline-none"
          onClick={() => setTicked((old) => !old)}
        >
          {ticked ? (
            <Ticked width={22} height={22} className="fill-green-700" />
          ) : (
            <NotTickedSvg width={22} height={22} className="fill-gray-500" />
          )}
        </button>
        <input type="hidden" name="taskId" value={task.id} />
        <input
          type="hidden"
          name="completed"
          value={String(isSubmitting ? ticked : !task.completed)}
        />
      </fetcher.Form>
    </li>
  );
}
