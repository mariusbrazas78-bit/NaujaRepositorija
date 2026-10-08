import { useEffect, useState } from "react";
import TaskList from "./TaskList";
import ProgressBar from "./ProgressBar";
import Navbar from "./Navbar";
import AddTaskForm from "./AddTaskForm";
import Profile from "./Profile";
import Weather from "./Weather";
import "./App.css";

const TASKS_API =
  "https://testapi.io/api/mariusbrazas78-bit/resource/tasklist";
const AUTH_API = "https://testapi.io/api/mariusbrazas78-bit/resource/auth";

function normalizeTask(task) {
  const statusAliases = {
    "Nepradėta": "pending",
    "Vykdoma": "in_progress",
    "Atlikta": "completed",
  };

  return {
    ...task,
    id: task.id,
    title: task.title ?? task.name ?? "",
    status: statusAliases[task.status] ?? task.status ?? "pending",
    deadline: task.deadline ?? task.dueDate ?? "",
  };
}

async function readTasks(response) {
  if (!response.ok) {
    throw new Error("Nepavyko susisiekti su užduočių API.");
  }

  const result = await response.json();
  const tasks = Array.isArray(result) ? result : result.data;
  return Array.isArray(tasks) ? tasks.map(normalizeTask) : [];
}

function App() {
  const user = {
    name: "Jonas Jonaitis",
    email: "jonas@flowly.lt",
  };

  const [activePage, setActivePage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadTasks() {
      try {
        const response = await fetch(TASKS_API);
        const loadedTasks = await readTasks(response);
        if (isActive) setTasks(loadedTasks);
      } catch {
        if (isActive) setTaskError("Nepavyko užkrauti užduočių. Patikrinkite ryšį su API.");
      } finally {
        if (isActive) setIsLoadingTasks(false);
      }
    }

    loadTasks();
    return () => {
      isActive = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(AUTH_API);
      if (!response.ok) throw new Error("api");

      const result = await response.json();
      const users = Array.isArray(result) ? result : result.data;
      if (!Array.isArray(users)) throw new Error("format");

      const matchingUser = users.find(
        (userRecord) =>
          userRecord.username === email.trim() &&
          userRecord.password === password,
      );

      if (!matchingUser) {
        setLoginError(
          users.length === 0
            ? "Auth sąraše nėra paskyrų. Pirmiausia pridėkite naudotoją TestAPI.io."
            : "Neteisingas vartotojo vardas arba slaptažodis.",
        );
        return;
      }

      setIsLoggedIn(true);
      setLoginError("");
    } catch {
      setLoginError("Nepavyko patikrinti prisijungimo duomenų. Patikrinkite API ryšį.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const listResponse = await fetch(AUTH_API);
      if (!listResponse.ok) throw new Error();
      const result = await listResponse.json();
      const users = Array.isArray(result) ? result : result.data;
      if (!Array.isArray(users)) throw new Error();

      if (users.some((item) => item.username?.toLowerCase() === email.trim().toLowerCase())) {
        setLoginError("Šis vartotojo vardas jau užimtas.");
        return;
      }

      const response = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email.trim(), password }),
      });
      if (!response.ok) throw new Error();

      setIsLoggedIn(true);
      setIsRegistering(false);
      setLoginError("");
    } catch {
      setLoginError("Nepavyko sukurti paskyros. Patikrinkite API ryšį ir bandykite dar kartą.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setActivePage("home");
    setEmail("");
    setPassword("");
    setLoginError("");
  }

  async function handleAddTask(newTask) {
    setTaskError("");
    try {
      const response = await fetch(TASKS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          status: newTask.status,
          deadline: newTask.deadline,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error();
      const createdTask = result.data ?? result;
      if (createdTask.id == null) throw new Error();
      setTasks((currentTasks) => [...currentTasks, normalizeTask(createdTask)]);
      return true;
    } catch {
      setTaskError("Nepavyko pridėti užduoties. Bandykite dar kartą.");
      return false;
    }
  }

  async function updateTask(taskId, changes) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    setTaskError("");
    try {
      const apiStatus = {
        "Nepradėta": "pending",
        "Vykdoma": "in_progress",
        "Atlikta": "completed",
      };
      const nextTask = { ...task, ...changes };
      const response = await fetch(`${TASKS_API}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: apiStatus[nextTask.status] ?? nextTask.status,
          deadline: nextTask.deadline,
          title: nextTask.title,
        }),
      });
      if (!response.ok) throw new Error();
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === taskId ? { ...item, ...changes } : item,
        ),
      );
    } catch {
      setTaskError("Nepavyko atnaujinti užduoties. Bandykite dar kartą.");
    }
  }

  async function handleGetTask(taskId) {
    setTaskError("");
    try {
      const response = await fetch(`${TASKS_API}/${taskId}`);
      if (!response.ok) throw new Error();
      const result = await response.json();
      setSelectedTask(normalizeTask(result.data ?? result));
    } catch {
      setTaskError("Nepavyko gauti užduoties. Bandykite dar kartą.");
    }
  }

  async function handleDeleteTask(taskId) {
    setTaskError("");
    try {
      const response = await fetch(`${TASKS_API}/${taskId}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setSelectedTask((currentTask) => currentTask?.id === taskId ? null : currentTask);
    } catch {
      setTaskError("Nepavyko ištrinti užduoties. Bandykite dar kartą.");
    }
  }

  function handleTaskStatusChange(taskId, status) {
    updateTask(taskId, { status });
  }

  function handleTaskDeadlineChange(taskId, deadline) {
    updateTask(taskId, { deadline });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedTaskCount = tasks.filter(
    (task) => task.status === "completed" || task.status === "Atlikta",
  ).length;
  const overdueTaskCount = tasks.filter((task) => {
    if (task.status === "Atlikta" || task.status === "completed" || !task.deadline) return false;
    return new Date(`${task.deadline}T00:00:00`) < today;
  }).length;

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} />

      {activePage === "home" && (
        <>
          {isLoggedIn && (
            <header className="welcome-message">
              <div>
                <h1>Sveiki sugrįžę!</h1>
                <p>Prisijungėte kaip admin.</p>
              </div>
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Atsijungti
              </button>
            </header>
          )}

          <main className="login-page">
            {!isLoggedIn && (
              <div className="login-card">
                <header className="login-card__header">
                  <h1>Sveiki sugrįžę!</h1>
                  <p>Įveskite savo duomenis, kad tęstumėte</p>
                </header>

                <form className="login-form" onSubmit={isRegistering ? handleRegister : handleSubmit}>
                  <label className="login-field">
                    <span>Vartotojo vardas</span>
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      placeholder="Įveskite vartotojo vardą"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>

                  <label className="login-field">
                    <span>Slaptažodis</span>
                    <span className="password-input-wrap">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-visibility-toggle"
                        onClick={() => setIsPasswordVisible((visible) => !visible)}
                        aria-label={isPasswordVisible ? "Slėpti slaptažodį" : "Rodyti slaptažodį"}
                        aria-pressed={isPasswordVisible}
                      >
                        👁
                      </button>
                    </span>
                  </label>

                  {isRegistering && (
                    <label className="login-field">
                      <span>Pakartokite slaptažodį</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        required
                        onChange={(event) => {
                          const confirmation = event.target.value;
                          event.target.setCustomValidity(
                            confirmation === password ? "" : "Slaptažodžiai nesutampa.",
                          );
                        }}
                      />
                    </label>
                  )}

                  <label className="remember-me">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Prisiminti mane</span>
                  </label>

                  <button type="submit" className="login-submit" disabled={isLoggingIn}>
                    {isLoggingIn ? "Tikrinama..." : isRegistering ? "Sukurti paskyrą" : "Prisijungti"}
                  </button>

                  <button
                    type="button"
                    className="login-mode-toggle"
                    onClick={() => {
                      setIsRegistering((current) => !current);
                      setLoginError("");
                    }}
                  >
                    {isRegistering ? "Jau turite paskyrą? Prisijunkite" : "Neturite paskyros? Registruokitės"}
                  </button>

                  {!isRegistering && (
                    <a className="login-forgot-password" href="#" onClick={(event) => event.preventDefault()}>
                      Pamiršote slaptažodį?
                    </a>
                  )}

                  {loginError && <p className="login-error" role="alert">{loginError}</p>}
                </form>
              </div>
            )}

            {isLoggedIn && (
              <>
                <section className="dashboard-summary" aria-label="Užduočių suvestinė">
                  <p>
                    <strong>{tasks.length} užduotys</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{completedTaskCount} atliktos</strong>
                    <span aria-hidden="true">·</span>
                    <strong>{overdueTaskCount} vėluoja</strong>
                  </p>
                </section>

                <TaskList
                  tasks={tasks}
                  loading={isLoadingTasks}
                  onStatusChange={handleTaskStatusChange}
                  onDeadlineChange={handleTaskDeadlineChange}
                  onGetTask={handleGetTask}
                  onDeleteTask={handleDeleteTask}
                />
                <ProgressBar tasks={tasks} />
              </>
            )}
          </main>
        </>
      )}

      {activePage === "tasks" && (
        <main className="login-page">
          <button
            type="button"
            className="back-button"
            onClick={() => setActivePage("home")}
          >
            ← Grįžti atgal
          </button>
          {taskError && <p className="login-error" role="alert">{taskError}</p>}
          <TaskList
            tasks={tasks}
            loading={isLoadingTasks}
            onStatusChange={handleTaskStatusChange}
            onDeadlineChange={handleTaskDeadlineChange}
            onGetTask={handleGetTask}
            onDeleteTask={handleDeleteTask}
          />
          <AddTaskForm onAddTask={handleAddTask} error={taskError} />
          {selectedTask && (
            <aside className="selected-task" aria-live="polite">
              <h2>Užduoties informacija</h2>
              <p><strong>{selectedTask.title}</strong></p>
              <p>Būsena: {selectedTask.status}</p>
              <p>Terminas: {selectedTask.deadline}</p>
              <button type="button" onClick={() => setSelectedTask(null)}>Uždaryti</button>
            </aside>
          )}
        </main>
      )}

      {activePage === "progress" && (
        <main className="login-page">
          <ProgressBar tasks={tasks} />
        </main>
      )}

      {activePage === "weather" && <Weather />}

      {activePage === "profile" && <Profile user={user} tasks={tasks} />}
    </>
  );
}

export default App;
