import Link from "next/link";

export default function Page() {
  return (
    <div className="max-w-lg w-full mx-auto mt-12">
      <div className="min-h-[30vh] bg-secondary/20 p-6 border rounded-xl flex-col text-center flex items-center justify-center">
        <div className="text-3xl font-bold">We’ll be back soon!</div>
        <div className="mt-4 text-muted-foreground">
          <span>
            Scheduled maintenance is in progress. For more information, please
            check our
          </span>
          <Link
            href="https://x.com/RichSwap_REE/status/1901604760438099979"
            target="_blank"
            className="text-foreground inline-flex text-lg ml-2"
          >
            X
          </Link>
        </div>
      </div>
    </div>
  );
}
