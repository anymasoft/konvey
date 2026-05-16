/**
 * TypeScript types mirroring backend Pydantic models from
 * konvey_backend/models/enterprise_data.py.
 *
 * Kept in sync manually — when changing backend model, update here too.
 */

export type TypeCategory =
  | "document"
  | "catalog"
  | "register"
  | "enum"
  | "composite"
  | "tabular_section"
  | "chart_of_accounts"
  | "chart_of_characteristic_types"
  | "business_process"
  | "task"
  | "other";

export interface XsdSimpleType {
  name: string;
  base_type: string;
  restrictions: Record<string, unknown>;
}

export interface XsdField {
  name: string;
  type_ref: string;
  min_occurs: number;
  max_occurs: number | "unbounded";
  is_required: boolean;
}

export interface XsdComplexType {
  name: string;
  category: TypeCategory;
  parent_type: string | null;
  fields: XsdField[];
  annotation: string | null;
}

export interface EnterpriseDataSchema {
  version: string;
  namespace: string;
  simple_types: Record<string, XsdSimpleType>;
  complex_types: Record<string, XsdComplexType>;
}

export interface XsdParseResult {
  schema: EnterpriseDataSchema;
  summary: Record<string, number>;
}
