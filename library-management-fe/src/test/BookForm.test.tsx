import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookForm } from "../components/BookForm";

describe("BookForm", () => {
  it("shows validation errors when required fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<BookForm onSubmit={onSubmit} onCancel={() => {}} />);

    // Xoá giá trị mặc định của các trường bắt buộc rồi submit
    await user.clear(screen.getByLabelText(/Tên sách/i));
    await user.clear(screen.getByLabelText(/Tác giả/i));
    await user.click(screen.getByRole("button", { name: /Lưu lại/i }));

    expect(await screen.findByText(/Vui lòng nhập tên sách/i)).toBeInTheDocument();
    expect(await screen.findByText(/Vui lòng nhập tác giả/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits with the entered values once valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<BookForm onSubmit={onSubmit} onCancel={() => {}} />);

    await user.clear(screen.getByLabelText(/Tên sách/i));
    await user.type(screen.getByLabelText(/Tên sách/i), "Dế Mèn Phiêu Lưu Ký");
    await user.clear(screen.getByLabelText(/Tác giả/i));
    await user.type(screen.getByLabelText(/Tác giả/i), "Tô Hoài");

    await user.click(screen.getByRole("button", { name: /Lưu lại/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Dế Mèn Phiêu Lưu Ký",
        author: "Tô Hoài",
      }),
    );
  });
});
