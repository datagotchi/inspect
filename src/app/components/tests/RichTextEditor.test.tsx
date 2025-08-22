import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import RichTextEditor from "../RichTextEditor";

describe("RichTextEditor", () => {
  let setHtmlMock: jest.Mock;

  beforeEach(() => {
    setHtmlMock = jest.fn();
    // HTMLDialogElement not supported in jsdom
    // solution from: https://github.com/jsdom/jsdom/issues/3294#issuecomment-2499134049
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function (returnValue: any) {
        this.open = false;
        this.returnValue = returnValue;
      };
    }
  });

  it("renders the editor with initial HTML content", async () => {
    render(
      <RichTextEditor html="<p>Initial content</p>" setHtml={setHtmlMock} />,
    );

    const editableDiv: HTMLDivElement = document.querySelector(
      "[contenteditable='true']",
    )!;
    await waitFor(() => expect(editableDiv.firstChild?.nodeName).toBe("P"));
  });

  it("opens the insert link dialog", () => {
    const { getByAltText } = render(
      <RichTextEditor html="Some text" setHtml={setHtmlMock} />,
    );

    const linkButton = getByAltText("Insert Link");
    fireEvent.click(linkButton);

    const dialog = document.getElementById("insertLinkDialog");
    expect(dialog).toBeVisible();
  });

  it("updates HTML content on input", () => {
    const { container } = render(
      <RichTextEditor html="<p>Initial content</p>" setHtml={setHtmlMock} />,
    );

    const editableDiv = container.querySelector("[contenteditable='true']")!;
    fireEvent.input(editableDiv, {
      target: { innerHTML: "<p>New content</p>" },
    });

    expect(setHtmlMock).toHaveBeenCalledWith("<p>New content</p>");
  });
});
