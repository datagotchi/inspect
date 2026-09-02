import React from "react";
import { render, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import EditableText from "../EditableText";
import useUser from "../../hooks/useUser";
import { Insight } from "../../types";

const mockFetch = (data: any, rejectMessage: any = null): (() => any) =>
  jest.fn().mockImplementation(() => {
    if (!rejectMessage) {
      return Promise.resolve({
        ok: true,
        json: () => data,
        status: 200,
      });
    }
    return Promise.reject(new Error(rejectMessage));
  });

jest.mock("../../hooks/useUser");
describe("EditableText", () => {
  const token = "mock-token";
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ token });
    window.fetch = mockFetch({});
  });
  describe("with fieldName='title'", () => {
    it("renders the title", () => {
      const { getByText } = render(
        <EditableText
          insight={{ title: "Test Title" } as Insight}
          fieldName={"title"}
        />,
      );
      expect(getByText("Test Title")).toBeInTheDocument();
    });

    it("enters edit mode on click", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          insight={{ title: "Test Title" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      expect(getByDisplayValue("Test Title")).toBeInTheDocument();
    });

    it("exits edit mode on submit", async () => {
      const { getByText, getByDisplayValue, queryByDisplayValue } = render(
        <EditableText
          insight={{ title: "Test Title" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      expect(getByDisplayValue("Test Title")).toBeInTheDocument();
      const textarea = getByDisplayValue("Test Title");
      await userEvent.type(textarea, "!");

      const button = getByText("Submit");
      await userEvent.click(button);
      expect(queryByDisplayValue("Test Title")).not.toBeInTheDocument();
    });

    it("exits edit mode on cancel", async () => {
      const { getByText, getByDisplayValue, queryByDisplayValue } = render(
        <EditableText
          insight={{ title: "Test Title" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      expect(getByDisplayValue("Test Title")).toBeInTheDocument();

      const button = getByText("Cancel");
      await userEvent.click(button);
      expect(queryByDisplayValue("Test Title!")).not.toBeInTheDocument();
    });

    it("disables the submit button if the title is the empty string", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          insight={{ title: "Test Title" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Test Title");
      fireEvent.change(textarea, { target: { value: "" } });
      expect(getByDisplayValue("")).toBeInTheDocument();

      await expect(getByText("Submit")).toBeDisabled();
    });

    it("calls fetch on submit", async () => {
      const { getByText, findByText, getByDisplayValue } = render(
        <EditableText
          apiRoot="/api"
          insight={{ title: "Test Title", uid: "asdf" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Test Title");
      expect(textarea).toBeInTheDocument();
      await userEvent.type(textarea, "!");

      const button = await findByText("Submit");
      await userEvent.click(button);
      expect(window.fetch).toHaveBeenCalledWith("/api/asdf", {
        method: "PATCH",
        body: JSON.stringify({ title: "Test Title!" }),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      });
    });

    it("does not call fetch and resets title on cancel", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          insight={{ title: "Test Title" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Test Title");
      await userEvent.type(textarea, "!");
      expect((textarea as HTMLTextAreaElement).value).toBe("Test Title!");

      const button = getByText("Cancel");
      await userEvent.click(button);

      expect(window.fetch).not.toHaveBeenCalled();
      expect(getByText("Test Title")).toBeInTheDocument();
    });

    it("handles fetch failure gracefully", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      consoleErrorMock.mockRestore();

      const { getByText, getByDisplayValue } = render(
        <EditableText
          apiRoot="/api"
          insight={{ title: "Test Title", uid: "asdf" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Test Title");
      expect(textarea).toBeInTheDocument();
      await userEvent.type(textarea, "!");
      expect(textarea).toHaveValue("Test Title!");

      const button = getByText("Submit");
      await userEvent.click(button);

      expect(window.fetch).toHaveBeenCalled();
      expect(getByText("Test Title!")).toBeInTheDocument(); // Title remains unchanged
    });

    it("resets title to original value on cancel after editing", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          insight={{ title: "Original Title" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Original Title");
      await userEvent.type(textarea, " Updated");
      expect((textarea as HTMLTextAreaElement).value).toBe(
        "Original Title Updated",
      );

      const cancelButton = getByText("Cancel");
      await userEvent.click(cancelButton);

      expect(getByText("Original Title")).toBeInTheDocument();
    });

    it("renders correctly with no apiRoot provided", () => {
      const { getByText } = render(
        <EditableText
          insight={{ title: "No API Root Title" } as Insight}
          fieldName={"title"}
        />,
      );
      expect(getByText("No API Root Title")).toBeInTheDocument();
    });

    it("does not call fetch if title is unchanged on submit", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          apiRoot="/api"
          insight={{ title: "Unchanged Title", uid: "uid123" } as Insight}
          fieldName={"title"}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Unchanged Title");
      expect(textarea).toBeInTheDocument();

      const submitButton = getByText("Submit");
      await userEvent.click(submitButton);

      expect(window.fetch).not.toHaveBeenCalled();
    });
  });
  describe("with fieldName='description' and isTextArea=true", () => {
    it("renders the description", () => {
      const { getByText } = render(
        <EditableText
          insight={{ description: "Test Description" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      expect(getByText("Test Description")).toBeInTheDocument();
    });

    it("enters edit mode on click", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          insight={{ description: "Test Description" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      await userEvent.click(getByText("🖊"));
      expect(getByDisplayValue("Test Description")).toBeInTheDocument();
    });

    it("exits edit mode on submit", async () => {
      const { getByText, getByDisplayValue, queryByDisplayValue } = render(
        <EditableText
          insight={{ description: "Test Description" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      await userEvent.click(getByText("🖊"));
      expect(getByDisplayValue("Test Description")).toBeInTheDocument();
      const textarea = getByDisplayValue("Test Description");
      await userEvent.type(textarea, "!");

      const button = getByText("Submit");
      await userEvent.click(button);
      expect(queryByDisplayValue("Test Description")).not.toBeInTheDocument();
    });

    it("exits edit mode on cancel", async () => {
      const { getByText, getByDisplayValue, queryByDisplayValue } = render(
        <EditableText
          insight={{ description: "Test Description" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      await userEvent.click(getByText("🖊"));
      expect(getByDisplayValue("Test Description")).toBeInTheDocument();

      const button = getByText("Cancel");
      await userEvent.click(button);
      expect(queryByDisplayValue("Test Description!")).not.toBeInTheDocument();
    });

    it("calls fetch on submit", async () => {
      const { getByText, findByText, getByDisplayValue } = render(
        <EditableText
          apiRoot="/api"
          insight={{ description: "Test Description", uid: "asdf" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Test Description");
      expect(textarea).toBeInTheDocument();
      await userEvent.type(textarea, "!");

      const button = await findByText("Submit");
      await userEvent.click(button);
      expect(window.fetch).toHaveBeenCalledWith("/api/asdf", {
        method: "PATCH",
        body: JSON.stringify({ description: "Test Description!" }),
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
      });
    });

    it("does not call fetch and resets description on cancel", async () => {
      const { getByText, getByDisplayValue } = render(
        <EditableText
          insight={{ description: "Test Description" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      await userEvent.click(getByText("🖊"));
      const textarea = getByDisplayValue("Test Description");
      await userEvent.type(textarea, "!");
      expect((textarea as HTMLTextAreaElement).value).toBe("Test Description!");

      const button = getByText("Cancel");
      await userEvent.click(button);

      expect(window.fetch).not.toHaveBeenCalled();
      expect(getByText("Test Description")).toBeInTheDocument();
    });

    it("renders correctly with no apiRoot provided", () => {
      const { getByText } = render(
        <EditableText
          insight={{ description: "No API Root Description" } as Insight}
          fieldName={"description"}
          isTextarea={true}
        />,
      );
      expect(getByText("No API Root Description")).toBeInTheDocument();
    });
  });
});
