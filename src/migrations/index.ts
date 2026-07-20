import * as migration_20260720_195657_initial from './20260720_195657_initial';

export const migrations = [
  {
    up: migration_20260720_195657_initial.up,
    down: migration_20260720_195657_initial.down,
    name: '20260720_195657_initial'
  },
];
