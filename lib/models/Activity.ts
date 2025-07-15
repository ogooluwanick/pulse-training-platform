import { Schema, model, models } from "mongoose"

const ActivitySchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["enrollment", "completion", "deadline"],
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  { timestamps: true }
)

const Activity = models.Activity || model("Activity", ActivitySchema)

export default Activity
