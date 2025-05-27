import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { FormErrors } from '@mantine/form';

export interface ZodResolverOptions {
  errorPriority?: 'first' | 'last';
}

// Standard SchemaResolver - Compatible with all Zod versions (v3, v4, v4-mini)
export function standardSchemaResolver(schema: StandardSchemaV1, options?: ZodResolverOptions) {
  return (values: Record<string, unknown>): FormErrors => {
    const result = schema['~standard'].validate(values);

    // Check if the result is a Promise
    if (result instanceof Promise) {
      throw new Error('Async validation is not supported. Use sync schemas only.');
    }

    if (result.issues) {
      // Validation failed
      const results: FormErrors = {};

      let issues = result.issues;
      if (options?.errorPriority === 'first') {
        issues = [...issues].reverse();
      }

      issues.forEach((issue) => {
        if (issue.path) {
          const pathString = issue.path
            .map((segment) =>
              typeof segment === 'object' && 'key' in segment ? segment.key : segment
            )
            .join('.');
          results[pathString] = issue.message;
        } else {
          // If there's no path, treat it as a root error
          results[''] = issue.message;
        }
      });

      return results;
    }

    // Validation succeeded
    return {};
  };
}

// Backward compatibility aliases
export const zodResolver = standardSchemaResolver;
export const zod4Resolver = standardSchemaResolver;
