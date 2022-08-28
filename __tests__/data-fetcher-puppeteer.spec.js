import DataFetcher from "./data-fetcher-puppeteer";
import puppeteer from "puppeteer";

const dateInNDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const BIBLIOTHEQUE_MEYLAN = {
  url: "meylan.com",
  name: "Meylan",
};
const BIBLIOTHEQUE_MONTBONNOT = {
  url: "montbonnot.com",
  name: "Montbonnot",
};

const memjsClientStub = {
  set: () => {},
};

describe("DataFetcher.run()", () => {
  beforeEach(() => {
    puppeteer.__setFakeData([]);
  });

  it("lastRunDate value is today", async () => {
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: [
        {
          coverUrl: "http://image.com/book1.png",
          date: dateInNDays(3),
          title: "Book meylan 1",
        },
      ],
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const loanData = await sut.run();
    const lastRunDate = new Date(loanData.lastRun);
    lastRunDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(lastRunDate).toStrictEqual(today);
  });

  it.each`
    run  | credentials
    ${1} | ${[BIBLIOTHEQUE_MEYLAN]}
    ${2} | ${[BIBLIOTHEQUE_MEYLAN, BIBLIOTHEQUE_MONTBONNOT]}
    ${3} | ${[BIBLIOTHEQUE_MEYLAN, BIBLIOTHEQUE_MONTBONNOT, BIBLIOTHEQUE_MONTBONNOT]}
    ${4} | ${[]}
  `(
    "data.length is the same as credentials.length (run $run)",
    async ({ credentials }) => {
      puppeteer.__setFakeData({
        [BIBLIOTHEQUE_MEYLAN.url]: [
          {
            coverUrl: "http://image.com/book1.jpg",
            date: dateInNDays(5),
            title: "Book meylan 1",
          },
        ],
        [BIBLIOTHEQUE_MONTBONNOT.url]: [
          {
            coverUrl: "http://image.com/book2.jpg",
            date: dateInNDays(1),
            title: "Book montbonnot 1",
          },
        ],
      });

      const sut = new DataFetcher(memjsClientStub, credentials);
      const { data } = await sut.run();
      expect(data.length).toStrictEqual(credentials.length);
    }
  );

  it("data.name is same as credentials.name", async () => {
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: [
        {
          coverUrl: "http://image.com/book1.png",
          date: dateInNDays(3),
          title: "Book meylan 1",
        },
      ],
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    expect(data[0].name).toStrictEqual(BIBLIOTHEQUE_MEYLAN.name);
  });

  it("data[0].name is same as credentials.name", async () => {
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: [
        {
          coverUrl: "http://image.com/book1.png",
          date: dateInNDays(3),
          title: "Book meylan 1",
        },
      ],
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    expect(data[0].name).toStrictEqual(BIBLIOTHEQUE_MEYLAN.name);
  });

  it("data[0].count", async () => {
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: [
        {
          coverUrl: "http://image.com/book1.png",
          date: dateInNDays(3),
          title: "Book meylan 1",
        },
        {
          coverUrl: "http://image.com/book2.png",
          date: dateInNDays(3),
          title: "Book meylan 2",
        },
        {
          coverUrl: "http://image.com/book3.png",
          date: dateInNDays(3),
          title: "Book meylan 3",
        },
      ],
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    expect(data[0].count).toStrictEqual(3);
  });

  it("data[0].remainingDays is min(loans.days)", async () => {
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: [
        {
          coverUrl: "http://image.com/book1.png",
          date: dateInNDays(12),
          title: "Book meylan 1",
        },
        {
          coverUrl: "http://image.com/book2.png",
          date: dateInNDays(-3),
          title: "Book meylan 2",
        },
        {
          coverUrl: "http://image.com/book3.png",
          date: dateInNDays(0),
          title: "Book meylan 3",
        },
      ],
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    expect(data[0].remainingDays).toStrictEqual(-3);
  });

  it("data[0].loans coverUrl", async () => {
    const fakeLoans = [
      {
        coverUrl: "http://image.com/book1.png",
        date: dateInNDays(3),
        title: "Book meylan 1",
      },
      {
        coverUrl: "http://image.com/book2.png",
        date: dateInNDays(3),
        title: "Book meylan 2",
      },
      {
        coverUrl: "http://image.com/book3.png",
        date: dateInNDays(3),
        title: "Book meylan 3",
      },
    ];
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: fakeLoans,
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    const extractCoverUrl = (data) => data.coverUrl;
    expect(data[0].loans.map(extractCoverUrl)).toStrictEqual(
      fakeLoans.map(extractCoverUrl)
    );
  });

  it("data[0].loans title", async () => {
    const fakeLoans = [
      {
        coverUrl: "http://image.com/book1.png",
        date: dateInNDays(3),
        title: "Book meylan 1",
      },
      {
        coverUrl: "http://image.com/book2.png",
        date: dateInNDays(3),
        title: "Book meylan 2",
      },
      {
        coverUrl: "http://image.com/book3.png",
        date: dateInNDays(3),
        title: "Book meylan 3",
      },
    ];
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: fakeLoans,
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    const extractTitle = (data) => data.title;
    expect(data[0].loans.map(extractTitle)).toStrictEqual(
      fakeLoans.map(extractTitle)
    );
  });

  it("data[0].loans days", async () => {
    const expectedDays = 3;
    const fakeLoans = [
      {
        coverUrl: "http://image.com/book1.png",
        date: dateInNDays(expectedDays),
        title: "Book meylan 1",
      },
    ];
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: fakeLoans,
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    expect(data[0].loans[0].days).toStrictEqual(expectedDays);
  });

  it("data[0].loans is sorted by days", async () => {
    const loan1 = {
      coverUrl: "http://image.com/book1.png",
      date: dateInNDays(3),
      title: "Book meylan 1",
    };
    const loan2 = {
      coverUrl: "http://image.com/book2.png",
      date: dateInNDays(-1),
      title: "Book meylan 2",
    };
    const loan3 = {
      coverUrl: "http://image.com/book3.png",
      date: dateInNDays(1),
      title: "Book meylan 3",
    };
    const fakeLoans = [loan1, loan2, loan3];
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: fakeLoans,
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    const extractTitle = (data) => data.title;
    expect(data[0].loans.map(extractTitle)).toStrictEqual(
      [loan2, loan3, loan1].map(extractTitle)
    );
  });

  it("data is sorted by remainingDays", async () => {
    puppeteer.__setFakeData({
      [BIBLIOTHEQUE_MEYLAN.url]: [
        {
          coverUrl: "http://image.com/book1.png",
          date: dateInNDays(3),
          title: "Book meylan 1",
        },
      ],
      [BIBLIOTHEQUE_MONTBONNOT.url]: [
        {
          coverUrl: "http://image.com/book2.png",
          date: dateInNDays(-1),
          title: "Book montbonnot 2",
        },
      ],
    });
    const credentials = [BIBLIOTHEQUE_MEYLAN, BIBLIOTHEQUE_MONTBONNOT];

    const sut = new DataFetcher(memjsClientStub, credentials);
    const { data } = await sut.run();

    const extractName = (d) => d.name;
    expect(data.map(extractName)).toStrictEqual([
      BIBLIOTHEQUE_MONTBONNOT.name,
      BIBLIOTHEQUE_MEYLAN.name,
    ]);
  });
});
