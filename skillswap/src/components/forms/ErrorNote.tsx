export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}
