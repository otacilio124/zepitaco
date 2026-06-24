type TeamFormProps = {
  form: string | null;
  teamName: string;
};

export function TeamForm({ form, teamName }: TeamFormProps) {
  if (!form || form === "-----") return null;

  const results = form.split("");
  const colorMap: Record<string, string> = {
    W: "bg-accent-green text-black",
    D: "bg-accent-yellow text-black",
    L: "bg-accent-red text-white",
  };
  const labelMap: Record<string, string> = { W: "V", D: "E", L: "D" };

  return (
    <div>
      <div className="text-xs text-muted mb-2">{teamName} — Últimos 5 jogos</div>
      <div className="flex gap-1.5">
        {results.map((r, i) => (
          <div
            key={i}
            className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
              colorMap[r] || "bg-card-border text-muted"
            }`}
          >
            {labelMap[r] || "-"}
          </div>
        ))}
      </div>
    </div>
  );
}
