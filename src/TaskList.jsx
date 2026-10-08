import "./TaskList.css";

function getDaysRemaining(deadline) {
  if (!deadline) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return null;

  return Math.round((dueDate - today) / 86400000);
}

function getDaysLabel(days) {
  if (days === null) return "Terminas nenurodytas";
  if (days < 0) return `VÄ—luoja ${Math.abs(days)} d.`;
  if (days === 0) return "Terminas Å¡iandien";
  return `Liko ${days} d.`;
}

function TaskList({
  tasks = [],
  loading = false,
  onStatusChange,
  onDeadlineChange,
  onGetTask,
  onDeleteTask,
}) {
  if (loading) {
    return <section className="task-card"><p className="task-state">Kraunamos uÅ¾duotys...</p></section>;
  }

  if (tasks.length === 0) {
    return <section className="task-card"><p className="task-state">UÅ¾duoÄiÅ³ kol kas nÄ—ra.</p></section>;
  }

  return (
    <section className="task-card">
      <header className="task-card__header">
        <h2>UÅ¾duotys</h2>
        <p>Artimiausi darbai ir jÅ³ bÅ«sena</p>
      </header>
      <div className="task-list">
        {tasks.map((task) => (
          <article className="task-item" key={task.id}>
            {(() => {
              const daysRemaining = getDaysRemaining(task.deadline);
              const completed = task.status === "completed" || task.status === "Atlikta";
              return (
                <>
            <div className="task-item__top">
              <h3>{task.title}</h3>
              <label className="task-status-field">
                <span className="visually-hidden">UÅ¾duoties bÅ«sena</span>
                <select
                  className={`task-status task-status--${task.status}`}
                  value={task.status}
                  onChange={(event) => onStatusChange?.(task.id, event.target.value)}
                  aria-label={`Keisti uÅ¾duoties â€ž${task.title}â€œ bÅ«senÄ…`}
                >
                  <option value="pending">NepradÄ—ta</option>
                  <option value="in_progress">Vykdoma</option>
                  <option value="completed">Atlikta</option>
                </select>
              </label>
              <span className={`task-days${daysRemaining !== null && daysRemaining < 0 && !completed ? " task-days--overdue" : ""}`}>
                {completed ? "Atlikta" : getDaysLabel(daysRemaining)}
              </span>
            </div>
            <p className="task-deadline">
              <span>Terminas:</span>
              <input
                type="date"
                value={task.deadline ?? ""}
                onChange={(event) => onDeadlineChange?.(task.id, event.target.value)}
                aria-label={`Keisti uÅ¾duoties â€ž${task.title}â€œ terminÄ…`}
              />
            </p>
            <div className="task-item__actions">
              <button type="button" onClick={() => onGetTask?.(task.id)}>PerÅ¾iÅ«rÄ—ti</button>
              <button type="button" className="task-delete" onClick={() => onDeleteTask?.(task.id)}>IÅ¡trinti</button>
            </div>
                </>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}

export default TaskList;

