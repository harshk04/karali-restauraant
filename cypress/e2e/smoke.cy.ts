describe("Karali smoke", () => {
  it("loads the home page", () => {
    cy.visit("/");
    cy.contains("Reserve your seat before you fly.").should("be.visible");
  });
});
