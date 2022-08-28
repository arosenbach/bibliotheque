import * as sut from "../utils";

describe("dateDiffInDays()", () => {
  it.each`
    a               | b               | expected
    ${"2018-09-22"} | ${"2018-09-22"} | ${0}
    ${"2018-09-21"} | ${"2018-09-22"} | ${1}
    ${"2018-09-23"} | ${"2018-09-22"} | ${-1}
    ${"2019-09-22"} | ${"2018-09-22"} | ${-365}
  `("returns $expected when $a is compared to $b", ({ a, b, expected }) => {
    expect(sut.dateDiffInDays(new Date(a), new Date(b))).toBe(expected);
  });
});

describe("checkEnv()", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    console.error = jest.fn();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("doesn't do anything when all the env variable are present", () => {
    process.env.AN_ENVIRONMENT_VARIABLE = null;
    sut.checkEnv(["AN_ENVIRONMENT_VARIABLE"]);
    expect(console.error.mock.calls.length).toBe(0);
  });

  it("logs an error when an env variable is missing", () => {
    sut.checkEnv(["NOT_AN_ENVIRONMENT_VARIABLE"]);
    expect(console.error).toHaveBeenCalledWith(
      "Missing environment variable NOT_AN_ENVIRONMENT_VARIABLE"
    );
  });
});

describe("sortBy()", () => {
  it("sorts array of Object by a key", () => {
    expect(
      sut.sortBy("id")([
        {
          id: 42,
          name: "bob",
        },
        {
          id: 24,
          name: "adam",
        },
      ])
    ).toEqual([
      {
        id: 24,
        name: "adam",
      },
      {
        id: 42,
        name: "bob",
      },
    ]);
  });
});
