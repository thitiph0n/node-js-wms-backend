const router = require('express').Router();
const db = require('../helpers/db');

const authorization = require('../middleware/authorization');
const allowAccess = require('../middleware/allowAccess');

const { genLocation } = require('../services/genLocation');

const {
  newWarehouseValidation,
  editWarehouseValidation,
} = require('../helpers/validation');

router.use(authorization);

//Add new warehouse
router.post('/', allowAccess(['admin']), async (req, res) => {
  //Validation
  const { error } = newWarehouseValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  //Store in database
  const address = {
    address: req.body.address,
    zipCode: req.body.zipCode,
    country: req.body.country,
    city: req.body.city,
    coordinates: req.body.coordinates,
  };

  try {
    const { rows: resRows } = await db.query(
      `INSERT INTO public.warehouse(
      warehouse_id, name, address, phone, type, manager_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING warehouse_id, type;`,
      [
        req.body.warehouseId,
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

    return res
      .status(201)
      .send({ success: `Warehouse #${resRows[0].warehouse_id} created` });
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

    const warehouseResponse = warehouseRows.map((row) => {
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

    return res.send({ payload: warehouseResponse });
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
  const { error } = editWarehouseValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

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
