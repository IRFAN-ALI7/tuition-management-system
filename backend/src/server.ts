
import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";
import { startFeeScheduler } from "./services/feeScheduler.service";

const port = Number(process.env.PORT ?? 4000);

async function start() {
  await connectDB();

  await startFeeScheduler();

  app.listen(port, () => {
    console.log(`Udaan API listening on port ${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Could not start Udaan API:", error);
  process.exit(1);
});
