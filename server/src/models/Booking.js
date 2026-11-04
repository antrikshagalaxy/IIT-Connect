import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  exam: { type: String, required: true },
  classOrYear: { type: String, required: true },
  institute: { type: String, default: '' },
  city: { type: String, required: true },
  topic: { type: String, required: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, required: true, unique: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
  student: { type: studentSchema, required: true },
  date: { type: String, required: true },        // "YYYY-MM-DD"
  timeSlot: { type: String, required: true },    // "HH:mm"
  dateUTC: { type: Date },                        // computed UTC for sorting
  status: {
    type: String,
    enum: ['pending_payment', 'confirmed', 'cancelled', 'completed'],
    default: 'pending_payment'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  amount: { type: Number, required: true },
  meetingLink: { type: String, default: '' }
}, { timestamps: true });

// Partial unique index: only one booking per mentor+date+slot among non-cancelled bookings
bookingSchema.index(
  { mentorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending_payment', 'confirmed', 'completed'] } }
  }
);

export default mongoose.model('Booking', bookingSchema);

