import { Task } from "@prisma/client";
import { json, Link, LoaderFunction, useLoaderData } from "remix";
import { prisma } from "~/db.server";
import PlusSvg from "~/icons/plus";
import { requireCurrentUser } from "~/utils.server";

type LoaderData = {
  tasks: Task[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireCurrentUser(request);
  const tasks = await prisma.task.findMany({ where: { userId: user.id } });
  return json<LoaderData>({ tasks });
};

export default function Index() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <ul>
        {data.tasks.map((task) => (
          <li key={task.id} className="even:bg-gray-100">
            <Link to={task.id}>
              <h2 className="border-b p-4 font-bold text-gray-700">
                {task.title}
              </h2>
            </Link>
          </li>
        ))}
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