import { Schema, model, models } from 'mongoose';
import './User';

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
    },
    companyAccount: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // savedCourses: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Course',
    //   },
    // ],
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Company = models.Company || model('Company', CompanySchema);

export default Company;
