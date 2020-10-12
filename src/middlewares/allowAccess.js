function allowAccess(roles) {
  return (req, res, next) => {
    let isValid = false;
    roles.map((role) => {
      if (req.authData.position === role) {
        isValid = true;
        return next();
      }
    });
    if (!isValid) {
      res.status(403).send({
        errors: [{ message: 'You don’t have permission to access this path' }],
      });
    }
  };
}

module.exports = allowAccess;
