export default function handler(req, res) {
  const { exec } = require("child_process");
  exec("yarn run:all", (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
  res.status(200).end("Hello Cron!");
}
