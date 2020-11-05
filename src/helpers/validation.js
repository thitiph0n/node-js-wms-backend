const Joi = require('joi');

//New user validation
const newUserValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string()
      .length(5)
      .pattern(/^[0-9]+$/, 'numbers')
      .required(),
    firstName: Joi.string().min(2).max(255).required(),
    lastName: Joi.string().min(2).max(255).required(),
    position: Joi.string()
      .pattern(/^[a-z]+$/, 'lowercase')
      .required(),
    address: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    city: Joi.string().required(),
    phone: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/, 'numbers')
      .required(),
    warehouseId: Joi.string().required(),
    dob: Joi.date().required(),
    gender: Joi.string()
      .pattern(/^[a-z]+$/, 'lowercase')
      .required(),
    email: Joi.string().required(),
  }).options({ abortEarly: false });

  return schema.validate(data);
};

//Edit user validation
const editUserValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(255).required(),
    lastName: Joi.string().min(2).max(255).required(),
    address: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    city: Joi.string().required(),
    phone: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/, 'numbers')
      .required(),
    warehouseId: Joi.string().required(),
    dob: Joi.date().required(),
    gender: Joi.string()
      .pattern(/^[a-z]+$/, 'lowercase')
      .required(),
    email: Joi.string().required(),
  }).options({ abortEarly: false });

  return schema.validate(data);
};

//Login validation
const loginValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string()
      .length(5)
      .pattern(/^[0-9]+$/, 'numbers')
      .required(),
    password: Joi.string().min(6).max(24).required(),
  }).options({ abortEarly: false });

  return schema.validate(data);
};

module.exports.newUserValidation = newUserValidation;
module.exports.loginValidation = loginValidation;
module.exports.editUserValidation = editUserValidation;
