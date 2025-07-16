// import { drizzle } from "drizzle-orm/libsql";

// export const db = drizzle(process.env.DB_FILE_NAME!);

import { drizzle } from "drizzle-orm/libsql";
import * as schema from './schema'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
