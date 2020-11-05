const router = require('express').Router();
const db = require('../helpers/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { loginValidation } = require('../helpers/validation');

router.post('/login', async (req, res) => {
  //Validation
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ errors: error.details });
  }

  //find user_id
  const response = await db.query(
    'SELECT user_id,password,first_name,position FROM public."user" WHERE user_id=$1',
    [req.body.userId]
  );

  if (response.rowCount === 0) {
    return res
      .status(400)
      .send({ errors: [{ message: 'Wrong userID or password' }] });
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

module.exports = router;
