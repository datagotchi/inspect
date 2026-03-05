import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Field from "../Field";

// Mock the external dependencies
const mockApi = {
  updateFieldValue: jest.fn(),
};
const mockSetNewNote = jest.fn();
const mockSetUpdatedNote = jest.fn();
const mockDeleteThisField = jest.fn();

jest.mock("../contexts/useUserContext", () => ({
  useUserContext: () => ({
    api: mockApi,
  }),
}));

jest.mock("../contexts/useFieldTransferContext", () => ({
  useFieldTransferContext: () => ({
    setNewNote: mockSetNewNote,
    newNote: { field_values: [{ id: 1, value: "initial" }] },
    setUpdatedNote: mockSetUpdatedNote,
  }),
}));

// Mock the EasyEdit component to control its behavior
jest.mock("react-easy-edit", () => (props: any) => (
  <div>
    <span>{props.value}</span>
    <button onClick={() => props.onSave("new value")}>Save</button>
  </div>
));

describe("Field component", () => {
  const mockFFV = {
    id: 1,
    name: "Test Field",
    value: "Test Value",
    field_id: 200,
  };
  const mockNoteId = 100;

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it("renders correctly with specified data", () => {
    render(
      <table>
        <tbody>
          <Field data={mockFFV} noteId={mockNoteId} />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Test Field:")).toBeInTheDocument();
    expect(screen.getByText("Test Value")).toBeInTheDocument();
  });

  describe("Editing functionality", () => {
    it("calls api.updateFieldValue when not staged", async () => {
      render(
        <table>
          <tbody>
            <Field data={mockFFV} isStaged={false} noteId={mockNoteId} />
          </tbody>
        </table>,
      );

      await userEvent.click(screen.getByText("Save"));

      expect(mockApi.updateFieldValue).toHaveBeenCalledWith(
        100,
        200,
        "new value",
      );
    });

    it("calls setNewNote when staged", async () => {
      render(
        <table>
          <tbody>
            <Field data={mockFFV} isStaged={true} noteId={mockNoteId} />
          </tbody>
        </table>,
      );

      await userEvent.click(screen.getByText("Save"));

      expect(mockSetNewNote).toHaveBeenCalled();
    });
  });

  describe("Deleting functionality", () => {
    it("calls deleteThisField and setUpdatedNote when not staged", async () => {
      mockDeleteThisField.mockResolvedValue({ success: true });
      render(
        <table>
          <tbody>
            <Field
              data={mockFFV}
              isStaged={false}
              deleteThisField={mockDeleteThisField}
              noteId={mockNoteId}
            />
          </tbody>
        </table>,
      );

      await userEvent.click(screen.getByTitle("Remove field"));

      expect(window.confirm).toHaveBeenCalledWith("Are you sure?");
      expect(mockDeleteThisField).toHaveBeenCalled();
      expect(mockSetUpdatedNote).toHaveBeenCalledWith({ success: true });
    });
  });
});
