import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#334155', // Slate 700 for main text
  },
  table: {
    width: '100%',
    border: '0.5px solid #cbd5e1', // Softer border
  },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #1e293b',
  },
  logoBox: {
    width: '20%',
    padding: 8,
    borderRight: '1px solid #cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  titleBox: {
    width: '55%',
    padding: 0,
    borderRight: '1px solid #cbd5e1',
    flexDirection: 'column',
  },
  metaBox: {
    width: '25%',
    backgroundColor: '#f8fafc',
  },
  titleLine: {
    borderBottom: '0.5px solid #cbd5e1',
    textAlign: 'center',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 10,
    color: '#1e293b',
  },
  nameLine: {
    backgroundColor: '#1e293b', // Deep Slate
    color: '#ffffff',
    textAlign: 'center',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  metaItem: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
    height: 22,
    alignItems: 'center',
  },
  metaLabel: {
    width: '55%',
    backgroundColor: '#f1f5f9', // Light Slate
    padding: 4,
    fontWeight: 'bold',
    fontSize: 7,
    height: '100%',
    borderRight: '0.5px solid #cbd5e1',
    justifyContent: 'center',
    color: '#475569',
  },
  metaValue: {
    width: '45%',
    padding: 4,
    textAlign: 'center',
    fontSize: 8,
    color: '#1e293b',
  },
  
  adminRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
    backgroundColor: '#f8fafc',
  },
  adminItem: {
    flexDirection: 'row',
    width: '50%',
    borderRight: '0.5px solid #cbd5e1',
    alignItems: 'center',
  },
  adminLabel: {
    width: '30%',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 7,
    textAlign: 'right',
    borderRight: '0.5px solid #cbd5e1',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
  },
  adminValue: {
    width: '70%',
    padding: 4,
    paddingLeft: 8,
    backgroundColor: '#fff',
    height: '100%',
    fontSize: 8,
    color: '#1e293b',
  },

  areaRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
    height: 20,
  },
  areaHeader: {
    width: '25%',
    backgroundColor: '#f1f5f9',
    padding: 4,
    fontWeight: 'bold',
    borderRight: '0.5px solid #cbd5e1',
    textAlign: 'center',
    color: '#475569',
    fontSize: 7,
  },
  areaValue: {
    width: '25%',
    padding: 4,
    textAlign: 'center',
    borderRight: '0.5px solid #cbd5e1',
    color: '#1e293b',
    fontSize: 8,
  },

  sectionTitle: {
    backgroundColor: '#475569', // Slate 600
    color: '#ffffff',
    textAlign: 'center',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: '0.5px solid #cbd5e1',
    letterSpacing: 1,
  },

  contentRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
  },
  contentLabel: {
    width: '12%',
    backgroundColor: '#f8fafc',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 7,
    borderRight: '0.5px solid #cbd5e1',
    textAlign: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  contentValue: {
    width: '88%',
    padding: 6,
    fontSize: 8,
    lineHeight: 1.4,
    color: '#334155',
  },

  weightRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    height: 24,
    alignItems: 'center',
  },
  weightItem: {
    flexDirection: 'row',
    width: '33.33%',
    borderRight: '0.5px solid #cbd5e1',
    height: '100%',
    alignItems: 'center',
  },
  weightLabel: {
    width: '40%',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 7,
    textAlign: 'center',
    color: '#64748b',
  },
  weightValue: {
    width: '60%',
    padding: 4,
    backgroundColor: '#fff',
    height: '100%',
    textAlign: 'center',
    fontSize: 9,
    justifyContent: 'center',
    color: '#1e293b',
    fontWeight: 'bold',
  },

  halfRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
    height: 22,
  },
  halfLabel: {
    width: '25%',
    backgroundColor: '#f8fafc',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 7,
    borderRight: '0.5px solid #cbd5e1',
    textAlign: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  halfValue: {
    width: '25%',
    padding: 4,
    textAlign: 'center',
    borderRight: '0.5px solid #cbd5e1',
    fontSize: 8,
    justifyContent: 'center',
    color: '#334155',
  },

  fullLabelRow: {
    backgroundColor: '#f1f5f9',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
    borderBottom: '0.5px solid #cbd5e1',
    color: '#475569',
    letterSpacing: 0.5,
  },

  charBox: {
    width: '25%',
    backgroundColor: '#f8fafc',
    padding: 5,
    fontWeight: 'bold',
    borderRight: '0.5px solid #cbd5e1',
    borderBottom: '0.5px solid #cbd5e1',
    color: '#64748b',
    fontSize: 7,
  },
  charValue: {
    width: '25%',
    padding: 5,
    borderRight: '0.5px solid #cbd5e1',
    borderBottom: '0.5px solid #cbd5e1',
    fontSize: 8,
    color: '#334155',
  },

  photoBox: {
    width: '50%',
    padding: 12,
    borderRight: '0.5px solid #cbd5e1',
    borderBottom: '0.5px solid #cbd5e1',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  microRow: {
    flexDirection: 'row',
    borderBottom: '0.5px solid #cbd5e1',
  },
  microCol: {
    padding: 5,
    borderRight: '0.5px solid #cbd5e1',
    justifyContent: 'center',
    fontSize: 8,
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1px solid #94a3b8',
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checked: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ef8e19', // Brand Orange accent
  }
});

