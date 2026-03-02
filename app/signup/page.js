"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setSuccess("Account created! Redirecting...");
      setTimeout(() => router.push("/login"), 1400);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.left}>
          <video
            className={styles.video}
            autoPlay
            muted
            loop
            playsInline
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          />
          <div className={styles.overlay}>
            <div>
              <div className={styles.title}>Welcome to Grocery Go</div>
              <div className={styles.subtitle}>Create your seller account and start adding products.</div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.heading}>Create your account</div>
            <div className={styles.sub}>Sign up and start adding shops & products</div>

            <input
              className={styles.input}
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading ? "Signing up..." : "Create account"}
            </button>

            {error && <div className={styles.msgError}>{error}</div>}
            {success && <div className={styles.msgSuccess}>{success}</div>}

            <div className={styles.muted} style={{ marginTop: 14 }}>
              Already have an account? <a href="/login">Log in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
