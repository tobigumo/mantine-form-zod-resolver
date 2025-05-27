import * as v from 'valibot';
import { act, renderHook } from '@testing-library/react';
import { useForm } from '@mantine/form';
import { ZodResolverOptions, standardSchemaResolver } from './zod-resolver';

describe('standardSchemaResolver with Valibot', () => {
  const schema = v.object({
    name: v.pipe(v.string(), v.minLength(2, 'Name should have at least 2 letters')),
    email: v.pipe(v.string(), v.email('Invalid email')),
    age: v.pipe(v.number(), v.minValue(18, 'You must be at least 18 to create an account')),
  });

  it('validates basic fields with given Valibot schema', () => {
    const hook = renderHook(() =>
      useForm({
        initialValues: {
          name: '',
          email: '',
          age: 16,
        },
        validate: standardSchemaResolver(schema),
      })
    );

    expect(hook.result.current.errors).toStrictEqual({});
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({
      name: 'Name should have at least 2 letters',
      email: 'Invalid email',
      age: 'You must be at least 18 to create an account',
    });

    act(() => hook.result.current.setValues({ name: 'John', email: 'john@email.com', age: 16 }));
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({
      age: 'You must be at least 18 to create an account',
    });
  });

  const nestedSchema = v.object({
    nested: v.object({
      field: v.pipe(v.string(), v.minLength(2, 'Field should have at least 2 letters')),
    }),
  });

  it('validates nested fields with given Valibot schema', () => {
    const hook = renderHook(() =>
      useForm({
        initialValues: {
          nested: {
            field: '',
          },
        },
        validate: standardSchemaResolver(nestedSchema),
      })
    );

    expect(hook.result.current.errors).toStrictEqual({});
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({
      'nested.field': 'Field should have at least 2 letters',
    });

    act(() => hook.result.current.setValues({ nested: { field: 'Valid value' } }));
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({});
  });

  const listSchema = v.object({
    list: v.array(
      v.object({
        name: v.pipe(v.string(), v.minLength(2, 'Name should have at least 2 letters')),
      })
    ),
  });

  it('validates list fields with given Valibot schema', () => {
    const hook = renderHook(() =>
      useForm({
        initialValues: {
          list: [{ name: '' }],
        },
        validate: standardSchemaResolver(listSchema),
      })
    );

    expect(hook.result.current.errors).toStrictEqual({});
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({
      'list.0.name': 'Name should have at least 2 letters',
    });

    act(() => hook.result.current.setValues({ list: [{ name: 'John' }] }));
    act(() => hook.result.current.validate());

    expect(hook.result.current.errors).toStrictEqual({});
  });

  const mandatoryHashMessage = 'There must be a # in the hashtag';
  const notEmptyMessage = 'Hashtag should not be empty';

  const multipleValidationsSchema = v.object({
    hashtag: v.pipe(
      v.string(),
      v.check((value) => value.length > 0, notEmptyMessage),
      v.check((value) => value.includes('#'), mandatoryHashMessage)
    ),
  });

  it.each([
    [
      {
        errorPriority: 'first',
      },
      notEmptyMessage,
    ],
    [
      {
        errorPriority: 'last',
      },
      mandatoryHashMessage,
    ],
    [undefined, mandatoryHashMessage],
  ])(
    'provides the proper error for a schema with multiple validations with resolver option %p',
    (options, expectedErrorMessage) => {
      const hook = renderHook(() =>
        useForm({
          initialValues: {
            hashtag: '',
          },
          validate: standardSchemaResolver(
            multipleValidationsSchema,
            options as ZodResolverOptions
          ),
        })
      );

      expect(hook.result.current.errors).toStrictEqual({});
      act(() => hook.result.current.validate());

      expect(hook.result.current.errors).toStrictEqual({
        hashtag: expectedErrorMessage,
      });
    }
  );
});
