import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass("bg-primary");
  });

  it("applies success variant", () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveClass("bg-green-100", "text-green-800");
  });

  it("applies destructive variant", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.firstChild).toHaveClass("bg-red-100", "text-red-800");
  });

  it("applies warning variant", () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    expect(container.firstChild).toHaveClass("bg-yellow-100", "text-yellow-800");
  });

  it("applies outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass("border");
  });

  it("merges custom className", () => {
    const { container } = render(<Badge className="custom-class">X</Badge>);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
