import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed (Optional: Standard Helvetica/Times are built-in)
// Font.register({ family: 'Helvetica-Bold', src: 'https://fonts.gstatic.com/s/helvetica/v1/...' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#334155', // slate-700
  },
  headerTable: {
    display: 'flex',
    flexDirection: 'row',
    border: '1px solid #94a3b8',
    marginBottom: 0,
  },
  logoSection: {
    width: '20%',
    padding: 10,
    borderRight: '1px solid #94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    width: '50%',
    padding: 5,
    borderRight: '1px solid #94a3b8',
    textAlign: 'center',
    justifyContent: 'center',
  },
  metaSection: {
    width: '30%',
    padding: 5,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  docType: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1e293b',
  },
  recipeName: {
    fontSize: 12,
    fontWeight: 'heavy',
    backgroundColor: '#334155',
    color: '#ffffff',
    padding: 4,
    marginTop: 5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e2e8f0',
    paddingVertical: 2,
  },
  metaLabel: {
    fontWeight: 'bold',
    fontSize: 7,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 7,
  },
  adminTable: {
    flexDirection: 'row',
    border: '1px solid #94a3b8',
    borderTop: 0,
    backgroundColor: '#f8fafc',
  },
  adminCol: {
    flex: 1,
    padding: 4,
    borderRight: '1px solid #94a3b8',
  },
  adminLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 2,
  },
  adminValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  table: {
    marginTop: 10,
    border: '1px solid #94a3b8',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#cbd5e1', // slate-300
    borderBottom: '1px solid #94a3b8',
    fontWeight: 'bold',
    textAlign: 'center',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    minHeight: 20,
    alignItems: 'center',
  },
  colCode: { width: '12%', borderRight: '1px solid #e2e8f0', padding: 2, textAlign: 'center', fontSize: 7 },
  colDesc: { width: '33%', borderRight: '1px solid #e2e8f0', padding: 4 },
  colBrand: { width: '12%', borderRight: '1px solid #e2e8f0', padding: 2, textAlign: 'center' },
  colQty: { width: '10%', borderRight: '1px solid #e2e8f0', padding: 2, textAlign: 'center', fontWeight: 'bold' },
  colUnit: { width: '8%', borderRight: '1px solid #e2e8f0', padding: 2, textAlign: 'center' },
  colObs: { width: '15%', borderRight: '1px solid #e2e8f0', padding: 2 },
  colCost: { width: '10%', padding: 2, textAlign: 'right' },
  
  categoryRow: {
    backgroundColor: '#f1f5f9',
    padding: 3,
    borderBottom: '1px solid #e2e8f0',
  },
  categoryText: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#7d833c', // brand olive
  },
  
  yieldSection: {
    marginTop: 10,
    border: '1px solid #94a3b8',
  },
  yieldRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
  },
  yieldLabel: {
    width: '40%',
    backgroundColor: '#f8fafc',
    padding: 4,
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderRight: '1px solid #e2e8f0',
  },
  yieldValue: {
    width: '30%',
    padding: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 9,
    borderRight: '1px solid #e2e8f0',
  },
  yieldUnit: {
    width: '30%',
    padding: 4,
    textAlign: 'center',
    fontSize: 8,
  },
  
  sectionHeader: {
    backgroundColor: '#334155',
    color: 'white',
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  stepsContent: {
    padding: 8,
    border: '1px solid #e2e8f0',
    borderTop: 0,
  },
  stepItem: {
    marginBottom: 4,
    fontSize: 8,
    flexDirection: 'row',
  },
  stepNumber: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1px solid #e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 6,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  logoImage: {
    width: 60,
    height: 'auto',
  }
});

interface Props {
  receta: any;
  logoUrl?: string;
}

