import * as migration_20260702_231456_initial_staging_schema from './20260702_231456_initial_staging_schema';
import * as migration_20260712_024242_ecommerce_delivery_20260711 from './20260712_024242_ecommerce_delivery_20260711';

export const migrations = [
  {
    up: migration_20260702_231456_initial_staging_schema.up,
    down: migration_20260702_231456_initial_staging_schema.down,
    name: '20260702_231456_initial_staging_schema',
  },
  {
    up: migration_20260712_024242_ecommerce_delivery_20260711.up,
    down: migration_20260712_024242_ecommerce_delivery_20260711.down,
    name: '20260712_024242_ecommerce_delivery_20260711'
  },
];
