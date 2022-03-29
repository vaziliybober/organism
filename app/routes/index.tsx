import { Link } from "remix";
import logo from "~/logo.png";

export default function Index() {
  return (
    <main className="flex h-full flex-col items-center p-1.5">
      <h1 className="mt-16 mb-5 text-5xl">Organism</h1>
      <Link
        to="/"
        className="rounded-lg bg-green-500 px-7 py-3 font-medium text-white hover:bg-green-600"
      >
        Go to tasks
      </Link>
      <img
        src={logo}
        alt="logo"
        className="mt-auto mb-16 w-[256px] sm:w-[350px] "
      />
    </main>
  );
}
