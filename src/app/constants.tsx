import React from "react";

import { WorkflowCategory, JsonLdNodeTerm } from "./types";

export const INSERT_LINK_DIALOG_ID = "insertLinkDialog";

export const TRASH_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

export type Override<T, K extends keyof T, R> = Omit<T, K> & { [P in K]: R };

import { CSSProperties } from "react";

export const styles: { [key: string]: CSSProperties } = {
  app: {
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    maxWidth: 720,
    margin: "36px auto",
    padding: 20,
    color: "#111",
  },
  header: { marginBottom: 16 },
  fieldsHeader: {
    position: "sticky",
    top: "0px", // Or the height of your Header
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(5px)", // Modern "Glassmorphism" feel
    borderBottom: "1px solid #eaeaea",
    padding: "10px 0",
    marginBottom: "20px",
  },
  subtitle: { marginTop: 6, color: "#666" },
  main: {
    background: "#fff",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  form: { display: "flex", flexDirection: "column", marginBottom: 12 },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 16,
  },
  button: {
    padding: "10px 14px",
    borderRadius: 6,
    border: "none",
    background: "#0366d6",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
  },
  list: { listStyle: "none", padding: 0, margin: 0 },
  empty: { color: "#666", padding: 12 },
  item: { padding: 12, borderBottom: "1px solid #f0f0f0" },
  itemText: {},
  itemMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    color: "#666",
  },
  delete: {
    background: "transparent",
    border: "none",
    color: "#d0342c",
    cursor: "pointer",
    fontSize: 16,
  },
  footer: { marginTop: 12, textAlign: "center", color: "#888" },
};

export const others = {
  noteCreator: {
    rows: 10,
    cols: 67,
  },
};

export const emojis = [
  { value: "🫀", label: "love" },
  { value: "🧠", label: "thoughtful" },
  { value: "😵‍💫", label: "overwhelmed" },
  { value: "🔋", label: "energized" },
  { value: "🔥", label: "excited" },
  { value: "⚙️", label: "focused" },
  { value: "🛡️", label: "protected" },
];

export const WORKFLOW_JSONLD_SCHEMA = {
  "@version": 1.1,
  id: "@id",
  type: "@type",
  graph: "@graph",

  // Core vocabularies
  dcterms: "http://purl.org/dc/terms/",
  prov: "http://www.w3.org/ns/prov#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  inspect: "https://inspect.local/ns/core#",
  jaw: "https://inspect.local/ns/jaw#", // Joint Activity Workflows & PyWhy SCMs
  cwa: "https://inspect.local/ns/cwa#", // Cognitive Work Analysis & Bio-Digital Compass
  gtm: "https://inspect.local/ns/gtm#", // Go-To-Market & Lean Loops

  // Dublin Core document metadata
  title: "dcterms:title",
  description: "dcterms:description",
  category: "dcterms:subject",
  creator: "dcterms:creator",
  created: { "@id": "dcterms:created", "@type": "xsd:dateTime" },
  modified: { "@id": "dcterms:modified", "@type": "xsd:dateTime" },

  // W3C PROV-O & causal topology
  WorkflowGraph: "prov:Bundle",
  CausalLink: "prov:Influence",
  source: { "@id": "prov:influencer", "@type": "@id" },
  target: { "@id": "prov:influenced", "@type": "@id" },
  derivedFrom: { "@id": "prov:wasDerivedFrom", "@type": "@id" },
  used: { "@id": "prov:used", "@type": "@id" },
  generatedBy: { "@id": "prov:wasGeneratedBy", "@type": "@id" },
  associatedWith: { "@id": "prov:wasAssociatedWith", "@type": "@id" },

  // 14 workflow_node_types -> JSON-LD @type
  HumanActor: "prov:Person",
  SystemDatabase: "prov:SoftwareAgent",
  GenerativeAILLM: "prov:SoftwareAgent",
  ValidationGate: "jaw:ValidationGate",
  ImpactReporting: "prov:Entity",
  RiskBottleneck: "jaw:RiskBottleneck",

  SomaticSubcorticalSensor: "cwa:SomaticSensor",
  SensemakingReframing: "cwa:DataFrameLoop",
  BoundaryObjectArtifact: "cwa:BoundaryObject",
  SovereignDemandFilter: "cwa:SovereignDemandFilter",

  TargetUserMarket: "gtm:TargetSegment",
  MarketingGTMChannel: "gtm:Channel",
  UXCXBenefit: "gtm:ValueProposition",
  TechnicalFeature: "gtm:Capability",

  // 20 workflow_node_metadata fieldnames
  Format: "dcterms:format",
  Medium: "dcterms:medium",
  Framework: "dcterms:conformsTo",
  Visibility: "dcterms:accessRights",

  Objective: "jaw:objective",
  Goal: "jaw:goal",
  ProcessingEngine: "jaw:processingEngine",
  TechStack: "jaw:techStack",

  AffectSpikes: "cwa:affectSpikes",
  Neurotype: "cwa:neurotype",
  NeurologicalLayer: "cwa:neurologicalLayer",
  TriggerVector: "cwa:triggerVector",

  CoreNeed: "gtm:coreNeed",
  IncludedServices: "gtm:includedServices",
  TargetSegment: "gtm:targetSegment",
  GTMStrategy: "gtm:gtmStrategy",
  FeatureScope: "gtm:featureScope",
  DistributionVector: "gtm:distributionVector",
  UXResearchGrounding: "gtm:uxResearchGrounding",
  UserBenefit: "gtm:userBenefit",

  // Causal / DBN / Ostrom IAD link properties (for PyWhy compilation)
  polarity: "jaw:polarity",
  causalMechanism: "jaw:causalMechanism",
  conditionalProbability: {
    "@id": "jaw:conditionalProbability",
    "@type": "xsd:decimal",
  },
  ostromRuleTier: "jaw:ostromRuleTier",
  ogatrLevel: "jaw:ogatrLevel",
  epistemicUncertainty: {
    "@id": "jaw:epistemicUncertainty",
    "@type": "xsd:decimal",
  },

  // Canvas layout properties
  canvasPosition: "inspect:canvasPosition",
  bgColor: "inspect:bgColor",
  icon: "inspect:icon",
} as const;

