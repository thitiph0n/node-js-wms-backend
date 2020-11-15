module.exports.sizeCalculator = (width, length, height, weight) => {
  let size, heaviness;
  const dimension = width * length * height;

  if (dimension <= 1953125) {
    size = 'SM';
  } else if (dimension <= 15625000) {
    size = 'MD';
  } else if (dimension <= 125000000) {
    size = 'LG';
  } else {
    size = 'XL';
  }

  if (weight < 50) {
    heaviness = 'L';
  } else if (weight < 100) {
    heaviness = 'M';
  } else {
    heaviness = 'H';
  }

  // calculate cube
  const cube = Math.ceil(dimension / 1953125);

  return { size, heaviness, cube };
};
