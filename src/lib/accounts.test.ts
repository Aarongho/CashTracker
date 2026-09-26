import { describe, expect, it } from "vitest";
import { accountForSender, gmailQueryForAccounts } from "./accounts";

const banks = [{ name: "BCA" }, { name: "GoPay" }];

describe("accounts", () => {
  it("routes emails to the account that sent them", () => {
    expect(accountForSender(banks, "BCA <bca@bca.co.id>")?.name).toBe("BCA");
    expect(accountForSender(banks, "Gojek <no-reply@gojek.com>")?.name).toBe("GoPay");
    expect(accountForSender(banks, "Apple <no_reply@email.apple.com>")).toBeNull();
    expect(accountForSender(banks, "OVO <no-reply@ovo.id>")).toBeNull();
  });

  it("only searches the user's own accounts", () => {
    const q = gmailQueryForAccounts([{ name: "BCA" }], 100)!;
    expect(q).toContain("from:bca.co.id");
    expect(q).not.toContain("gojek");
    expect(gmailQueryForAccounts([], 100)).toBeNull();
  });

  it("matches custom accounts by name", () => {
    expect(accountForSender([{ name: "Bank Neo" }], "Bank Neo Commerce <info@bankneo.co.id>")?.name).toBe("Bank Neo");
  });
});
