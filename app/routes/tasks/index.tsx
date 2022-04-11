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
import { dateToIso, requireCurrentUser } from "~/utils.server";
import { PageLayout, isoToString } from "~/utils";
import invariant from "tiny-invariant";
import classNames from "classnames";
import { Task } from "@prisma/client";
import moment from "moment";

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
  aLongTimeAgo: LoaderTask[];
  lastYear: LoaderTask[];
  lastMonth: LoaderTask[];
  lastWeek: LoaderTask[];
  yesterday: LoaderTask[];
  today: LoaderTask[];
  tomorrow: LoaderTask[];
  thisWeek: LoaderTask[];
  nextWeek: LoaderTask[];
  thisMonth: LoaderTask[];
  nextMonth: LoaderTask[];
  thisYear: LoaderTask[];
  nextYear: LoaderTask[];
  notVerySoon: LoaderTask[];
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

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { from: "asc" }, { to: "asc" }],
  });
  const isALongTimeAgo = (task: Task) => {
    return task.to && task.to < dates.aLongTimeAgo;
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
  const isToday = (task: Task) => {
    return (
      (task.to && task.to >= dates.yesterday && task.to < dates.today) ||
      (task.from && task.from < dates.today)
    );
  };
  const isTomorrow = (task: Task) => {
    if (task.to && task.to < dates.today) return false;
    if (task.from && task.from < dates.today) return false;
    return (
      (task.to && task.to <= dates.tomorrow) ||
      (task.from && task.from <= dates.tomorrow)
    );
  };
  const isThisWeek = (task: Task) => {
    if (task.to && task.to <= dates.tomorrow) return false;
    if (task.from && task.from <= dates.tomorrow) return false;
    return (
      (task.to && task.to <= dates.thisWeek) ||
      (task.from && task.from <= dates.thisWeek)
    );
  };
  const isNextWeek = (task: Task) => {
    if (task.to && task.to <= dates.thisWeek) return false;
    if (task.from && task.from <= dates.thisWeek) return false;
    return (
      (task.to && task.to <= dates.nextWeek) ||
      (task.from && task.from <= dates.nextWeek)
    );
  };
  const isThisMonth = (task: Task) => {
    if (task.to && task.to <= dates.nextWeek) return false;
    if (task.from && task.from <= dates.nextWeek) return false;
    return (
      (task.to && task.to <= dates.thisMonth) ||
      (task.from && task.from <= dates.thisMonth)
    );
  };
  const isNextMonth = (task: Task) => {
    if (task.to && task.to <= dates.thisMonth) return false;
    if (task.from && task.from <= dates.thisMonth) return false;
    return (
      (task.to && task.to <= dates.nextMonth) ||
      (task.from && task.from <= dates.nextMonth)
    );
  };
  const isThisYear = (task: Task) => {
    if (task.to && task.to <= dates.nextMonth) return false;
    if (task.from && task.from <= dates.nextMonth) return false;
    return (
      (task.to && task.to <= dates.thisYear) ||
      (task.from && task.from <= dates.thisYear)
    );
  };
  const isNextYear = (task: Task) => {
    if (task.to && task.to <= dates.thisYear) return false;
    if (task.from && task.from <= dates.thisYear) return false;
    return (
      (task.to && task.to <= dates.nextYear) ||
      (task.from && task.from <= dates.nextYear)
    );
  };
  const isNotVerySoon = (task: Task) => {
    if (task.to && task.to <= dates.nextYear) return false;
    if (task.from && task.from <= dates.nextYear) return false;
    return task.to || task.from;
  };

  return json<LoaderData>({
    aLongTimeAgo: tasks.filter(isALongTimeAgo).map(convert),
    lastYear: tasks.filter(isLastYear).map(convert),
    lastMonth: tasks.filter(isLastMonth).map(convert),
    lastWeek: tasks.filter(isLastWeek).map(convert),
    yesterday: tasks.filter(isYesterday).map(convert),
    today: tasks.filter(isToday).map(convert),
    tomorrow: tasks.filter(isTomorrow).map(convert),
    thisWeek: tasks.filter(isThisWeek).map(convert),
    nextWeek: tasks.filter(isNextWeek).map(convert),
    thisMonth: tasks.filter(isThisMonth).map(convert),
    nextMonth: tasks.filter(isNextMonth).map(convert),
    thisYear: tasks.filter(isThisYear).map(convert),
    nextYear: tasks.filter(isNextYear).map(convert),
    notVerySoon: tasks.filter(isNotVerySoon).map(convert),
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
      <TasksSection title="A Long Time Ago" tasks={data.aLongTimeAgo} />
      <TasksSection title="Last Year" tasks={data.lastYear} />
      <TasksSection title="Last Month" tasks={data.lastMonth} />
      <TasksSection title="Last Week" tasks={data.lastWeek} />
      <TasksSection title="Yesterday" tasks={data.yesterday} />
      <TasksSection title="Today" tasks={data.today} />
      <TasksSection title="Tomorrow" tasks={data.tomorrow} />
      <TasksSection title="This Week" tasks={data.thisWeek} />
      <TasksSection title="Next Week" tasks={data.nextWeek} />
      <TasksSection title="This Month" tasks={data.thisMonth} />
      <TasksSection title="Next Month" tasks={data.nextMonth} />
      <TasksSection title="This Year" tasks={data.thisYear} />
      <TasksSection title="Next Year" tasks={data.nextYear} />
      <TasksSection title="Not Very Soon" tasks={data.notVerySoon} />
      <div className="h-20" />
      <Link to="/tasks/new" className="fixed bottom-5 right-5">
        <PlusSvg className="fill-green-600" width={48} height={48} />
      </Link>
    </PageLayout>
  );
}

function TasksSection({
  tasks,
  title,
}: {
  tasks: LoaderTask[];
  title?: string;
}) {
  return (
    <>
      {title && (
        <h2
          className={classNames("p-2", { "text-gray-400": tasks.length === 0 })}
        >
          {title}
        </h2>
      )}
      <ul>
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </ul>
    </>
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
            {task.from && (
              <div className="font-mono">From: {isoToString(task.from)}</div>
            )}
            {task.to && (
              <div className="font-mono">
                To: &nbsp;&nbsp;{isoToString(task.to)}
              </div>
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
