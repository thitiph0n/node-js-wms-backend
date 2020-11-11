const router = require('express').Router();
const db = require('../helpers/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  loginValidation,
  changePassValidation,
} = require('../helpers/validation');

router.post('/login', async (req, res) => {
  //Validation
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  //find user_id
  const response = await db.query(
    'SELECT user_id,password,first_name,position,phone FROM public."user" WHERE user_id=$1',
    [req.body.userId]
  );

  if (response.rowCount === 0) {
    return res
      .status(400)
      .send({ errors: [{ message: 'Wrong userID or password' }] });
  }

  //Check unsecured password
  if (req.body.password === response.rows[0].phone) {
    return res
      .status(426)
      .send({ errors: [{ message: 'Unsecured! change password required' }] });
  }

  //comparing password
  const validPass = await bcrypt.compare(
    req.body.password,
    response.rows[0].password
  );

  if (!validPass) {
    return res
      .status(400)
      .send({ errors: [{ message: 'Wrong userID or password' }] });
  }

  //sign jwt
  const payload = {
    userId: req.body.userId,
    iat: Date.now(),
    firstName: response.rows[0].first_name,
    position: response.rows[0].position,
  };
  const key = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);

  const token = `Bearer ${key}`;

  return res.send({
    success: 'Login success',
    payload: [{ ...payload, jwtToken: token }],
  });
});

router.post('/change-password', async (req, res) => {
  //Validation
  const { error } = changePassValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  //Query user
  const response = await db.query(
    'SELECT user_id,password,phone FROM public."user" WHERE user_id=$1',
    [req.body.userId]
  );

  if (response.rowCount === 0) {
    return res
      .status(400)
      .send({ errors: [{ message: 'Wrong userID or password' }] });
  }

  //comparing old password
  const validPass = await bcrypt.compare(
    req.body.oldPassword,
    response.rows[0].password
  );

  //Check old password
  if (!validPass && req.body.oldPassword !== response.rows[0].phone) {
    return res
      .status(400)
      .send({ errors: [{ message: 'Wrong userID or password' }] });
  }

  //Hashing new password
  const hashedPass = await bcrypt.hash(req.body.newPassword, 10);

  //update
  try {
    await db.query(
      'UPDATE public.user \
    SET password= $2\
    WHERE user_id = $1 ',
      [req.body.userId, hashedPass]
    );
    return res.send({
      success: `Change ${req.body.userId} password successful`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      errors: [{ message: 'Database error' }],
    });
  }
});

module.exports = router;
