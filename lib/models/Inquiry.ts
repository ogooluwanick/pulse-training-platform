import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companySize: string;
  sector: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'qualified' | 'converted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companySize: {
      type: String,
      required: [true, 'Company size is required'],
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    sector: {
      type: String,
      required: [true, 'Sector is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'qualified', 'converted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for email to ensure uniqueness
InquirySchema.index({ email: 1 });

// Create index for status for filtering
InquirySchema.index({ status: 1 });

// Create index for createdAt for sorting
InquirySchema.index({ createdAt: -1 });

export default mongoose.models.Inquiry ||
  mongoose.model<IInquiry>('Inquiry', InquirySchema);
