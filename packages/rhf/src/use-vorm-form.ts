import { useForm, type UseFormProps, type UseFormReturn, type FieldValues } from 'react-hook-form';
import type { FormSchema, FieldSchema, FormInputValues, FormOutputValues } from '@vorm/core';
import { createVormResolver } from './resolver.js';

type AnyFields = Record<string, FieldSchema<any, any, boolean, any>>;

type UseVormProps<TFields extends AnyFields> = Omit<
  UseFormProps<FormInputValues<TFields> & FieldValues>,
  'resolver'
>;

/**
 * RHF の useForm に resolver とジェネリクスを設定するだけの薄いラッパー。
 *
 * - register, watch, formState 等は RHF そのまま
 * - handleSubmit のコールバックで FormOutputValues（Branded Type）を受け取れる
 * - パフォーマンス特性は RHF と同一（uncontrolled / ref ベース）
 */
export function useVorm<TFields extends AnyFields>(
  schema: FormSchema<TFields>,
  props?: UseVormProps<TFields>,
): UseFormReturn<
  FormInputValues<TFields> & FieldValues,
  any,
  FormOutputValues<TFields> & FieldValues
> {
  return useForm({
    ...props,
    resolver: createVormResolver(schema),
  });
}
