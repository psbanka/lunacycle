import { db } from "../server/db";
import * as schema from "../server/schema";
import { eq } from "drizzle-orm";

async function migrateAvatars() {
  console.log("-".repeat(50));
  console.log("🖼️  Starting avatar data migration...");

  // 1. Fetch all users with their avatars (from the old schema structure)
  // We need to cast `db.select()` to include the old 'avatar' field.
  const usersWithAvatars = await db
    .select()
    .from(schema.user)
    .all() as (schema.User & { avatar: string | null })[];

  if (usersWithAvatars.length === 0) {
    console.log("✅ No users found, nothing to migrate.");
    return;
  }

  console.log(`Found ${usersWithAvatars.length} users to process.`);

  let migratedCount = 0;
  for (const user of usersWithAvatars) {
    if (user.avatar) {
      // 2. Insert a corresponding record into the new `user_profile` table
      await db
        .insert(schema.userProfile)
        .values({
          userId: user.id,
          avatar: user.avatar,
        })
        // In case the script is run more than once, this will prevent crashes.
        .onConflictDoNothing()
        .run();
      
      migratedCount++;
      console.log(`  -> Migrated avatar for ${user.name} (${user.id})`);
    } else {
      console.log(`  -> Skipping user ${user.name} (${user.id}), no avatar found.`);
    }
  }

  console.log(`\n🎉 Successfully migrated ${migratedCount} avatars!`);
  console.log("-".repeat(50));
  process.exit(0);
}

migrateAvatars().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
