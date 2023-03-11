import * as dotenv from "dotenv";
dotenv.config();

// a and b are javascript Date objects
const dateDiffInDays = (a, b) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

const checkEnv = (variables) => {
  variables.forEach((variable) => {
    if (process.env[variable] === undefined) {
      console.error(`Missing environment variable ${variable}`);
    }
  });
};

const sortBy = (field) => (data) => data.sort((a, b) => a[field] - b[field]);

function debug() {
  if (process.env.BIBLIO_DEBUG === "1") {
    console.log(...arguments);
  }
}

const fakeMemCacheClient = {
  set: () => {
    console.log("CACHE DISABLED (DEBUG MODE)");
  },
  get: () => ({
    value: undefined,
  }),
  delete: () => undefined,
};

export { dateDiffInDays, checkEnv, sortBy, debug, fakeMemCacheClient };