interface Props {
  ficha: any;
  receta: any;
  logoUrl?: string;
}

const ExportarFichaTecnicaPDF = ({ ficha, receta, logoUrl = '/logo.png' }: Props) => {
  const ingredientesStr = receta?.ingredientes?.map((i: any) => i.nombre).join(', ') || '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.table}>
          {/* HEADER SECTION */}
          <View style={styles.headerRow}>
            <View style={styles.logoBox}>
              <Image src={logoUrl} style={{ width: 60 }} />
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.titleLine}>SERVICIOS DE PASTELERIA S.A.</Text>
              <Text style={[styles.titleLine, { borderBottom: 0, fontSize: 10 }]}>ESPECIFICACION DE PRODUCTO TERMINADO</Text>
              <Text style={styles.nameLine}>{ficha.nombreReceta?.toUpperCase()}</Text>
            </View>
            <View style={styles.metaBox}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>CODIGO:</Text>
                <Text style={styles.metaValue}>{ficha.codigoCalidadPropio}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>REVISION:</Text>
                <Text style={styles.metaValue}>{ficha.version}</Text>
              </View>
              <View style={[styles.metaItem, { borderBottom: 0, height: 25 }]}>
                <Text style={styles.metaLabel}>FECHA DE APROBACION:</Text>
                <Text style={styles.metaValue}>{ficha.ultimaModificacion?.split(',')[0]}</Text>
              </View>
            </View>
          </View>

          {/* ADMIN INFO */}
          <View style={styles.adminRow}>
            <View style={styles.adminItem}>
              <Text style={styles.adminLabel}>ELABORADO:</Text>
              <Text style={styles.adminValue}>{ficha.elaboradoPor}</Text>
            </View>
            <View style={[styles.adminItem, { borderRight: 0 }]}>
              <Text style={[styles.adminLabel, { backgroundColor: '#334155', color: '#fff' }]}>APROBADO:</Text>
              <Text style={styles.adminValue}>{ficha.aprobadoPor}</Text>
            </View>
          </View>

          {/* AREAS */}
          <View style={styles.areaRow}>
            <Text style={styles.areaHeader}>AREA QUE PRODUCE:</Text>
            <Text style={styles.areaValue}>{ficha.areaProduce}</Text>
            <Text style={styles.areaHeader}>AREA QUE EMPACA:</Text>
            <Text style={[styles.areaValue, { borderRight: 0 }]}>{ficha.areaEmpaca}</Text>
          </View>

          {/* DESCRIPCION Section */}
          <View style={styles.sectionTitle}><Text>DESCRIPCIÓN DEL PRODUCTO</Text></View>
          
          <View style={styles.contentRow}>
            <View style={styles.contentLabel}><Text>DESCRIPCION TECNICA DEL PRODUCTO</Text></View>
            <View style={styles.contentValue}><Text>{ficha.descripcionTecnica}</Text></View>
          </View>
          
          <View style={styles.contentRow}>
            <View style={[styles.contentLabel, { height: 40 }]}><Text>INGREDIENTES</Text></View>
            <View style={styles.contentValue}><Text>{ingredientesStr}</Text></View>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.contentLabel}><Text>ALÉRGENOS:</Text></View>
            <View style={styles.contentValue}><Text>{ficha.alergenos?.join(', ') || 'N/A'}</Text></View>
          </View>

          <View style={styles.contentRow}>
            <View style={[styles.contentLabel, { backgroundColor: '#475569', color: '#fff' }]}><Text>USO INTENCIONAL DEL PRODUCTO</Text></View>
            <View style={styles.contentValue}><Text>{ficha.usoIntencional}</Text></View>
          </View>

          <View style={styles.contentRow}>
            <View style={[styles.contentLabel, { backgroundColor: '#475569', color: '#fff' }]}><Text>ASPECTOS DE RECHAZO</Text></View>
            <View style={styles.contentValue}><Text>{ficha.aspectoRechazo}</Text></View>
          </View>

          {/* WEIGHTS */}
          <View style={styles.weightRow}>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>PESO BRUTO:</Text>
              <View style={styles.weightValue}><Text>{ficha.pesoBruto}</Text></View>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>PESO NETO:</Text>
              <View style={styles.weightValue}><Text>{ficha.pesoNeto}</Text></View>
            </View>
            <View style={[styles.weightItem, { borderRight: 0, backgroundColor: '#1e293b' }]}>
              <Text style={[styles.weightLabel, { color: '#fff' }]}>PESO ETIQUETA</Text>
              <View style={styles.weightValue}><Text>{ficha.pesoEtiqueta}</Text></View>
            </View>
          </View>

          {/* SHELF LIFE */}
          <View style={styles.halfRow}>
            <View style={styles.halfLabel}><Text>VIDA UTIL CONGELADO</Text></View>
            <View style={styles.halfValue}><Text>{ficha.vidaUtilCongelado}</Text></View>
            <View style={[styles.halfLabel, { backgroundColor: '#334155', color: '#fff' }]}><Text>VIDA UTIL</Text></View>
            <View style={[styles.halfValue, { borderRight: 0 }]}><Text>{ficha.vidaUtilRefrigerado || ficha.vidaUtilAmbiente}</Text></View>
          </View>

          {/* BARCODE & LOGISTICS */}
          <View style={styles.fullLabelRow}><Text>CODIGO DE BARRAS</Text></View>
          <View style={[styles.halfRow, { height: 15 }]}>
             <View style={{ width: '100%', padding: 2, textAlign: 'center' }}><Text>{ficha.codigoBarras || '---'}</Text></View>
          </View>

          <View style={[styles.halfRow, { backgroundColor: '#1e293b' }]}>
             <View style={[styles.halfLabel, { width: '33.33%', color: '#fff', backgroundColor: '#1e293b' }]}><Text>REQUIERE ETIQUETA CON DECLARACION DE INGREDIENTES:</Text></View>
             <View style={[styles.halfLabel, { width: '33.33%', color: '#fff', backgroundColor: '#1e293b' }]}><Text>REGISTRO M.S</Text></View>
             <View style={[styles.halfLabel, { width: '33.33%', color: '#fff', backgroundColor: '#1e293b', borderRight: 0 }]}><Text>A.CR-</Text></View>
          </View>
          <View style={[styles.halfRow, { height: 25 }]}>
             <View style={[styles.halfValue, { width: '33.33%' }]}><Text>{ficha.requiereEtiquetaIngredientes ? 'SI' : 'NO'}</Text></View>
             <View style={[styles.halfValue, { width: '33.33%' }]}><Text>{ficha.registroMS}</Text></View>
             <View style={[styles.halfValue, { width: '33.33%', borderRight: 0 }]}><Text>---</Text></View>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.contentLabel}><Text>TIPO Y UNIDAD DE EMPAQUE</Text></View>
            <View style={styles.contentValue}><Text>{ficha.empaque}</Text></View>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.contentLabel}><Text>ALMACENAMIENTO INTERNO Y MANEJO DEL PRODUCTO</Text></View>
            <View style={styles.contentValue}><Text>{ficha.almacenamientoInterno}</Text></View>
          </View>

          {/* CHARACTERISTICS */}
          <View style={[styles.fullLabelRow, { borderTop: '1px solid #000' }]}><Text>CARACTERISTICAS DE PRODUCTO- ORGANOLÉPTICAS Y FÍSICAS</Text></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={styles.charBox}><Text>Color:</Text></View>
            <View style={styles.charValue}><Text>{ficha.organolepticas?.color}</Text></View>
            <View style={styles.charBox}><Text>Sabor:</Text></View>
            <View style={[styles.charValue, { borderRight: 0 }]}><Text>{ficha.organolepticas?.sabor}</Text></View>
            
            <View style={styles.charBox}><Text>Olor :</Text></View>
            <View style={styles.charValue}><Text>{ficha.organolepticas?.olor || 'N/A'}</Text></View>
            <View style={styles.charBox}><Text>Textura:</Text></View>
            <View style={[styles.charValue, { borderRight: 0 }]}><Text>{ficha.organolepticas?.textura}</Text></View>
            
            <View style={styles.charBox}><Text>Altura:</Text></View>
            <View style={styles.charValue}><Text>{ficha.fisicas?.altura}</Text></View>
            <View style={styles.charBox}><Text>Diametro:</Text></View>
            <View style={[styles.charValue, { borderRight: 0 }]}><Text>{ficha.fisicas?.diametro}</Text></View>
            
            <View style={styles.charBox}><Text>Largo:</Text></View>
            <View style={styles.charValue}><Text>{ficha.fisicas?.largo}</Text></View>
            <View style={styles.charBox}><Text>Ancho:</Text></View>
            <View style={[styles.charValue, { borderRight: 0 }]}><Text>{ficha.fisicas?.ancho}</Text></View>
          </View>

          {/* OTHERS */}
          <View style={[styles.fullLabelRow]}><Text>OTROS</Text></View>
          <View style={styles.contentRow}>
            <View style={[styles.contentLabel, { width: '15%' }]}><Text>Transporte:</Text></View>
            <View style={[styles.contentValue, { width: '85%', flexDirection: 'row', alignItems: 'center' }]}>
               <View style={styles.checkboxContainer}>
                 <View style={styles.checkbox}><Text style={styles.checked}>{ficha.transporte?.includes('Refrigeración') ? 'x' : ''}</Text></View>
                 <Text>Refrigeración 0°C / 5°C</Text>
               </View>
               <View style={styles.checkboxContainer}>
                 <View style={styles.checkbox}><Text style={styles.checked}>{ficha.transporte?.includes('Congelación') ? 'x' : ''}</Text></View>
                 <Text>Congelación -12°/-18°C</Text>
               </View>
               <View style={styles.checkboxContainer}>
                 <View style={styles.checkbox}><Text style={styles.checked}>{ficha.transporte?.includes('Ambiente') ? 'x' : ''}</Text></View>
                 <Text>Ambiente</Text>
               </View>
            </View>
          </View>

          <View style={styles.contentRow}>
            <View style={[styles.contentLabel, { width: '25%' }]}><Text>Almacenamiento Punto de Venta:</Text></View>
            <View style={[styles.contentValue, { width: '75%' }]}><Text>{ficha.almacenamientoPuntoVenta}</Text></View>
          </View>

          <View style={styles.contentRow}>
            <View style={[styles.contentLabel, { width: '25%' }]}><Text>Potencial de Mal Uso:</Text></View>
            <View style={[styles.contentValue, { width: '75%' }]}><Text>Consumir fuera de la fecha de vencimiento</Text></View>
          </View>

          {/* MICROBIOLOGY */}
          <View style={[styles.fullLabelRow]}><Text>ASPECTOS MICROBIOLOGICOS</Text></View>
          <View style={{ flexDirection: 'row', borderBottom: '0.5px solid #cbd5e1', backgroundColor: '#475569' }}>
             <View style={[styles.microCol, { width: '30%', color: '#fff' }]}><Text>Organismo</Text></View>
             <View style={[styles.microCol, { width: '40%', borderRight: 0, color: '#fff' }]}><Text>Límite / Detalle</Text></View>
          </View>
          {ficha.aspectosMicrobiologicos?.map((m: any, i: number) => (
            <View key={i} style={styles.microRow}>
               <View style={[styles.microCol, { width: '30%', backgroundColor: '#f1f5f9', fontWeight: 'bold' }]}><Text>{m.microorganismo}</Text></View>
               <View style={[styles.microCol, { width: '70%', borderRight: 0 }]}><Text>{m.detalle}</Text></View>
            </View>
          ))}
        </View>

        {/* PAGE 2 for Photos and Changes */}
        <View style={[styles.table, { marginTop: 20, borderTop: '1px solid #000' }]}>
            <View style={styles.fullLabelRow}><Text>FOTOGRAFIAS DEL PRODUCTO</Text></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
               {ficha.imagenes?.map((img: string, i: number) => (
                  <View key={i} style={[styles.photoBox, (i % 2 === 1) ? { borderRight: 0 } : {}]}>
                    <Image src={img} style={styles.photo} />
                  </View>
               ))}
               {(!ficha.imagenes || ficha.imagenes.length === 0) && (
                 <View style={{ width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #000' }}>
                   <Text>Sin fotografías disponibles</Text>
                 </View>
               )}
            </View>

            <View style={styles.fullLabelRow}><Text>CONTROL DE CAMBIOS</Text></View>
            <View style={{ flexDirection: 'row', borderBottom: '0.5px solid #cbd5e1', backgroundColor: '#475569' }}>
               <View style={[styles.microCol, { width: '15%', color: '#fff' }]}><Text>Versión</Text></View>
               <View style={[styles.microCol, { width: '20%', color: '#fff' }]}><Text>Fecha</Text></View>
               <View style={[styles.microCol, { width: '65%', borderRight: 0, color: '#fff' }]}><Text>Descripción del Cambio</Text></View>
            </View>
            {ficha.historialCambios?.map((h: any, i: number) => (
               <View key={i} style={styles.microRow}>
                  <View style={[styles.microCol, { width: '15%' }]}><Text>{h.version}</Text></View>
                  <View style={[styles.microCol, { width: '20%' }]}><Text>{h.fecha}</Text></View>
                  <View style={[styles.microCol, { width: '65%', borderRight: 0 }]}><Text>{h.descripcion}</Text></View>
               </View>
            ))}
        </View>
      </Page>
    </Document>
  );
};

export default ExportarFichaTecnicaPDF;
