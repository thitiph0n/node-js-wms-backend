const router = require('express').Router();
const db = require('../helpers/db');
const bcrypt = require('bcrypt');

const authorization = require('../middlewares/authorization');
const allowAccess = require('../middlewares/allowAccess');

const { newUserValidation } = require('../helpers/validation');

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
    [req.body.user_id]
  );

  if (response.rowCount !== 0) {
    return res
      .status(400)
      .send({ errors: [{ message: 'User already exists' }] });
  }

  //Hashing password
  const hashedPass = await bcrypt.hash(req.body.password, 10);

  //Store in database
  try {
    await db.query(
      'INSERT INTO public."user"(\
          user_id, password, first_name, last_name, position)\
          VALUES ($1, $2, $3, $4, $5);',
      [
        req.body.user_id,
        hashedPass,
        req.body.firstname,
        req.body.lastname,
        req.body.position,
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
      delete row.password;
      return row;
    });

    return res.send({ payload: response });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Get user by user_id
router.get('/:user_id', async (req, res) => {
  try {
    const {
      rows,
    } = await db.query('SELECT * FROM public.user WHERE user_id = $1', [
      req.params.user_id,
    ]);
    //remove password element
    const response = rows.map((row) => {
      delete row.password;
      return row;
    });

    return res.send({ payload: response });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Edit user by user_id
router.put('/:user_id', async (req, res) => {
  try {
    await db.query(
      'UPDATE public.user \
    SET first_name = $2, last_name = $3\
    WHERE user_id = $1 ',
      [req.params.user_id, req.body.firstname, req.body.lastname]
    );
    return res.send({ success: `Update ${req.params.user_id} successful` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

//Delete user by user_id
router.delete('/:user_id', async (req, res) => {
  try {
    const response = await db.query(
      'DELETE FROM public.user WHERE user_id = $1',
      [req.params.user_id]
    );
    if (response.rowCount === 0) {
      return res.send({ success: `${req.params.user_id} not exist` });
    }
    return res.send({ success: `Delete ${req.params.user_id} successful` });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

module.exports = router;
