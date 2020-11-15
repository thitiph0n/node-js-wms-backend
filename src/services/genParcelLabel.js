let path = require('path');
const { v4: uuidV4 } = require('uuid');
const fs = require('fs');
const ejs = require('ejs');
const pdf = require('html-pdf');
const s3 = require('../helpers/s3');

module.exports.genParcelLabel = async (labelData) => {
  try {
    //read template
    const filePathName = path.resolve(
      __dirname,
      '../template',
      'parcelLabel.ejs'
    );
    const htmlString = fs.readFileSync(filePathName).toString();

    //Create pdf
    let options = { height: '150mm', width: '100mm' };
    const ejsData = ejs.render(htmlString, labelData);

    return new Promise((resolve, reject) => {
      pdf.create(ejsData, options).toStream((err, stream) => {
        if (err) return console.log(err);
        const uploadParams = {
          Bucket: 'wms-backend',
          Key: uuidV4() + '.pdf',
          ACL: 'public-read',
          Body: stream,
        };
        //Upload to bucket
        return s3.upload(uploadParams, (err, data) => {
          if (err) return reject(err);
          resolve(data.Location);
        });
      });
    });
  } catch (err) {
    console.log('Error processing request: ' + err);
    throw err;
  }
};
