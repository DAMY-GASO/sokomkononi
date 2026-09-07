const app = require("./app");
const { port } = require("./config/env");

app.listen(port, () => {
  console.log(`SokoMkononi API inaendesha kwenye port ${port}`);
});
