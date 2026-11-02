import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Shell } from "../Shell";
import { resetModel, updateInputs } from "@/state/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
beforeEach(() => act(() => resetModel()));

describe("static downloads notice", () => {
  it("appears only after assumptions are edited and says downloads are unchanged", () => {
    render(<Shell>x</Shell>);
    expect(screen.queryByText("Downloads have not changed.")).toBeNull();
    act(() => updateInputs((d) => { d.checkSize = 250; }));
    const n = screen.getByText("Downloads have not changed.");
    expect(n.parentElement).toHaveTextContent(/does not update from website inputs/);
    act(() => resetModel());
    expect(screen.queryByText("Downloads have not changed.")).toBeNull();
  });
});
