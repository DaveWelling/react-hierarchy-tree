let mod= require("http-server");
const port= 80;
let server = mod.createServer( { root: "dist/" } );
server.listen(port);