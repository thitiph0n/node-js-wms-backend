const router = require('express').Router();
const db = require('../helpers/db');

const authorization = require('../middleware/authorization');
const allowAccess = require('../middleware/allowAccess');

const { genLocation } = require('../services/genLocation');
const { genWarehouseId } = require('../services/genWarehouseId');

const {
  newWarehouseValidation,
  editWarehouseValidation,
} = require('../helpers/validation');

router.use(authorization);

//Add new warehouse
router.post('/', allowAccess(['admin']), async (req, res) => {
  // Validation
  // const { error } = newWarehouseValidation(req.body);
  // if (error) {
  //   return res.status(400).send({ errors: error.details });
  // }

  // Generate warehouse Id
  let warehouseId;

  try {
    const { rows } = await db.query(
      `SELECT count FROM public.counter WHERE counter_id ='warehouse';`
    );

    warehouseId = genWarehouseId(rows[0].count);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [{ message: error.message }],
    });
  }

  // Store in database
  const address = {
    address: req.body.address,
    zipCode: req.body.zipCode,
    country: req.body.country,
    city: req.body.city,
    coordinates: req.body.coordinates,
  };

  try {
    const { rows: resRows } = await db.query(
      `WITH ins AS (INSERT INTO public.warehouse(
      warehouse_id, name, address, phone, type, manager_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING warehouse_id, type),
      pls_counter AS (UPDATE public.counter SET count = count + 1 WHERE
      counter_id = 'warehouse') SELECT * FROM ins;`,
      [
        warehouseId,
        req.body.name,
        JSON.stringify(address),
        req.body.phone,
        req.body.type,
        req.body.managerId,
        req.body.status,
      ]
    );

    // Create warehouse location plan
    await genLocation(resRows[0].warehouse_id, resRows[0].type);

    return res.status(201).send({
      success: `Warehouse #${resRows[0].warehouse_id} created`,
      payload: [{ warehouseId: resRows[0].warehouse_id }],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [{ message: error.message }],
    });
  }
});

//Get all warehouses
router.get('/', allowAccess(['admin', 'manager']), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.warehouse');

    const response = rows.map((row) => {
      return {
        warehouseId: row.warehouse_id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        type: row.type,
        managerId: row.manager_id,
        status: row.status,
      };
    });

    return res.send({ payload: response });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Get user by warehouseId
router.get('/:warehouseId', async (req, res) => {
  try {
    const {
      rows: warehouseRows,
      rowCount: warehouseRowCount,
    } = await db.query(
      'SELECT * FROM public.warehouse WHERE warehouse_id = $1',
      [req.params.warehouseId]
    );

    if (warehouseRowCount === 0) {
      return res.status(204).send({
        errors: [{ message: `Warehouse #${req.params.warehouseId} not found` }],
      });
    }

    const warehouseResponse = {
      warehouseId: warehouseRows[0].warehouse_id,
      name: warehouseRows[0].name,
      address: warehouseRows[0].address,
      phone: warehouseRows[0].phone,
      type: warehouseRows[0].type,
      managerId: warehouseRows[0].manager_id,
      status: warehouseRows[0].status,
    };

    const {
      rows: staffRows,
    } = await db.query(
      'SELECT user_id,first_name,last_name,position FROM public.user WHERE warehouse_id = $1',
      [req.params.warehouseId]
    );

    const { rows: spaceRows } = await db.query(
      `SELECT location.warehouse_id,
      SUM(location_parcel.cube) AS used_cube
        FROM	location
        JOIN 	location_parcel
        ON location.id = location_parcel.location_id
        WHERE location.warehouse_id = $1
      GROUP BY location.warehouse_id`,
      [req.params.warehouseId]
    );

    const { rows: numRows } = await db.query(
      `SELECT latest_status AS status, COUNT(*) AS count FROM public.parcel
      WHERE from_warehouse_id = $1
      GROUP BY latest_status;`,
      [req.params.warehouseId]
    );

    let all = 0,
      pickedUp = 0,
      stored = 0,
      exported = 0;

    numRows.forEach((row) => {
      if (row.status === 'picked up') {
        pickedUp = parseInt(row.count);
      } else if (row.status === 'stored') {
        stored = parseInt(row.count);
      } else if (row.status === 'exported') {
        exported = parseInt(row.count);
      } else {
        all = parseInt(row.count);
      }
    });

    all = all + pickedUp + stored + exported;

    let cap_cube;
    if (warehouseResponse.type === '1') {
      cap_cube = 860160;
    } else {
      cap_cube = 1075200;
    }

    const usedSpace = ((spaceRows[0].used_cube / cap_cube) * 100).toFixed(3);

    const analysisResponse = {
      staffs: staffRows,
      usedSpace,
      numberOfParcels: {
        all,
        pickedUp,
        stored,
        exported,
      },
    };

    return res.send({
      payload: [{ ...warehouseResponse, ...analysisResponse }],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Edit user by warehouseId
router.put('/:warehouseId', allowAccess(['admin']), async (req, res) => {
  //Validation
  // const { error } = editWarehouseValidation(req.body);
  // if (error) {
  //   return res.status(400).send({ errors: error.details });
  // }

  const address = {
    address: req.body.address,
    zipCode: req.body.zipCode,
    country: req.body.country,
    city: req.body.city,
    coordinates: req.body.coordinates,
  };

  try {
    const { rows: resRows } = await db.query(
      `UPDATE public.warehouse
    SET name=$2, address=$3, phone=$4, type=$5, manager_id=$6, status=$7
    WHERE warehouse_id = $1 RETURNING warehouse_id;`,
      [
        req.params.warehouseId,
        req.body.name,
        JSON.stringify(address),
        req.body.phone,
        req.body.type,
        req.body.managerId,
        req.body.status,
      ]
    );
    return res.send({
      success: `Update ${resRows[0].warehouse_id} successful`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Delete user by warehouseId
router.delete('/:warehouseId', allowAccess(['admin']), async (req, res) => {
  try {
    const response = await db.query(
      'DELETE FROM public.warehouse WHERE warehouse_id = $1',
      [req.params.warehouseId]
    );
    if (response.rowCount === 0) {
      return res.send({
        errors: [{ message: `${req.params.warehouseId} not exist` }],
      });
    }
    return res.send({ success: `Delete ${req.params.warehouseId} successful` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

module.exports = router;
