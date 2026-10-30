import { model, models, Schema } from "mongoose";

const counterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
  }
);

export default models.Counter ?? model("Counter", counterSchema);