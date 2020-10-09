const Joi = require('joi');

//New user validation
const newUserValidation = (data) => {
  const schema = Joi.object({
    user_id: Joi.string()
      .length(5)
      .pattern(/^[0-9]+$/, 'numbers')
      .required(),
    firstname: Joi.string().min(2).max(255).required(),
    lastname: Joi.string().min(2).max(255).required(),
    position: Joi.string()
      .pattern(/^[a-z]+$/, 'lowercase')
      .required(),
    password: Joi.string().min(6).max(24).required(),
  }).options({ abortEarly: false });

  return schema.validate(data);
};

//Login validation
const loginValidation = (data) => {
  const schema = Joi.object({
    user_id: Joi.string()
      .length(5)
      .pattern(/^[0-9]+$/, 'numbers')
      .required(),
    password: Joi.string().min(6).max(24).required(),
  }).options({ abortEarly: false });

  return schema.validate(data);
};

module.exports.newUserValidation = newUserValidation;
module.exports.loginValidation = loginValidation;
