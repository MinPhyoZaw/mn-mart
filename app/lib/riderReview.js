export function reviewTransition(status, action) {
  if (status === "pending" && ["approve", "reject"].includes(action)) {
    return { status: action === "approve" ? "approved" : "rejected" };
  }
  if (status === "approved" && action === "suspend") return { status: "suspended" };
  return null;
}
