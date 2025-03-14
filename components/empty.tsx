import Image from "next/image";
export function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center flex-col justify-center py-12 gap-6">
      <Image
        src="/static/empty.svg"
        width={200}
        height={200}
        alt="Empty"
        className="w-20 h-20"
      />
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}
