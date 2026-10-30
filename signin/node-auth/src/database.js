import mongoose from 'mongoose';
import {config} from './config.js';

export async function connectDatabase() {
  await mongoose.connect(config.mongoUri, {serverSelectionTimeoutMS: 5000});
  console.log('Connected to MongoDB.');
}