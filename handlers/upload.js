import { URL, fileURLToPath } from 'url';
import { dirname } from 'path';

function uploadHandler(req, res) {
  console.log('Request received at /upload', req.files, req.method);

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.json({ status: "error", text: "No files were uploaded." });
  }

  const subjectFile = req.files.subjectFile;
  // const __dirname = dirname(new URL('..', import.meta.url).pathname);
  // const __dirname = dirname(fileURLToPath(import.meta.url))
  // console.log("THE dirname:", __dirname);
  // const uploadURL = __dirname + 'public/upload/' + subjectFile.name;
  // console.log("THE uploadURL:", uploadURL);
  // const uploadPath = fileURLToPath(uploadURL);
  const uploadUrl = dirname(import.meta.url) + '/../public/upload/' + subjectFile.name;
  console.log("THE uploadUrl:", uploadUrl);
  const uploadPath = fileURLToPath(uploadUrl);
  console.log("THE uploadPath:", uploadPath);

  const path = '/upload/' + subjectFile.name;

  // Use the mv() method to place the file somewhere on your server
  subjectFile.mv(uploadPath, function (err) {
    if (err) {
      console.log("Error al cargar archivo", err);
      return res.status(500).send(err);
    }

    res.json({ status: "ok", text: "File uploaded!", path });
  });
}


export default uploadHandler;