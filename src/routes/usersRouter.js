const router = require('express').Router();
const db = require('../helpers/db');
const bcrypt = require('bcrypt');

const { newUserValidation } = require('../helpers/validation');

router.use(require('../middlewares/authorization'));

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

module.exports = router;
