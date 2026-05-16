/**
 * TypeScript types for project model. Mirrors konvey_backend/models/project.py.
 */

import type { EnterpriseDataSchema } from "./enterprise-data";
import type { Configuration } from "./configuration";

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  source_config_name: string | null;
  target_config_name: string | null;
  ed_version: string | null;
  created_at: string; // ISO8601
  updated_at: string;
  mapped_count: number;
  total_pcr_count: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  enterprise_data: EnterpriseDataSchema;
  source_configuration: Configuration;
  target_configuration: Configuration;
  selected_objects: string[];
  created_at: string;
  updated_at: string;
}

export interface NewProjectData {
  name: string;
  description: string | null;
  ed_xsd_path: string;
  source_config_path: string;
  target_config_path: string;
  selected_objects: string[];
}
