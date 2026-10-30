import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import Batch from "./models/Batch.model";
import BootstrapState from "./models/BootstrapState.model";
import Student from "./models/Student.model";

const port = Number(process.env.PORT ?? 4000);

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(uri);
  await Student.updateMany({ studentId: { $exists: false } }, [{ $set: { studentId: { $concat: ["STU", { $toUpper: { $toString: "$_id" } }] } } }]);
  if (!(await BootstrapState.exists({ key: "default-batches-v1" }))) {
    await Batch.updateOne({ nameKey: "batch-a" }, { $setOnInsert: { name: "Batch-A", nameKey: "batch-a", startTime: "13:00", endTime: "14:00", active: true } }, { upsert: true });
    await Batch.updateOne({ nameKey: "batch-b" }, { $setOnInsert: { name: "Batch-B", nameKey: "batch-b", startTime: "06:00", endTime: "07:00", active: true } }, { upsert: true });
    try { await BootstrapState.create({ key: "default-batches-v1" }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  }
  app.listen(port, () => console.log(`Udaan API listening on port ${port}`));
}

start().catch((error: unknown) => {
  console.error("Could not start Udaan API:", error);
  process.exit(1);
});
