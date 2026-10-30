import { model, models, Schema } from "mongoose";

const bootstrapStateSchema = new Schema({ key: { type: String, required: true, unique: true }, completedAt: { type: Date, default: Date.now } });
export default models.BootstrapState ?? model("BootstrapState", bootstrapStateSchema);
