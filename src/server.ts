import app from "./app";
import config from "./config/db";

import { initDB } from "./db";

const port = config.port;

const main = () => {
  initDB();
  app.listen(port, () => {
    console.log(`DevPulse app listening on port ${port}`);
  });
};

main();
