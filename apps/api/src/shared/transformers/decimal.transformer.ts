import { ValueTransformer } from 'typeorm';

/**
 * pg returns `decimal`/`numeric` columns as strings to avoid float precision
 * loss. Entities type them as `number`, so without this transformer every
 * consumer gets a string at runtime despite the TS type.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : parseFloat(value)),
};
