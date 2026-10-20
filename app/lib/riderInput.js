export function validateRiderRegistration(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (name.length < 2 || name.length > 100) return { error: "Name must be between 2 and 100 characters." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (phone.length < 5 || phone.length > 32) return { error: "Phone must be between 5 and 32 characters." };
  // bcrypt only considers the first 72 UTF-8 bytes. Reject longer input rather than silently truncating.
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (password.length < 8 || passwordBytes > 72) return { error: "Password must be at least 8 characters and no more than 72 UTF-8 bytes." };
  return { value: { name, email, phone, password } };
}

export function buildRiderAccountDocuments({ name, email, phone, passwordHash, userId }) {
  return {
    user: { name, email, phone, password: passwordHash, role: "customer" },
    rider: { userId, name, phone, status: "pending", appliedAt: new Date() },
  };
}

export function buildExistingAccountRiderApplication({ userId, name, phone }) {
  return { userId, name, phone, status: "pending", appliedAt: new Date() };
}
