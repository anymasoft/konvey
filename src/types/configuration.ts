/**
 * TypeScript types for 1C configuration metadata.
 * Mirrors konvey_backend/models/configuration.py.
 */

export type ObjectType =
  | "Catalog"
  | "Document"
  | "InformationRegister"
  | "AccumulationRegister"
  | "AccountingRegister"
  | "CalculationRegister"
  | "Enum"
  | "ChartOfAccounts"
  | "ChartOfCharacteristicTypes"
  | "ChartOfCalculationTypes"
  | "BusinessProcess"
  | "Task"
  | "ExchangePlan"
  | "CommonModule"
  | "Other";

export interface Attribute {
  name: string;
  synonym: string | null;
  type: string;
  length: number | null;
}

export interface TabularSection {
  name: string;
  synonym: string | null;
  attributes: Attribute[];
}

export interface MetadataObject {
  name: string;
  full_name: string;
  synonym: string | null;
  object_type: ObjectType;
  attributes: Attribute[];
  tabular_sections: TabularSection[];
  enum_values: string[] | null;
  dimensions: Attribute[];
  resources: Attribute[];
}

export interface Configuration {
  name: string;
  synonym: string | null;
  version: string | null;
  vendor: string | null;
  objects: Record<string, MetadataObject>;
}

export interface ConfigParseResult {
  configuration: Configuration;
  summary: Record<string, number>;
}
