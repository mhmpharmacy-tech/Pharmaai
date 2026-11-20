export type ScanMode = 'auto' | 'prescription' | 'box';

export type SourceType = 'prescription' | 'box' | 'manual';

export type InteractionSeverity = 'major' | 'moderate' | 'minor';

export type SeverityFilter = 'all' | InteractionSeverity;

export type WorkspaceTab = 'scanner' | 'formulary' | 'monograph' | 'interactions' | 'history';

export interface MedicationDosing {
  adultDose: string;
  pediatricDose: string;
  maxDailyDose: string;
  renalHepaticAdjustment: string;
  prescribedRegimen?: string;
}

export interface MedicationSafety {
  criticalWarnings: string[];
  pregnancyLactation: string;
  commonSideEffects: string[];
  monitoring: string[];
  highAlert?: boolean;
}

export interface MedicationUsageVariations {
  withFood: string;
  timing: string;
  dosageFormsAndVariations: string[];
  patientCounseling: string[];
  missedDose: string;
}

export interface MedicationItem {
  id: string;
  persianName: string;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  therapeuticClass: string;
  sourceType: SourceType;
  customDosingSchedule?: string;
  dosing: MedicationDosing;
  safety: MedicationSafety;
  usage: MedicationUsageVariations;
}

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  mechanism: string;
  clinicalEffect: string;
  management: string;
  source?: 'ai' | 'clinical-rule';
}

export interface PrescriptionRiskSummary {
  totalMedications: number;
  majorCount: number;
  moderateCount: number;
  minorCount: number;
  highAlertCount: number;
  overallLevel: 'critical' | 'caution' | 'unverified' | 'empty';
}

export interface ScanSession {
  id: string;
  title: string;
  timestamp: string;
  sourceType: SourceType;
  previewImageUrl?: string;
  medications: MedicationItem[];
  interactions: DrugInteraction[];
  clinicalSummary?: string;
}

export interface AnalyzeResponsePayload {
  detectedSourceType: 'prescription' | 'box' | 'manual';
  clinicalSummary: string;
  medications: MedicationItem[];
  interactions: DrugInteraction[];
}
