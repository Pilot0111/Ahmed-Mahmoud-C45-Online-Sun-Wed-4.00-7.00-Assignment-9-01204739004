import cron from "node-cron";
import userModel from "../../../DB/models/user.model.js";

export const deleteUnconfirmedUsersCron = () => {
  // Runs every hour at the 0th minute (e.g., 1:00, 2:00, 3:00)
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running cron job: Sweeping expired unconfirmed users...");
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await userModel.deleteMany({
        confirmed: { $ne: true },
        createdAt: { $lt: twentyFourHoursAgo },
      });
      
      console.log(`Cron Job Success: Deleted ${result.deletedCount} unconfirmed users.`);
    } catch (error) {
      console.error("Cron Job Error: Failed to delete unconfirmed users", error);
    }
  });
};