import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },
});
