module.exports.genWarehouseId = (runningNum) => {
  // Zero fill
  let numStr = '000' + runningNum.toString();
  numStr = numStr.substr(numStr.length - 3);

  return 'WH' + numStr;
};
