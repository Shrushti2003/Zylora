import { connectDatabase } from "../database/mongoose.js";
import { UserModel } from "../models/user.model.js";
import { conversationsChanged, normalizeConversations } from "../utils/conversationRepair.js";

async function repairUserConversations() {
  await connectDatabase();

  const users = await UserModel.find({ conversations: { $exists: true, $ne: [] } });
  let repaired = 0;
  let inspected = 0;

  for (const user of users) {
    inspected += 1;
    const conversations = user.get("conversations");
    const normalizedConversations = normalizeConversations(conversations);

    if (!conversationsChanged(conversations, normalizedConversations)) {
      continue;
    }

    user.set("conversations", normalizedConversations);
    await user.save();
    repaired += 1;
  }

  console.info(`Inspected ${inspected} users. Repaired ${repaired} user conversation record(s).`);
}

repairUserConversations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to repair user conversations", error);
    process.exit(1);
  });
