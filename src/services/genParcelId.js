module.exports.genParcelId = (size, runningNum) => {
  // Zero fill
  let numStr = '0000000' + runningNum.toString();
  numStr = numStr.substr(numStr.length - 8);

  return size.size + size.heaviness + numStr;
};
