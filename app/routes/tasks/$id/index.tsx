import { Task } from "@prisma/client";
import moment from "moment";
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
  useTransition,
} from "remix";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import NotTickedSvg from "~/icons/not-ticked";
import PencilSvg from "~/icons/pencil";
import TickedSvg from "~/icons/ticked";
import TrashSvg from "~/icons/trash";
import { isoToString, NestedPageLayout } from "~/utils";
import { dateToIso, requireCurrentUser } from "~/utils.server";

export const meta: MetaFunction = ({ data }) => {
  return {
    title: `Organism | ${data?.task?.title || "?"}`,
    description: `Your task ${data?.task?.title || "?"}`,
  };
};

type LoaderTask = {
  id: string;
  title: string;
  from: string | null;
  to: string | null;
  completed: boolean;
  description: string;
};

type LoaderData = {
  task: LoaderTask;
  backTo: string;
};

function convert(task: Task) {
  return {
    ...task,
    from: dateToIso(task.from),
    to: dateToIso(task.to),
    description: task.description || "",
  };
}

const dates = {
  aLongTimeAgo: moment().startOf("year").toDate(),
  lastYear: moment().subtract(1, "month").startOf("month").toDate(),
  lastMonth: moment().subtract(1, "week").startOf("week").toDate(),
  lastWeek: moment().subtract(1, "day").startOf("day").toDate(),
  yesterday: moment().startOf("day").toDate(),
  today: moment().add(1, "day").startOf("day").toDate(),
  tomorrow: moment().add(1, "day").endOf("day").toDate(),
  thisWeek: moment().endOf("week").toDate(),
  nextWeek: moment().add(1, "week").endOf("week").toDate(),
  thisMonth: moment().endOf("month").toDate(),
  nextMonth: moment().add(1, "month").endOf("month").toDate(),
  thisYear: moment().endOf("year").toDate(),
  nextYear: moment().add(1, "year").endOf("year").toDate(),
};

const isALongTimeAgo = (task: Task) => {
  return !task.completed && task.to && task.to < dates.aLongTimeAgo;
};
const isLastYear = (task: Task) => {
  return task.to && task.to >= dates.aLongTimeAgo && task.to < dates.lastYear;
};
const isLastMonth = (task: Task) => {
  return task.to && task.to >= dates.lastYear && task.to < dates.lastMonth;
};
const isLastWeek = (task: Task) => {
  return task.to && task.to >= dates.lastMonth && task.to < dates.lastWeek;
};
const isYesterday = (task: Task) => {
  return task.to && task.to >= dates.lastWeek && task.to < dates.yesterday;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireCurrentUser(request);
  const { id } = params;
  invariant(typeof id === "string");
  const task = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!task) {
    throw new Response("Not found", { status: 404 });
  }
  const backTo =
    !task.from && !task.to
      ? "/tasks/inbox"
      : task.completed &&
        (isALongTimeAgo(task) ||
          isLastYear(task) ||
          isLastMonth(task) ||
          isLastWeek(task) ||
          isYesterday(task))
      ? "/tasks/completed"
      : "/tasks";

  return json<LoaderData>({ task: convert(task), backTo });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);
  const { _action, taskId } = formValues;
  invariant(typeof taskId === "string");
  const user = await requireCurrentUser(request);
  if (_action === "delete") {
    await prisma.task.deleteMany({ where: { id: taskId, userId: user.id } });
    return redirect("/tasks");
  }
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

export default function TaskRoute() {
  const data = useLoaderData<LoaderData>();
  const transition = useTransition();
  const tickRestoring =
    transition.submission?.formData.get("_action")?.toString() === "restore";
  const tickFinishing =
    transition.submission?.formData.get("_action")?.toString() === "finish";
  return (
    <NestedPageLayout title={"Task"} backTo={data.backTo}>
      <div className="p-4">
        <h2 className="text-center text-xl font-medium mb-4">
          {data.task.title}
        </h2>
        {data.task.from && (
          <div className="font-mono">From: {isoToString(data.task.from)}</div>
        )}
        {data.task.to && (
          <div className="font-mono">
            To: &nbsp;&nbsp;{isoToString(data.task.to)}
          </div>
        )}
        {data.task.description && (
          <div className="mt-4 border-t pt-4">{data.task.description}</div>
        )}
        <div className="pb-14" />
        <div className="fixed right-5 bottom-5 flex gap-2">
          <Form method="post" replace>
            <button
              type="submit"
              name="_action"
              value={
                tickRestoring
                  ? "finish"
                  : tickFinishing
                  ? "restore"
                  : data.task.completed
                  ? "restore"
                  : "finish"
              }
              className="no-tap-highlight"
            >
              {tickFinishing || (!tickRestoring && data.task.completed) ? (
                <TickedSvg width={36} height={36} className="fill-green-700" />
              ) : (
                <NotTickedSvg
                  width={36}
                  height={36}
                  className="fill-gray-500"
                />
              )}
              <input type="hidden" name="taskId" value={data.task.id} />
            </button>
          </Form>
          <Link to="edit">
            <div className="rounded-full border-2 border-gray-700 p-[6px]">
              <PencilSvg width={20} height={20} className="fill-gray-700" />
            </div>
            <input type="hidden" name="taskId" value={data.task.id} />
          </Link>
          <Form method="post" replace>
            <button type="submit" name="_action" value="delete">
              <div className="rounded-full border-2 border-red-700 p-1">
                <TrashSvg className="fill-red-700" />
              </div>
              <input type="hidden" name="taskId" value={data.task.id} />
            </button>
          </Form>
        </div>
      </div>
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