const ExportarRecetaPDF = ({ receta, logoUrl = '/logo.png' }: Props) => {
  const ingredientesCategorizados = receta.ingredientesCategorizados || {
    materiasPrimas: receta.ingredientes.filter((i: any) => {
      const tipo = (i.tipoMaterial || '').toUpperCase();
      return i.tipo === 'SEMIELABORADO' || (!tipo.includes('EMPAQUE') && !tipo.includes('MODI'));
    }),
    empaque: receta.ingredientes.filter((i: any) => (i.tipoMaterial || '').toUpperCase().includes('EMPAQUE')),
    modi: receta.ingredientes.filter((i: any) => (i.tipoMaterial || '').toUpperCase().includes('MODI'))
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO TÉCNICO */}
        <View style={styles.headerTable}>
          <View style={styles.logoSection}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <Text style={{ fontSize: 18, color: '#ef8e19', fontWeight: 'bold' }}>Spoon</Text>
            )}
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.companyName}>SERVICIOS DE PASTELERIA S.A.</Text>
            <Text style={styles.docType}>Especificación de Receta</Text>
            <Text style={styles.recipeName}>{receta.nombre}</Text>
          </View>
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Código:</Text>
              <Text style={styles.metaValue}>{receta.id || 'S/G'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Revisión:</Text>
              <Text style={styles.metaValue}>{receta.version || '01'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha Aprob.:</Text>
              <Text style={styles.metaValue}>
                {receta.fechaRevision || 
                 (receta.versiones && receta.versiones.length > 0 
                   ? new Date(receta.versiones[receta.versiones.length - 1].fechaAprobacion).toLocaleDateString('es-CR') 
                   : 'Pendiente')}
              </Text>
            </View>
          </View>
        </View>

        {/* INFO ADMINISTRATIVA */}
        <View style={styles.adminTable}>
          <View style={styles.adminCol}>
            <Text style={styles.adminLabel}>Elaborado</Text>
            <Text style={styles.adminValue}>{receta.elaboradoPor || '-'}</Text>
          </View>
          <View style={styles.adminCol}>
            <Text style={styles.adminLabel}>Aprobado</Text>
            <Text style={styles.adminValue}>{receta.aprobadoPor || '-'}</Text>
          </View>
          <View style={styles.adminCol}>
            <Text style={styles.adminLabel}>Área Produce</Text>
            <Text style={styles.adminValue}>{receta.areaProduce || '-'}</Text>
          </View>
          <View style={[styles.adminCol, { borderRight: 0 }]}>
            <Text style={styles.adminLabel}>Área Empaca</Text>
            <Text style={styles.adminValue}>{receta.areaEmpaca || '-'}</Text>
          </View>
        </View>

        {/* TABLA DE INGREDIENTES */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colCode}>Cód. NS</Text>
            <Text style={styles.colDesc}>Descripción del Ingrediente</Text>
            <Text style={styles.colBrand}>Marca</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colUnit}>U.M.</Text>
            <Text style={styles.colObs}>Obs.</Text>
            <Text style={styles.colCost}>Costo (₡)</Text>
          </View>

          {/* MATERIAS PRIMAS */}
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>Materias Primas & Semielaborados</Text>
          </View>
          {ingredientesCategorizados.materiasPrimas.map((ing: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colCode}>{ing.codigoNetSuite || '-'}</Text>
              <Text style={styles.colDesc}>{ing.nombre}</Text>
              <Text style={styles.colBrand}>{ing.marca || '-'}</Text>
              <Text style={styles.colQty}>{ing.cantidad || 0}</Text>
              <Text style={styles.colUnit}>{ing.unidad || 'g'}</Text>
              <Text style={styles.colObs}>{ing.observaciones || '-'}</Text>
              <Text style={styles.colCost}>{ing.costoTotal?.toFixed(2) || '0.00'}</Text>
            </View>
          ))}

          {/* EMPAQUE */}
          {ingredientesCategorizados.empaque.length > 0 && (
            <>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryText}>Empaque</Text>
              </View>
              {ingredientesCategorizados.empaque.map((ing: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colCode}>{ing.codigoNetSuite || '-'}</Text>
                  <Text style={styles.colDesc}>{ing.nombre}</Text>
                  <Text style={styles.colBrand}>{ing.marca || '-'}</Text>
                  <Text style={styles.colQty}>{ing.cantidad || 0}</Text>
                  <Text style={styles.colUnit}>{ing.unidad || 'u'}</Text>
                  <Text style={styles.colObs}>{ing.observaciones || '-'}</Text>
                  <Text style={styles.colCost}>{ing.costoTotal?.toFixed(2) || '0.00'}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* RENDIMIENTO */}
        <View style={styles.yieldSection}>
          <View style={styles.yieldRow}>
            <Text style={styles.yieldLabel}>Peso Total Obtenido</Text>
            <Text style={styles.yieldValue}>{receta.pesoTotalCantidad || 0}</Text>
            <Text style={styles.yieldUnit}>{receta.pesoTotalUnidad || 'g'}</Text>
          </View>
          <View style={styles.yieldRow}>
            <Text style={styles.yieldLabel}>Tiempo Total de Preparación</Text>
            <Text style={styles.yieldValue}>{receta.tiempoPrepCantidad || 0}</Text>
            <Text style={styles.yieldUnit}>{receta.tiempoPrepUnidad || 'min'}</Text>
          </View>
          <View style={styles.yieldRow}>
            <Text style={styles.yieldLabel}>Cantidad de Porciones Obtenidas</Text>
            <Text style={styles.yieldValue}>{receta.porcionesCantidad || 0}</Text>
            <Text style={styles.yieldUnit}>{receta.porcionesUnidad || 'porciones'}</Text>
          </View>
          <View style={styles.yieldRow}>
            <Text style={styles.yieldLabel}>Peso de Cada Porción</Text>
            <Text style={styles.yieldValue}>{receta.pesoPorcionCantidad || 0}</Text>
            <Text style={styles.yieldUnit}>{receta.pesoPorcionUnidad || 'g'}</Text>
          </View>
          <View style={[styles.yieldRow, { borderBottom: 0 }]}>
            <Text style={styles.yieldLabel}>Merma (Materia Prima)</Text>
            <Text style={styles.yieldValue}>{receta.mermaCantidad || 0}</Text>
            <Text style={styles.yieldUnit}>g</Text>
          </View>
        </View>

        {/* PROCEDIMIENTO */}
        <Text style={styles.sectionHeader}>Procedimiento de Preparación de la Receta</Text>
        <View style={styles.stepsContent}>
          {receta.pasos && receta.pasos.map((paso: string, i: number) => (
            <View key={i} style={styles.stepItem}>
              <Text style={styles.stepNumber}>{i + 1}.-</Text>
              <Text style={{ flex: 1 }}>{paso}</Text>
            </View>
          ))}
          {(!receta.pasos || receta.pasos.length === 0) && (
            <Text style={{ fontSize: 7, color: '#94a3b8', fontStyle: 'italic' }}>No se han registrado pasos para esta receta.</Text>
          )}
        </View>

        {/* CONTROL DE CAMBIOS */}
        <Text style={styles.sectionHeader}>Control de Cambios / Notas</Text>
        <View style={styles.stepsContent}>
          <Text style={{ fontSize: 8 }}>{receta.registroCambios || 'Sin cambios en la versión actual.'}</Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generado por GastroFlow Pro</Text>
          <Text style={styles.footerText}>Página 1 de 1</Text>
          <Text style={styles.footerText}>{new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ExportarRecetaPDF;
