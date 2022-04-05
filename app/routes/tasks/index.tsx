import { Task } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useLoaderData,
} from "remix";
import { prisma } from "~/db.server";
import PlusSvg from "~/icons/plus";
import NotTickedSvg from "~/icons/not-ticked";
import Ticked from "~/icons/ticked";
import { requireCurrentUser } from "~/utils.server";

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

function Tick({ ticked }: { ticked: boolean }) {
  if (ticked) {
    return <Ticked width={22} height={22} className="fill-green-700" />;
  }
  return <NotTickedSvg width={22} height={22} className="fill-gray-500" />;
}

export default function Index() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <ul>
        {data.tasks.map((task) => {
          return (
            <li key={task.id} className="relative border-b hover:bg-gray-100">
              <Link
                to={task.id}
                className="flex items-center justify-between p-4"
              >
                <h2 className="font-bold text-gray-700">{task.title}</h2>
              </Link>
              <Form
                method="post"
                action="?index"
                className="absolute right-2 top-1/2 flex -translate-y-1/2"
                replace
              >
                <button type="submit" className="my-auto p-2">
                  <Tick ticked={task.completed} />
                </button>
                <input type="hidden" name="taskId" value={task.id} />
                <input
                  type="hidden"
                  name="completed"
                  value={String(!task.completed)}
                />
              </Form>
            </li>
          );
        })}
      </ul>
      <Link to="new">
        <PlusSvg
          className="absolute bottom-5 right-5 fill-green-600"
          width={48}
          height={48}
        />
      </Link>
    </>
  );
}
