import * as migration_20260720_195657_initial from './20260720_195657_initial';
import * as migration_20260721_133000_markdown_to_lexical from './20260721_133000_markdown_to_lexical';

export const migrations = [
  {
    up: migration_20260720_195657_initial.up,
    down: migration_20260720_195657_initial.down,
    name: '20260720_195657_initial'
  },
  {
    up: migration_20260721_133000_markdown_to_lexical.up,
    down: migration_20260721_133000_markdown_to_lexical.down,
    name: '20260721_133000_markdown_to_lexical'
  },
];
