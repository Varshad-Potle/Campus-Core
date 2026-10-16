interface StatsBentoProps {
  totalStudents: number;
  placedStudents: number;
  totalWindows: number;
  totalSubmissions: number;
}

export function StatsBento({
  totalStudents,
  placedStudents,
  totalWindows,
  totalSubmissions,
}: StatsBentoProps) {
  const placementRate = totalStudents > 0
    ? Math.round((placedStudents / totalStudents) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      {/* Primary */}
      <div className="md:col-span-3 md:row-span-2 bg-primary rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ffffff08_0px_1px,transparent_1px_10px)] pointer-events-none" />
        <div>
          <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-semibold text-white/60 uppercase tracking-widest mb-6">
            Placement Rate
          </span>
          <h3 className="text-6xl font-bold tracking-tighter text-white">
            {placementRate}%
          </h3>
        </div>
        <p className="text-white/60 text-sm max-w-xs">
          {placedStudents} out of {totalStudents} registered students have been placed this year.
        </p>
      </div>

      {/* Total Students */}
      <div className="md:col-span-3 bg-muted rounded-3xl p-8 border border-border flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Total Students
          </p>
          <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
        </div>
        <div className="flex gap-1 items-end h-8">
          {[30, 50, 40, 70, 60, 80, 75, 90, 85, 95, 100].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-foreground/20 rounded-full"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Update Windows */}
      <div className="md:col-span-1 bg-card rounded-3xl p-6 border border-border flex flex-col justify-center text-center">
        <p className="text-2xl font-bold text-foreground">{totalWindows}</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">
          Windows
        </p>
      </div>

      {/* Submissions */}
      <div className="md:col-span-2 bg-muted rounded-3xl p-6 flex items-center gap-4">
        <div className="size-10 text-lg rounded-full bg-background text-foreground flex items-center justify-center shrink-0 shadow-sm font-bold">
          ✦
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">{totalSubmissions}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Total Submissions
          </p>
        </div>
      </div>
    </div>
  );
}