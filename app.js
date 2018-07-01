let mod= require("http-server");
const port= process.env.PORT || 8080;
let server = mod.createServer( { root: "dist/" } );
server.listen(port);