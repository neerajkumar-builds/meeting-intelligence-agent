import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBadge } from "@/components/shared/score-badge";
import { StageTypeBadge } from "@/components/shared/stage-type-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";

describe("ScoreBadge", () => {
  it("renders score value for valid score", () => {
    render(<ScoreBadge score={8.5} />);
    expect(screen.getByText("8.5")).toBeInTheDocument();
  });

  it("renders dash for null score", () => {
    render(<ScoreBadge score={null} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("applies green style for high scores (8+)", () => {
    const { container } = render(<ScoreBadge score={9} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("emerald");
  });

  it("applies yellow style for medium scores (6-7.9)", () => {
    const { container } = render(<ScoreBadge score={7} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("yellow");
  });

  it("applies red style for low scores (<6)", () => {
    const { container } = render(<ScoreBadge score={4} />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("red");
  });

  it("renders with different sizes", () => {
    const { rerender, container } = render(<ScoreBadge score={8} size="sm" />);
    expect(container.querySelector("span")?.className).toContain("text-xs");

    rerender(<ScoreBadge score={8} size="lg" />);
    expect(container.querySelector("span")?.className).toContain("text-base");
  });
});

describe("StageTypeBadge", () => {
  it("renders stage label", () => {
    render(<StageTypeBadge stage="discovery_scoping" />);
    expect(screen.getByText("Discovery")).toBeInTheDocument();
  });

  it("renders Unknown for null stage", () => {
    render(<StageTypeBadge stage={null} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("renders all 4 stage types", () => {
    const stages = ["discovery_scoping", "follow_up", "onboarding", "internal"];
    const labels = ["Discovery", "Follow-Up", "Onboarding", "Internal"];

    for (let i = 0; i < stages.length; i++) {
      const { unmount } = render(<StageTypeBadge stage={stages[i]} />);
      expect(screen.getByText(labels[i])).toBeInTheDocument();
      unmount();
    }
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={CalendarDays}
        title="No meetings"
        description="Check back later."
      />
    );
    expect(screen.getByText("No meetings")).toBeInTheDocument();
    expect(screen.getByText("Check back later.")).toBeInTheDocument();
  });

  it("renders optional action", () => {
    render(
      <EmptyState
        icon={CalendarDays}
        title="Empty"
        description="Nothing here."
        action={<button>Add Item</button>}
      />
    );
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });
});