export const NODE_TYPE_REGISTRY: Record<
  number,
  {
    term: JsonLdNodeTerm;
    category: WorkflowCategory;
    icon: string;
    bgColor: string;
  }
> = {
  1: { term: "HumanActor", category: "system", icon: "👤", bgColor: "#e0f2fe" },
  2: {
    term: "SystemDatabase",
    category: "system",
    icon: "🗄️",
    bgColor: "#f1f5f9",
  },
  3: {
    term: "GenerativeAILLM",
    category: "system",
    icon: "🤖",
    bgColor: "#fef3c7",
  },
  4: {
    term: "ValidationGate",
    category: "system",
    icon: "🛡️",
    bgColor: "#dcfce7",
  },
  5: {
    term: "ImpactReporting",
    category: "system",
    icon: "📊",
    bgColor: "#f3e8ff",
  },
  6: {
    term: "RiskBottleneck",
    category: "system",
    icon: "⚠️",
    bgColor: "#fee2e2",
  },
  7: {
    term: "SomaticSubcorticalSensor",
    category: "cwa",
    icon: "⚡",
    bgColor: "#ffe4e6",
  },
  8: {
    term: "SensemakingReframing",
    category: "cwa",
    icon: "🧩",
    bgColor: "#e0e7ff",
  },
  9: {
    term: "BoundaryObjectArtifact",
    category: "cwa",
    icon: "📄",
    bgColor: "#f3e8ff",
  },
  10: {
    term: "SovereignDemandFilter",
    category: "cwa",
    icon: "🧱",
    bgColor: "#ffedd5",
  },
  11: {
    term: "TargetUserMarket",
    category: "gtm",
    icon: "🎯",
    bgColor: "#fce7f3",
  },
  12: {
    term: "MarketingGTMChannel",
    category: "gtm",
    icon: "📢",
    bgColor: "#fed7aa",
  },
  13: { term: "UXCXBenefit", category: "gtm", icon: "💡", bgColor: "#dbeafe" },
  14: {
    term: "TechnicalFeature",
    category: "gtm",
    icon: "⚙️",
    bgColor: "#f3f4f6",
  },
};
