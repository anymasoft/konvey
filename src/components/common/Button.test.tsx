/**
 * Smoke test for Button — ensures the component renders and click works.
 * One vitest test in Sprint 0 to validate that the test infrastructure is wired.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders label", () => {
    render(<Button>Сохранить</Button>);
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Click me</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("applies primary variant class", () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole("button", { name: "Primary" });
    expect(btn.className).toContain("k-btn");
    expect(btn.className).toContain("primary");
  });

  it("respects disabled prop", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });
});
