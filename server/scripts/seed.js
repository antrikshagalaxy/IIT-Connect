import 'dotenv/config';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Mentor from '../src/models/Mentor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const mentorsData = JSON.parse(
    readFileSync(join(__dirname, '../data/mentors.json'), 'utf-8')
  );

  let created = 0, updated = 0;
  for (const data of mentorsData) {
    const result = await Mentor.findOneAndUpdate(
      { name: data.name },
      data,
      { upsert: true, new: true, runValidators: true }
    );
    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

