import { hash } from "@node-rs/bcrypt";

export async function defaultScenario(db) {
  const passwordHash = await hash("abc123", 10);

  db.user.create({
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    passwordHash,
  });
  db.user.create({
    id: "2",
    name: "Jane Doe",
    email: "janedoe@gmail.com",
    role: "user",
    passwordHash,
  });
  db.user.create({
    id: "3",
    name: "John Doe",
    email: "johndoe@gmail.com",
    role: "user",
    passwordHash,
  });
}
