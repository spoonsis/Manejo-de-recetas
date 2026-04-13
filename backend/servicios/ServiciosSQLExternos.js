const { pool, poolConnect } = require("../config/externalDb");

async function listarArticulos() {
    await poolConnect;

    const result = await pool.request()
        .query(`
    SELECT 
    fullname AS id,
    description AS nombre,
    averagecost AS precioCompra,
    marca,
    weightunits AS unidad
FROM l_nt_dim_articulo
WHERE LEFT(fullname, 2) IN ('MP', 'SE', 'PT', 'EM');
        `);

    const items = result.recordset.map(item => ({
        ...item,
        source: 'EXTERNA'
    }));

    return items;
}
async function listarTablasAzure() {
    await poolConnect;

    const result = await pool.request().query(`
         SELECT 
          * from l_nt_dim_articulo where description LIKE '%pistacho%' 
    `);

    return result.recordset;
}
/**
 * Busca items en la tabla de NetSuite por externalid o descripción.
 */
async function buscarItems(termino) {
    await poolConnect;
    const result = await pool.request()
        .input('termino', `%${termino}%`)
        .query(`
            SELECT 
            fullname,
                description,
                averagecost
            FROM l_nt_dim_articulo
            WHERE fullname LIKE @termino OR description LIKE @termino
        `);
    return result.recordset;
}

/**
 * Obtiene el costo promedio de un item específico de NetSuite.
 */
async function obtenerCostoItem(fullname) {
    await poolConnect;
    const result = await pool.request()
        .input('fullname', fullname)
        .query(`
            SELECT averagecost
            FROM l_nt_dim_articulo
            WHERE fullname = @fullname
        `);
    return result.recordset[0] ? result.recordset[0].averagecost : null;
}

/**
 * Obtiene la lista de proveedores desde Azure SQL.
 */
async function obtenerProveedores() {
    await poolConnect;
    const result = await pool.request()
        .query(`
            SELECT DISTINCT [Nombre] AS nombre
            FROM [dbo].[Proveedor]
            WHERE [Nombre] IS NOT NULL
            ORDER BY [Nombre]
        `);
    return result.recordset;
}

module.exports = {
    buscarItems,
    obtenerCostoItem,
    listarArticulos,
    listarTablasAzure,
    obtenerProveedores
};
