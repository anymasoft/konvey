/**
 * Typed wrapper around Tauri commands → Python sidecar JSON-RPC.
 *
 * All methods are async, return parsed JSON or throw an Error.
 * Used by stores and components — never call Tauri invoke directly elsewhere.
 */

import { invoke } from "@tauri-apps/api/core";
import type { XsdParseResult } from "@/types/enterprise-data";
import type { ConfigParseResult } from "@/types/configuration";
import type { NewProjectData, Project, ProjectSummary } from "@/types/project";

async function callBackend<T>(method: string, params: object = {}): Promise<T> {
  return invoke<T>("call_backend", { method, params });
}

export const backend = {
  ping: () => callBackend<{ ok: boolean; version: string }>("ping"),

  parseXsd: (path: string) => callBackend<XsdParseResult>("parse_xsd", { path }),

  parseConfiguration: (path: string) =>
    callBackend<ConfigParseResult>("parse_configuration", { path }),

  listProjects: () => callBackend<ProjectSummary[]>("list_projects"),

  loadProject: (id: string) => callBackend<Project>("load_project", { id }),

  saveProject: (project: Project) =>
    callBackend<{ ok: boolean; id: string }>("save_project", { project }),

  createProject: (data: NewProjectData) =>
    callBackend<Project>("create_project", { data }),

  deleteProject: (id: string) =>
    callBackend<{ ok: boolean }>("delete_project", { id }),
};
