export function defaultScenario(db) {
  db.user.create({ id: "1", name: "Admin User", email: "admin@example.com", role: "admin" });
  db.user.create({ id: "2", name: "Regular User", email: "user@example.com", role: "user" });
  db.user.create({
      id: "3",
      name: "Family Member",
      email: "user2@example.com",
      role: "user",
    },
  );
}
