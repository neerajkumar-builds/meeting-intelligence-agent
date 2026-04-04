import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SendToSlack } from "@/components/shared/send-to-slack";

describe("SendToSlack", () => {
  it("renders the button", () => {
    render(<SendToSlack title="Test" body="Test body" />);
    expect(screen.getByText("Send to Slack")).toBeInTheDocument();
  });

  it("button is enabled by default", () => {
    render(<SendToSlack title="Test" body="Body" />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });
});
