import { model, models, Schema } from "mongoose";

const batchSchema = new Schema({
  name: { type: String, required: true, trim: true },
  nameKey: { type: String, required: true, unique: true },
  startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default models.Batch ?? model("Batch", batchSchema);
