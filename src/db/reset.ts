import { sql } from 'drizzle-orm'
import { db } from '@/db'

if (!('DB_FILE_NAME' in process.env))
  throw new Error('DB_FILE_NAME not found on .env.development')

async function reset() {
  console.log('⏳ Resetting database...')
  const start = Date.now()

  const query = sql`
		-- Delete all tables
		DO $$ DECLARE
		    r RECORD;
		BEGIN
		    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
		        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
		    END LOOP;
		END $$;
		
		-- Delete enums
		DO $$ DECLARE
			r RECORD;
		BEGIN
			FOR r IN (select t.typname as enum_name
			from pg_type t 
				join pg_enum e on t.oid = e.enumtypid  
				join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
			where n.nspname = current_schema()) LOOP
				EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.enum_name);
			END LOOP;
		END $$;		
		`

  // await db.execute(query)
	await db.run(query);

  const end = Date.now()
  console.log(`✅ Reset end & took ${end - start}ms`)
  process.exit(0)
}

reset().catch((err) => {
  console.error('❌ Reset failed')
  console.error(err)
  process.exit(1)
})
