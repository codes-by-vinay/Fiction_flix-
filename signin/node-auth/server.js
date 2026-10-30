import app from './src/app.js';
import {config} from './src/config.js';
import {connectDatabase} from './src/database.js';

try {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`Login app ready at http://localhost:${config.port}`);
  });
} catch (error) {
  console.error(`Could not start the login app: ${error.message}`);
  process.exitCode = 1;
}