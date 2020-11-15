const db = require('../helpers/db');

module.exports.parcelLocator = async (size, dest, warehouseId) => {
  try {
    let zone;
    //find same dest zone
    const qZone = await db.query(
      `
      SELECT location.zone,
      COUNT(location.zone) AS zone_count
        FROM	location
        JOIN 	location_parcel
        ON location.id = location_parcel.location_id
        JOIN	parcel
        ON parcel.parcel_id = location_parcel.parcel_id
        WHERE parcel.to_warehouse_id = $1
      GROUP BY location.zone
        ORDER BY zone_count DESC;`,
      [dest]
    );

    //Pioneer
    if (qZone.rowCount === 0) {
      const newQZone = await db.query(
        `
      SELECT location.zone,
	      SUM(location.cube_cap)-COALESCE(SUM(location_parcel.cube),0) AS cube_available
      FROM	location
      FULL JOIN 	location_parcel
	      ON location.id = location_parcel.location_id
      FULL JOIN	parcel
        ON parcel.parcel_id = location_parcel.parcel_id
	    GROUP BY location.zone
      ORDER BY cube_available DESC, location.zone;`
      );

      zone = newQZone.rows[0].zone;
    } else {
      zone = qZone.rows[0].zone;
    }

    //find block and floor by weight
    let expectFloor;
    if (size.heaviness === 'H') {
      expectFloor = '0, 1, 2';
    } else if (size.heaviness === 'M') {
      expectFloor = '0, 1, 2, 3, 4';
    } else {
      expectFloor = '0, 1, 2, 3, 4, 5, 6';
    }

    const qBlock = await db.query(
      `
      SELECT
      location.id,
      location.floor,
      location.block,
      location.cube_cap - COALESCE(SUM(location_parcel.cube),0) AS cube_available
      FROM	location
        FULL JOIN 	location_parcel
        ON location.id = location_parcel.location_id
        FULL JOIN	parcel
        ON parcel.parcel_id = location_parcel.parcel_id
      WHERE location.warehouse_id = $1 AND location.zone = $2 
      AND location.floor IN(${expectFloor})
      GROUP BY location.id
      HAVING location.cube_cap - COALESCE(SUM(location_parcel.cube),0) >= $3
      ORDER BY location.floor DESC,location.block,cube_available
      LIMIT 1;`,
      [warehouseId, zone, size.cube]
    );

    const block =
      qBlock.rows[0].block < 10
        ? `0${qBlock.rows[0].block}`
        : `${qBlock.rows[0].block}`;

    const location = `${zone}${qBlock.rows[0].floor}${block}`;

    return { location, location_id: qBlock.rows[0].id };
  } catch (error) {
    throw error;
  }
};
