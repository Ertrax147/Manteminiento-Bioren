// MantenimientoBioren/src/types.ts

import React from 'react';

export enum UserRole {
  UNIT_MANAGER = 'Jefe de Unidad',
  BIOREN_ADMIN = 'Administrador BIOREN',
  READ_ONLY = 'Usuario de Solo Lectura',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit?: string; // For Unit Managers
}

export enum EquipmentCriticality {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
}

export enum MaintenanceFrequencyUnit {
  DAYS = 'Días',
  WEEKS = 'Semanas',
  MONTHS = 'Meses',
  YEARS = 'Años',
}

export interface CustomMaintenanceFrequency {
  value: number;
  unit: MaintenanceFrequencyUnit;
}

export interface MaintenanceRecord {
  id: string;
  date: string; // ISO string
  description: string;
  performedBy: string;
  attachments: { name: string; url: string }[];
}

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  model: string;
  locationBuilding: string;
  locationUnit: string;
  lastCalibrationDate?: string;
  lastMaintenanceDate?: string;
  encargado?: string;
  maintenanceFrequency: CustomMaintenanceFrequency;
  maintenanceRecords: MaintenanceRecord[];
  customMaintenanceInstructions?: string;
  criticality: EquipmentCriticality;
  status?: 'OK' | 'Advertencia' | 'Vencido';
  nextMaintenanceDate?: string;
}

export enum IssueSeverity {
  MINOR = 'Menor',
  MODERATE = 'Moderada',
  CRITICAL = 'Crítica',
}

export interface IssueReport {
  id: string;
  equipmentId: string;
  equipmentName: string;
  reportedBy: string;
  dateTime: string;
  description: string;
  severity: IssueSeverity;
  attachments: { name:string; url: string }[];
  status: 'Abierto' | 'En Progreso' | 'Resuelto';
}

export interface AppNotification {
  id: string;
  message: string;
  created_at: string;
  is_read?: boolean;
  equipmentId?: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance_due' | 'maintenance_overdue' | 'new_issue'; 
  details?: string;
  link?: string;
  timestamp?: string; 
}

// La interfaz NavItem SÍ se queda aquí, en el frontend
export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}