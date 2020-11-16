const router = require('express').Router();
const db = require('../helpers/db');
const bcrypt = require('bcrypt');

const authorization = require('../middleware/authorization');
const allowAccess = require('../middleware/allowAccess');

const {
  newUserValidation,
  editUserValidation,
} = require('../helpers/validation');

router.use(authorization);

router.use(allowAccess(['admin']));

//Add new user
router.post('/', async (req, res) => {
  //Validation
  const { error } = newUserValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  //find duplicated user_id
  const response = await db.query(
    'SELECT user_id FROM public."user" WHERE user_id=$1',
    [req.body.userId]
  );

  if (response.rowCount !== 0) {
    return res
      .status(400)
      .send({ errors: [{ message: 'User already exists' }] });
  }

  const password = `FIRST_TIME ${req.body.phone}`;

  //Store in database

  try {
    await db.query(
      'INSERT INTO public."user"(\
          user_id, password, first_name, last_name, position,\
          address,zip_code,country,city,phone,warehouse_id,dob,gender,email\
          )\
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);',
      [
        req.body.userId,
        password,
        req.body.firstName,
        req.body.lastName,
        req.body.position,
        req.body.address,
        req.body.zipCode,
        req.body.country,
        req.body.city,
        req.body.phone,
        req.body.warehouseId,
        req.body.dob,
        req.body.gender,
        req.body.email,
      ]
    );
    return res.status(201).send({ success: 'user created' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Get all users
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.user');
    //remove password element
    const response = rows.map((row) => {
      return {
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        position: row.position,
        address: row.address,
        zipCode: row.zip_code,
        country: row.country,
        city: row.city,
        phone: row.phone,
        warehouseId: row.warehouse_id,
        dob: row.dob,
        gender: row.gender,
        email: row.email,
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

//Get user by userId
router.get('/:userId', async (req, res) => {
  try {
    const {
      rows,
    } = await db.query('SELECT * FROM public.user WHERE user_id = $1', [
      req.params.userId,
    ]);
    //remove password element
    const response = rows.map((row) => {
      return {
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        position: row.position,
        address: row.address,
        zipCode: row.zip_code,
        country: row.country,
        city: row.city,
        phone: row.phone,
        warehouseId: row.warehouse_id,
        dob: row.dob,
        gender: row.gender,
        email: row.email,
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

//Edit user by userId
router.put('/:userId', async (req, res) => {
  //Validation
  const { error } = editUserValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  try {
    await db.query(
      'UPDATE public.user \
    SET first_name = $2, last_name = $3,\
    address = $4,zip_code = $5,country= $6,city= $7,phone= $8,warehouse_id= $9,dob= $10,gender= $11,email= $12\
    WHERE user_id = $1 ',
      [
        req.params.userId,
        req.body.firstName,
        req.body.lastName,
        req.body.address,
        req.body.zipCode,
        req.body.country,
        req.body.city,
        req.body.phone,
        req.body.warehouseId,
        req.body.dob,
        req.body.gender,
        req.body.email,
      ]
    );
    return res.send({ success: `Update ${req.params.userId} successful` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Delete user by userId
router.delete('/:userId', async (req, res) => {
  try {
    const response = await db.query(
      'DELETE FROM public.user WHERE user_id = $1',
      [req.params.userId]
    );
    if (response.rowCount === 0) {
      return res.send({ success: `${req.params.userId} not exist` });
    }
    return res.send({ success: `Delete ${req.params.userId} successful` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

module.exports = router;
