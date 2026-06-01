/**
 * Drizzle Postgres schema for the reactive-queries demo.
 *
 * The reactive engine in `@realtimejs/reactive-drizzle` parses the SQL that
 * Drizzle emits with `pgsql-ast-parser` and uses `$N` positional params — i.e.
 * it speaks the **Postgres dialect**. So this MUST be a `pg-core` schema (a
 * SQLite schema would emit `?` placeholders the engine cannot parse). We run it
 * on embedded `pglite`, so there is no external database to install.
 */
import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull(),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  votes: integer('votes').notNull().default(0),
})

export type Todo = typeof todos.$inferSelect
