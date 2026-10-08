import "./ProgressBar.css";

function ProgressBar({ tasks = [] }) {
  const completedTasks = tasks.filter(
    (task) => task.status === "completed" || task.status === "Atlikta",
  ).length;
  const totalTasks = tasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <section className="progress-card">
      <div className="progress-card__top">
        <div>
          <h2>Progresas</h2>
          <p>Atlikta {completedTasks} iš {totalTasks} užduočių</p>
        </div>
        <span className="progress-card__percentage">{progress}%</span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Užduočių atlikimo progresas"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress}
      >
        <span className="progress-bar__fill" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

export default ProgressBar;
