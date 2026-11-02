import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AllocationView } from "../AllocationView";
import { OverviewView } from "../OverviewView";
import { OpportunitiesView } from "../OpportunitiesView";
import { resetModel, updateInputs } from "@/state/store";

beforeEach(() => act(() => resetModel()));

describe("components", () => {
  it("overview computes headline figures from the engine", () => {
    render(<OverviewView />);
    expect(screen.getByTestId("conclusion")).toHaveTextContent("Neither company clears");
    expect(screen.getAllByText("8.1%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$2.92B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$2.02B").length).toBeGreaterThan(0);
  });
  it("editing an input updates outputs; reset restores", () => {
    render(<AllocationView />);
    const verdict = () => screen.getByTestId("verdict").textContent;
    expect(verdict()).toContain("8.1%");
    fireEvent.change(screen.getByLabelText("Pre-money valuation", { selector: "input[type=number]" }), { target: { value: "2000" } });
    expect(verdict()).toContain("clears the screen");
    act(() => resetModel());
    expect(verdict()).toContain("8.1%");
  });
  it("shows negative returns", () => {
    render(<AllocationView />);
    fireEvent.click(screen.getByRole("radio", { name: "Bear" }));
    expect(screen.getByTestId("verdict").textContent).toContain("-13.9%");
  });
  it("secondary entry changes ownership basis", () => {
    render(<AllocationView />);
    fireEvent.click(screen.getByRole("radio", { name: /Secondary/ }));
    expect(screen.getAllByText("2.00%").length).toBeGreaterThan(0);
  });
  it("opportunities filter and search; non-focus companies get no scores", () => {
    render(<OpportunitiesView />);
    expect(screen.getByTestId("count")).toHaveTextContent("16 of 16");
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "india" } });
    expect(screen.getByTestId("count")).toHaveTextContent("Showing 2 of 16");
    expect(screen.getAllByText(/Initial coverage only/).length).toBe(2);
  });
  it("store survives corrupt persisted state", () => {
    act(() => updateInputs((d) => { d.checkSize = 250; }));
    expect(JSON.parse(localStorage.getItem("frontier-trust:model:v1")!).inputs.checkSize).toBe(250);
  });
});
