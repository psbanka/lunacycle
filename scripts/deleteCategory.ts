// /Users/pbanka/hobby/lunacycle/scripts/deleteCategory.ts
import prompts from 'prompts';
import { db } from '../server/db'; // Adjust path as necessary
import * as schema from '../server/schema';
import { eq } from 'drizzle-orm';

async function run() {
  console.log("✨ Welcome to the Lunacycle Category Migration Tool! ✨");
  console.log("This tool will help you move tasks from one category to another, then delete the old category.");

  // 1. Fetch all categories
  const categories = await db.query.category.findMany();

  if (categories.length < 2) {
    console.log("\n⚠️ You need at least two categories to perform a migration.");
    console.log("Please create more categories in the application first. Exiting.");
    process.exit(0);
  }

  // 2. Select Category A (to be deleted)
  const categoryASelection = await prompts({
    type: 'select',
    name: 'categoryAId',
    message: 'Select the category to DELETE (Category A):',
    choices: categories.map(cat => ({
      title: `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}`,
      value: cat.id,
      description: cat.description || 'No description provided.'
    })),
    initial: 0
  });

  const categoryA = categories.find(cat => cat.id === categoryASelection.categoryAId);
  if (!categoryA) {
    console.log("\nCategory A not found or selection cancelled. Exiting.");
    process.exit(1);
  }

  // 3. Select Category B (destination for tasks)
  const remainingCategories = categories.filter(cat => cat.id !== categoryA.id);

  if (remainingCategories.length === 0) {
    console.log("\n⚠️ No other categories available to move tasks to. Exiting.");
    process.exit(0);
  }

  const categoryBSelection = await prompts({
    type: 'select',
    name: 'categoryBId',
    message: `Select the destination category for tasks from "${categoryA.name}" (Category B):`,
    choices: remainingCategories.map(cat => ({
      title: `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}`,
      value: cat.id,
      description: cat.description || 'No description provided.'
    })),
    initial: 0
  });

  const categoryB = categories.find(cat => cat.id === categoryBSelection.categoryBId);
  if (!categoryB) {
    console.log("\nCategory B not found or selection cancelled. Exiting.");
    process.exit(1);
  }

  console.log(`\n--- Migration Summary ---`);
  console.log(`Category to DELETE (A): "${categoryA.name}" (ID: ${categoryA.id})`);
  console.log(`Destination Category (B): "${categoryB.name}" (ID: ${categoryB.id})`);
  console.log(`\nAll tasks and template tasks currently assigned to "${categoryA.name}"`);
  console.log(`will be reassigned to "${categoryB.name}".`);
  console.log(`After reassignment, "${categoryA.name}" will be permanently deleted.`);

  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Are you absolutely sure you want to proceed with this migration?',
    initial: false
  });

  if (!confirm.value) {
    console.log("\nMigration cancelled. No changes were made.");
    process.exit(0);
  }

  try {
    // 4. Move tasks from Category A to Category B
    console.log(`\n🔄 Moving tasks from "${categoryA.name}" to "${categoryB.name}"...`);
    await db.update(schema.task)
      .set({ categoryId: categoryB.id })
      .where(eq(schema.task.categoryId, categoryA.id))
      .run();

    // 5. Move templateTasks from Category A to Category B
    console.log(`🔄 Moving template tasks from "${categoryA.name}" to "${categoryB.name}"...`);
    const updatedTemplateTasksResult = await db.update(schema.templateTask)
      .set({ categoryId: categoryB.id })
      .where(eq(schema.templateTask.categoryId, categoryA.id))
      .run();

    // 6. Delete Category A
    console.log(`\n🗑️ Deleting category "${categoryA.name}"...`);
    await db.delete(schema.category)
      .where(eq(schema.category.id, categoryA.id))
      .run();
    console.log(`   - Category "${categoryA.name}" deleted successfully.`);

    console.log("\n✅ Migration completed successfully!");
    console.log("You can now verify the changes in your application.");
  } catch (error) {
    console.error("\n❌ An unexpected error occurred during migration:");
    console.error(error);
    console.error("\nPlease check the database state and logs for more details.");
    process.exit(1);
  }
}

// Execute the script
run().catch(console.error);
