const db = require('../helpers/db');

module.exports.genLocation = async (warehouseId, type) => {
  let zones = [];

  if (type === 1) {
    zones = genCharArray('A', 'H');
  } else if (type === 2) {
    zones = genCharArray('A', 'J');
  } else {
    return -1;
  }

  zones.forEach(async (zone) => {
    for (let floor = 0; floor < 7; floor++) {
      await db.query(
        `INSERT INTO public.location(
                      warehouse_id, zone, floor, block)
                      VALUES ($1, $2, $3, 1)
                            ,($1, $2, $3, 2)
                            ,($1, $2, $3, 3)
                            ,($1, $2, $3, 4)
                            ,($1, $2, $3, 5)
                            ,($1, $2, $3, 6)
                            ,($1, $2, $3, 7)
                            ,($1, $2, $3, 8)
                            ,($1, $2, $3, 9)
                            ,($1, $2, $3, 10)
                            ,($1, $2, $3, 11)
                            ,($1, $2, $3, 12)
                            ,($1, $2, $3, 13)
                            ,($1, $2, $3, 14)
                            ,($1, $2, $3, 15)
                            ,($1, $2, $3, 16)
                            ,($1, $2, $3, 17)
                            ,($1, $2, $3, 18)
                            ,($1, $2, $3, 19)
                            ,($1, $2, $3, 20);`,
        [warehouseId, zone, floor]
      );
      console.log(warehouseId, zone, floor);
    }
  });
};

function genCharArray(charA, charZ) {
  var a = [],
    i = charA.charCodeAt(0),
    j = charZ.charCodeAt(0);
  for (; i <= j; ++i) {
    a.push(String.fromCharCode(i));
  }
  return a;
}
