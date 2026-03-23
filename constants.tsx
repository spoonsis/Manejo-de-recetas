
import React from 'react';
import { EstadoReceta, EstadoInsumo } from './types';


export const UNIDADES = ['kg', 'g', 'L', 'ml', 'unidad', 'cda', 'cdta', 'taza'];
export const UNIDADES_STOCK = ['kg', 'g', 'L', 'ml', 'unidad', 'paquete', 'caja', 'pacón', 'bandeja', 'saco'];
export const OPCIONES_IMPUESTO = ['IVA 13%', 'IVA 1%', 'Exento', 'IVA 2%', 'IVA 4%'];
export const TIPOS_MATERIAL = ['Materia Prima', 'Empaque', 'Lácteos', 'Proteínas', 'Secos', 'Químicos', 'MODI'];

// Definición de valores base para conversiones estándar
export const MAPA_CONVERSION_UNIDADES: Record<string, { familia: string, valor: number }> = {
  'kg': { familia: 'masa', valor: 1000 },
  'g': { familia: 'masa', valor: 1 },
  'L': { familia: 'volumen', valor: 1000 },
  'ml': { familia: 'volumen', valor: 1 },
  'unidad': { familia: 'conteo', valor: 1 },
  'cda': { familia: 'volumen', valor: 15 },
  'cdta': { familia: 'volumen', valor: 5 },
  'taza': { familia: 'volumen', valor: 250 },
};

export const ESTILOS_ESTADO: Record<string, string> = {
  BORRADOR: 'bg-business-beige text-business-olive border-business-olive/20',
  PENDIENTE_COSTOS: 'bg-business-mustard/20 text-business-orange border-business-mustard',
  PENDIENTE_MKT: 'bg-business-orange/10 text-business-orange border-business-orange/20',
  PENDIENTE_CALIDAD: 'bg-business-lavender/20 text-business-lavender border-business-lavender',
  APROBADO: 'bg-business-olive text-white border-business-olive',
  RECHAZADO_COSTOS: 'bg-red-50 text-red-600 border-red-100',
  RECHAZADO_MKT: 'bg-rose-50 text-rose-600 border-rose-100',
  RECHAZADO_CALIDAD: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const ETIQUETAS_ESTADO: Record<string, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_COSTOS: 'Pendiente Costos',
  PENDIENTE_MKT: 'Pendiente MK',
  PENDIENTE_CALIDAD: 'Pendiente Calidad',
  APROBADO: 'Aprobado',
  RECHAZADO_COSTOS: 'Rechazado Costos',
  RECHAZADO_MKT: 'Rechazado MK',
  RECHAZADO_CALIDAD: 'Rechazado Calidad',
};
export const ESTILOS_ESTADO_INSUMO: Record<EstadoInsumo, string> = {
  [EstadoInsumo.PENDIENTE_COMPRAS]: 'bg-slate-100 text-slate-500 border-slate-200',
  [EstadoInsumo.PENDIENTE_CALIDAD]: 'bg-purple-50 text-purple-600 border-purple-100',
  [EstadoInsumo.PENDIENTE_LOGISTICA]: 'bg-blue-50 text-blue-600 border-blue-100',
  [EstadoInsumo.COMPLETADO]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export const ETIQUETAS_ESTADO_INSUMO: Record<EstadoInsumo, string> = {
  [EstadoInsumo.PENDIENTE_COMPRAS]: 'Pendiente Compras',
  [EstadoInsumo.PENDIENTE_CALIDAD]: 'Pendiente Calidad',
  [EstadoInsumo.PENDIENTE_LOGISTICA]: 'Pendiente Logística',
  [EstadoInsumo.COMPLETADO]: 'Completado',
};