import Notifier from "../notifier";
import sgMail from "@sendgrid/mail";

jest.mock("@sendgrid/mail");
sgMail.setApiKey = jest.fn();

jest.mock("../utils", () => ({
  checkEnv: jest.fn(),
}));

describe("Notifier", () => {
  let info;
  let error;
  beforeEach(() => {
    info = jest.spyOn(console, "info").mockImplementation(() => {});
    error = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    info.mockReset();
    error.mockReset();
  });

  describe("sendMessage()", () => {
    it("logs an info message when no errors occur", async () => {
        sgMail.send.mockResolvedValue();

        const sender = "from@mail.com";
        const recipients = ["to1@mail.com", "to2@mail.com"];
        const sut = new Notifier(sender, recipients);
        const subject = "a subject";
        await sut.sendMessage(subject, "a message body");
        expect(info).toBeCalledWith(`Message sent with subject "${subject}"`);
    });

    it("logs an error message when an error occurs", async () => {
        const errorMessage = 'no bueno'
        sgMail.send.mockRejectedValue(errorMessage);

        const sender = "from@mail.com";
        const recipients = ["to1@mail.com", "to2@mail.com"];
        const sut = new Notifier(sender, recipients);
        const subject = "a subject";
        await sut.sendMessage(subject, "a message body");
        expect(error).toBeCalledWith(errorMessage);
    });
  });
});
