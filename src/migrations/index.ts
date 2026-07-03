import * as migration_20260702_231456_initial_staging_schema from './20260702_231456_initial_staging_schema';

export const migrations = [
  {
    up: migration_20260702_231456_initial_staging_schema.up,
    down: migration_20260702_231456_initial_staging_schema.down,
    name: '20260702_231456_initial_staging_schema'
  },
];
