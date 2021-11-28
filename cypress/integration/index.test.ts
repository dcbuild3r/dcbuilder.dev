describe("Index page", () => {
	it("should render", function () {
		cy.visit("/");
		cy.contains("Hello");
	});
});
