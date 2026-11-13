import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true }, // 0=Sunday
  slots: [{ type: String, match: /^\d{2}:\d{2}$/ }]
}, { _id: false });

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  iit: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  exams: [{ type: String }],
  subjects: [{ type: String }],
  languages: [{ type: String }],
  bio: { type: String, required: true },
  pricePerSession: { type: Number, required: true },
  photoUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  availability: [availabilitySchema],
  sessionDurationMins: { type: Number, default: 45 }
}, { timestamps: true });

mentorSchema.index({ isActive: 1, exams: 1 });

export default mongoose.model('Mentor', mentorSchema);

