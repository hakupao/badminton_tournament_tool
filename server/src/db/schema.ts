
import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const tournamentConfigs = pgTable('tournament_configs', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull().unique(),
    team_count: integer('team_count').notNull(),
    team_capacity: integer('team_capacity').notNull(),
    formations: text('formations').array().notNull(),
    court_count: integer('court_count').notNull(),
    match_duration: integer('match_duration').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const timeSlots = pgTable('time_slots', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    slot_index: integer('slot_index').notNull(),
    label: text('label').notNull(),
    starts_at: timestamp('starts_at', { withTimezone: true }),
    ends_at: timestamp('ends_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const players = pgTable('players', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    code: text('code').notNull(),
    name: text('name'),
    team_code: text('team_code').notNull(),
    player_number: integer('player_number').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const formations = pgTable('formations', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    team_code: text('team_code').notNull(),
    match_type: text('match_type').notNull(),
    players: text('players').array().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const matches = pgTable('matches', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    match_number: text('match_number'),
    round: integer('round').notNull(),
    time_slot_index: integer('time_slot_index').notNull(),
    court: integer('court').notNull(),
    match_type: text('match_type').notNull(),
    team_a_id: text('team_a_id').notNull(),
    team_b_id: text('team_b_id').notNull(),
    team_a_name: text('team_a_name'),
    team_b_name: text('team_b_name'),
    team_a_players: text('team_a_players').array().notNull(),
    team_b_players: text('team_b_players').array().notNull(),
    team_a_player_names: text('team_a_player_names').array(),
    team_b_player_names: text('team_b_player_names').array(),
    status: text('status').notNull().default('pending'),
    scores: jsonb('scores').notNull().default([]),
    winner_team_id: text('winner_team_id'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const schedules = pgTable('schedules', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    time_slot_index: integer('time_slot_index').notNull(),
    court: integer('court').notNull(),
    team_a: text('team_a').notNull(),
    team_b: text('team_b').notNull(),
    formation: text('formation').notNull(),
    team_a_players: text('team_a_players').array().notNull(),
    team_b_players: text('team_b_players').array().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const defaultImportState = pgTable('default_import_state', {
    user_id: uuid('user_id').primaryKey(),
    seed_version: text('seed_version'),
    imported_at: timestamp('imported_at', { withTimezone: true }).defaultNow().notNull(),
    last_error: text('last_error'),
});
