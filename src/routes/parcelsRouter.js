const router = require('express').Router();
const db = require('../helpers/db');
const pool = db.pool;

const authorization = require('../middleware/authorization');
const allowAccess = require('../middleware/allowAccess');

const {
  newParcelValidation,
  editParcelValidation,
} = require('../helpers/validation');

const { genParcelId } = require('../services/genParcelId');
const { sizeCalculator } = require('../services/sizeCalculator');
const { parcelLocator } = require('../services/parcelLocator');
const { genParcelLabel } = require('../services/genParcelLabel');

router.use(authorization);

// Add new parcel
router.post('/', async (req, res) => {
  // Validate input
  const { error } = newParcelValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  // Get parcel number
  let runningNum;

  try {
    const { rows } = await db.query(
      `WITH sel AS(SELECT count FROM public.counter WHERE counter_id ='parcel'),\
       update AS (UPDATE public.counter SET count = count + 1 WHERE
      counter_id = 'parcel') SELECT * FROM sel;`
    );

    runningNum = rows[0].count;
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }

  // Calculate size
  const size = sizeCalculator(
    req.body.width,
    req.body.length,
    req.body.height,
    req.body.weight
  );

  // Generate parcelId
  const parcelId = genParcelId(size, runningNum);

  try {
    // Calculate location
    const { location, location_id } = await parcelLocator(
      size,
      req.body.toWarehouseId,
      req.body.fromWarehouseId
    );

    // Insert into database
    await db.query(
      `WITH ins_parcel AS (INSERT INTO public."parcel"(\
        parcel_id, sender_id, from_warehouse_id, to_warehouse_id, weight, height,\
        width, length,latest_status, optional, location, received_date)\
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) RETURNING parcel_id)
      INSERT INTO public.location_parcel
      (location_id, parcel_id, cube)
      SELECT $12, parcel_id, $13
      FROM ins_parcel;`,
      [
        parcelId,
        req.body.senderId,
        req.body.fromWarehouseId,
        req.body.toWarehouseId,
        req.body.weight,
        req.body.height,
        req.body.width,
        req.body.length,
        'picked up',
        req.body.optional,
        location,
        location_id,
        size.cube,
      ]
    );

    // Generate parcel label
    const url = await genParcelLabel({
      parcelId,
      senderId: req.body.senderId,
      width: req.body.width,
      height: req.body.height,
      length: req.body.length,
      weight: req.body.weight,
      from: req.body.fromWarehouseId,
      to: req.body.toWarehouseId,
      location,
    });

    // Update labelPath and response
    const { rows: resRows } = await db.query(
      `WITH update AS (UPDATE public.parcel
        SET label_path=$1
        WHERE parcel_id=$2 RETURNING *)
       SELECT * FROM update;`,
      [url, parcelId]
    );
    return res.status(201).send({
      success: 'parcel created',
      payload: [
        {
          parcelId: resRows[0].parcel_id,
          senderId: resRows[0].senderId,
          fromWarehouseId: resRows[0].from_warehouse_id,
          toWarehouseId: resRows[0].to_warehouse_id,
          width: resRows[0].width,
          length: resRows[0].length,
          height: resRows[0].height,
          weight: resRows[0].weight,
          optional: resRows[0].optional,
          receivedDate: resRows[0].received_date,
          exportedDate: resRows[0].exported_date,
          latestStatus: resRows[0].latest_status,
          labelPath: resRows[0].label_path,
          location: resRows[0].location,
        },
      ],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

// Get all parcel
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.parcel');

    const response = rows.map((row) => {
      return {
        parcelId: row.parcel_id,
        senderId: row.sender_id,
        fromWarehouseId: row.from_warehouse_id,
        toWarehouseId: row.to_warehouse_id,
        width: row.width,
        length: row.length,
        height: row.height,
        weight: row.weight,
        optional: row.optional,
        receivedDate: row.received_date,
        exportedDate: row.exported_date,
        latestStatus: row.latest_status,
        labelPath: row.label_path,
        location: row.location,
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

// Get parcel by Id
router.get('/:parcelId', async (req, res) => {
  try {
    const {
      rows,
    } = await db.query(
      `SELECT * FROM public.parcel JOIN public.sender ON sender.sender_id = parcel.sender_id WHERE parcel.parcel_id = $1`,
      [req.params.parcelId]
    );

    const response = rows.map((row) => {
      return {
        parcelId: row.parcel_id,
        senderId: row.sender_id,
        senderName: row.name,
        senderAddress: row.address,
        senderCountry: row.country,
        senderPhone: row.phone,
        fromWarehouseId: row.from_warehouse_id,
        toWarehouseId: row.to_warehouse_id,
        width: row.width,
        length: row.length,
        height: row.height,
        weight: row.weight,
        optional: row.optional,
        receivedDate: row.received_date,
        exportedDate: row.exported_date,
        latestStatus: row.latest_status,
        labelPath: row.label_path,
        location: row.location,
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

//Update status (stored,exported)
router.put('/status', async (req, res) => {
  if (!Array.isArray(req.body.parcels) || !req.body.status) {
    return res.status(400).send({
      errors: [{ message: 'status and array of parcelId are required!' }],
    });
  }

  const client = await pool.connect();

  const queryText =
    req.body.status === 'exported'
      ? `WITH ins_status AS (INSERT INTO public.parcel_status(
    parcel_id, status, update_by, "time")
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP))
    UPDATE public.parcel SET latest_status=$2 , exported_date=CURRENT_TIMESTAMP
    WHERE parcel_id=$1;`
      : `WITH ins_status AS (INSERT INTO public.parcel_status(
      parcel_id, status, update_by, "time")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP))
      UPDATE public.parcel SET latest_status=$2
      WHERE parcel_id=$1;`;

  let dbError = null;

  try {
    await client.query('BEGIN');
    await req.body.parcels.forEach((parcelId) => {
      client
        .query(queryText, [parcelId, req.body.status, req.body.updateBy])
        .catch((e) => {
          dbError = e;
        });
    });

    if (dbError) {
      throw dbError;
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }

  if (dbError) {
    return res.status(500).send({
      errors: [{ message: dbError.message }],
    });
  }

  return res.send({
    success: `Updated parcels status successful`,
  });
});

// Edit parcel
router.put('/:parcelId', async (req, res) => {
  //Validation
  const { error } = editParcelValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  try {
    const { rows: resRows } = await db.query(
      `UPDATE public.parcel
    SET optional=$2
    WHERE parcel_id = $1 RETURNING parcel_id;`,
      [req.params.parcelId, req.body.optional]
    );
    return res.send({
      success: `Update ${resRows[0].parcel_id} successful`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

// Delete parcel
router.delete('/:parcelId', async (req, res) => {
  try {
    const response = await db.query(
      'DELETE FROM public.parcel WHERE parcel_id = $1',
      [req.params.parcelId]
    );
    if (response.rowCount === 0) {
      return res.send({
        errors: [{ message: `${req.params.parcelId} not exist` }],
      });
    }
    return res.send({ success: `Delete ${req.params.parcelId} successful` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

module.exports = router;
