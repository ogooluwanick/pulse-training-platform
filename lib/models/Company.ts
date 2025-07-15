import { Schema, model, models } from "mongoose"

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
)

const Company = models.Company || model("Company", CompanySchema)

export default Company
