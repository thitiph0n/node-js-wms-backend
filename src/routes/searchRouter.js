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

module.exports = router;
