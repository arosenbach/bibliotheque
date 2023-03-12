import { exec } from "child_process";

export default function handler(req, res) {
  exec("yarn run:all", (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.status(500).err(err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
  res.status(200).end(`stdout: ${stdout}
  
  stderr: ${stderr}
  `);
}
