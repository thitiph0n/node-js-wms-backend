const router = require('express').Router();
const db = require('../helpers/db');

const authorization = require('../middleware/authorization');

router.use(authorization);

// Search senders
router.get('/senders', async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : `%%`;

  try {
    const {
      rows,
    } = await db.query(
      `SELECT sender_id, name FROM public.sender WHERE sender_id LIKE $1 OR name LIKE $1;`,
      [q]
    );
    //remove password element
    const response = rows.map((row) => {
      return {
        senderId: row.sender_id,
        senderName: row.name,
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

// Search warehouses
router.get('/warehouses', async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : `%%`;

  try {
    const {
      rows,
    } = await db.query(
      `SELECT warehouse_id, name FROM public.warehouse WHERE warehouse_id LIKE $1 OR name LIKE $1;`,
      [q]
    );
    //remove password element
    const response = rows.map((row) => {
      return {
        warehouseId: row.warehouse_id,
        name: row.name,
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

// Search users
router.get('/users', async (req, res) => {
  const userId = req.query.userId ? `%${req.query.userId}%` : `%%`;
  const position = req.query.position
    ? `%${req.query.position.toLowerCase()}%`
    : `%%`;

  try {
    const {
      rows,
    } = await db.query(
      `SELECT user_id, first_name, last_name, position FROM public.user WHERE user_id LIKE $1 AND position LIKE $2;`,
      [userId, position]
    );
    //remove password element
    const response = rows.map((row) => {
      return {
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        position: row.position,
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

module.exports = router;
