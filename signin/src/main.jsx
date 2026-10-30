import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const N8N_BASE = import.meta.env.VITE_N8N_AUTH_WEBHOOK || "";

async function callAuth(action, payload) {
  if (!N8N_BASE) throw new Error("n8n webhook URL is not configured.");
  const body = new URLSearchParams({ action, ...payload });
  const response = await fetch(N8N_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Authentication did not succeed. Check the n8n execution.");
  }
  return data;
}

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: ""
  });
  const [state, setState] = useState({
    loading: false, message: "", error: false
  });

  const setField = key => e =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const switchMode = next => {
    setMode(next);
    setState({ loading: false, message: "", error: false });
  };

  async function submit(e) {
    e.preventDefault();
    setState({ loading: false, message: "", error: false });

    if (mode === "signup" && form.password !== form.confirmPassword) {
      setState({
        loading: false,
        message: "Passwords do not match.",
        error: true
      });
      return;
    }

    setState({ loading: true, message: "", error: false });

    try {
      const data = await callAuth(mode === "login" ? "signin" : "signup", {
        ...(mode === "signup" ? { name: form.name } : {}),
        email: form.email,
        password: form.password
      });

      if (data.token) {
        sessionStorage.setItem("fictionflix_auth_token", data.token);
      }
      if (data.user) {
        sessionStorage.setItem("fictionflix_user", JSON.stringify(data.user));
      }

      setState({
        loading: false,
        message: data.message ||
          (mode === "login" ? "Welcome back." : "Account created successfully."),
        error: false
      });
    } catch (error) {
      setState({
        loading: false,
        message: error.message || "Something went wrong.",
        error: true
      });
    }
  }

  return (
    <main className="page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="auth-shell">
        <div className="brand">
          <div className="brand-mark">FF</div>
          <span>FICTION FLIX</span>
        </div>

        <div className="auth-card">
          <div className="eyebrow">ONE STORY. MULTIPLE WAYS.</div>
          <h1>{mode === "login" ? "Welcome back." : "Create your account."}</h1>
          <p className="subtitle">
            {mode === "login"
              ? "Continue your stories across every experience."
              : "Start your Fiction Flix journey."}
          </p>

          <div className="tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={submit}>
            {mode === "signup" && (
              <label>
                Name
                <input
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={setField("email")}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={setField("password")}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength="6"
                required
              />
            </label>

            {mode === "signup" && (
              <label>
                Confirm password
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={setField("confirmPassword")}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
              </label>
            )}

            <button className="submit" disabled={state.loading}>
              {state.loading
                ? "Connecting…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {state.message && (
            <div className={state.error ? "notice error" : "notice success"}>
              {state.message}
            </div>
          )}

          <p className="footnote">
            Authentication requests are routed through your configured n8n webhook.
          </p>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);