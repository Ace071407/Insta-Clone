let multer = require('multer');
let path = require('path');
let {v4:uuidv4}=require('uuid');

let storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null , './public/images/uploads');
    },
    filename: function(req,file,cb){
        let uniqueName = uuidv4();
        cb(null,uniqueName+path.extname(file.originalname));
    }
});
const upload = multer({storage:storage});
module.exports = upload;