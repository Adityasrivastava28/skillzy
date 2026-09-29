import { Card } from "./Card";

export function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      {icon && <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">{icon}</span>}
      <div>
        <p className="font-heading text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}
