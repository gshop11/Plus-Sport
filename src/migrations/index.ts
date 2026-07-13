import * as migration_20260702_231456_initial_staging_schema from './20260702_231456_initial_staging_schema';
import * as migration_20260712_030000_add_ecommerce_order_states from './20260712_030000_add_ecommerce_order_states';
import * as migration_20260712_030100_ecommerce_delivery_schema from './20260712_030100_ecommerce_delivery_schema';

export const migrations = [
  {
    up: migration_20260702_231456_initial_staging_schema.up,
    down: migration_20260702_231456_initial_staging_schema.down,
    name: '20260702_231456_initial_staging_schema',
  },
  {
    up: migration_20260712_030000_add_ecommerce_order_states.up,
    down: migration_20260712_030000_add_ecommerce_order_states.down,
    name: '20260712_030000_add_ecommerce_order_states',
  },
  {
    up: migration_20260712_030100_ecommerce_delivery_schema.up,
    down: migration_20260712_030100_ecommerce_delivery_schema.down,
    name: '20260712_030100_ecommerce_delivery_schema',
  },
];
